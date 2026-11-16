import { revalidateTag } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getViewer } from "@/lib/auth-guards";
import { getDb, hasDatabase } from "@/lib/db";
import { orderApprovals, purchaseOrders } from "@/lib/db/schema";
import { applyTransition } from "@/lib/workflow-db";
import type { WeftRole } from "@/lib/permissions";

const decisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(200).optional(),
});

type Context = { params: Promise<{ id: string; approvalId: string }> };

export async function POST(request: Request, { params }: Context) {
  const viewer = await getViewer();
  if (!viewer.authenticated) {
    return Response.json({ error: "Sign in required." }, { status: 401 });
  }
  const role = viewer.role as WeftRole;
  if (role !== "owner" && role !== "admin") {
    return Response.json({ error: "Only owners and admins can decide approvals." }, { status: 403 });
  }
  if (!hasDatabase()) {
    return Response.json({ error: "Approvals need a configured database." }, { status: 503 });
  }

  const { id, approvalId } = await params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = decisionSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid approval decision." }, { status: 422 });
  }

  const db = getDb();
  const [approval] = await db
    .select()
    .from(orderApprovals)
    .where(
      and(
        eq(orderApprovals.id, approvalId),
        eq(orderApprovals.orderId, id),
        eq(orderApprovals.organizationId, viewer.orgId),
      ),
    )
    .limit(1);

  if (!approval) {
    return Response.json({ error: "Approval not found." }, { status: 404 });
  }
  if (approval.decision !== "pending") {
    return Response.json({ error: "This approval was already decided." }, { status: 409 });
  }

  const actor = viewer.email ?? viewer.userId ?? "unknown";
  const decidedAt = new Date().toISOString();

  if (parsed.data.decision === "approved") {
    const [current] = await db
      .select()
      .from(purchaseOrders)
      .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.organizationId, viewer.orgId)))
      .limit(1);

    if (!current) {
      return Response.json({ error: "Purchase order not found." }, { status: 404 });
    }

    const result = await applyTransition({
      organizationId: viewer.orgId,
      orderId: id,
      from: current.status,
      to: approval.requestedStatus,
      role,
      actor,
      note: parsed.data.note ?? approval.note,
    });

    if (!result.ok) {
      return Response.json({ error: result.reason }, { status: result.status ?? 422 });
    }
  }

  await db
    .update(orderApprovals)
    .set({
      decision: parsed.data.decision,
      decidedBy: actor,
      decidedAt,
      note: parsed.data.note || approval.note,
    })
    .where(and(eq(orderApprovals.id, approvalId), eq(orderApprovals.organizationId, viewer.orgId)));

  revalidateTag(`approvals-${id}`, "max");
  return Response.json({ approvalId, decision: parsed.data.decision });
}
