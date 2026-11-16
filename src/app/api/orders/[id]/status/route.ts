import { revalidateTag } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getViewer, hasPermission } from "@/lib/auth-guards";
import { ORDER_STATUSES } from "@/lib/constants";
import { getDb, hasDatabase } from "@/lib/db";
import { orderApprovals, purchaseOrders } from "@/lib/db/schema";
import { applyTransition } from "@/lib/workflow-db";
import { checkTransition, requiresApproval } from "@/lib/workflow";
import { dispatchWebhook } from "@/lib/webhooks";
import type { WeftRole } from "@/lib/permissions";

const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(200).optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const viewer = await getViewer();
  if (!viewer.authenticated) {
    return Response.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!hasPermission(viewer, "order", "status")) {
    return Response.json({ error: "Your role cannot change order status." }, { status: 403 });
  }
  if (!hasDatabase()) {
    return Response.json({ error: "Status changes need a configured database." }, { status: 503 });
  }

  const { id } = await params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid status update." }, { status: 422 });
  }

  const db = getDb();
  const [current] = await db
    .select()
    .from(purchaseOrders)
    .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.organizationId, viewer.orgId)))
    .limit(1);

  if (!current) {
    return Response.json({ error: "Purchase order not found." }, { status: 404 });
  }
  if (current.status === parsed.data.status) {
    return Response.json({ order: current, unchanged: true });
  }

  const role = viewer.role as WeftRole;
  const check = checkTransition(current.status, parsed.data.status, role);
  if (!check.ok) {
    return Response.json({ error: check.reason }, { status: 422 });
  }

  const actor = viewer.email ?? viewer.userId ?? "unknown";

  if (requiresApproval(parsed.data.status, role)) {
    const [existing] = await db
      .select({ id: orderApprovals.id })
      .from(orderApprovals)
      .where(
        and(
          eq(orderApprovals.orderId, id),
          eq(orderApprovals.organizationId, viewer.orgId),
          eq(orderApprovals.requestedStatus, parsed.data.status),
          eq(orderApprovals.decision, "pending"),
        ),
      )
      .limit(1);

    if (!existing) {
      await db.insert(orderApprovals).values({
        id: crypto.randomUUID(),
        organizationId: viewer.orgId,
        orderId: id,
        requestedStatus: parsed.data.status,
        requestedBy: actor,
        requestedAt: new Date().toISOString(),
        note: parsed.data.note ?? null,
      });
      revalidateTag(`approvals-${id}`, "max");
    }

    return Response.json(
      { approvalRequired: true, message: "Approval requested from an owner or admin." },
      { status: 202 },
    );
  }

  const result = await applyTransition({
    organizationId: viewer.orgId,
    orderId: id,
    from: current.status,
    to: parsed.data.status,
    role,
    actor,
    note: parsed.data.note ?? null,
  });

  if (!result.ok) {
    return Response.json({ error: result.reason }, { status: result.status ?? 422 });
  }

  void dispatchWebhook(viewer.orgId, "order.status_changed", result.order);
  return Response.json({ order: result.order });
}
