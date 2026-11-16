import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getViewer, hasPermission } from "@/lib/auth-guards";
import { getDb, hasDatabase } from "@/lib/db";
import { goodsReceipts } from "@/lib/db/schema";
import { hasForbiddenOrigin } from "@/lib/csrf";

const receiptSchema = z.object({
  quantity: z.number().positive().max(1_000_000),
  supplier: z.string().trim().max(120).optional(),
  note: z.string().trim().max(200).optional(),
});

type Context = { params: Promise<{ sku: string }> };

export async function POST(request: Request, { params }: Context) {
  if (hasForbiddenOrigin(request)) {
    return Response.json({ error: "Invalid origin." }, { status: 403 });
  }
  const viewer = await getViewer();
  if (!viewer.authenticated) {
    return Response.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!hasPermission(viewer, "material", "update")) {
    return Response.json({ error: "Your role cannot receive materials." }, { status: 403 });
  }
  if (!hasDatabase()) {
    return Response.json({ error: "Goods receipts need a configured database." }, { status: 503 });
  }

  const { sku } = await params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = receiptSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid goods receipt." }, { status: 422 });
  }

  const receipt = {
    id: crypto.randomUUID(),
    organizationId: viewer.orgId,
    materialSku: sku,
    quantity: String(parsed.data.quantity),
    supplier: parsed.data.supplier ?? null,
    note: parsed.data.note ?? null,
    receivedAt: new Date().toISOString(),
  };

  await getDb().insert(goodsReceipts).values(receipt);
  revalidateTag(`materials-${viewer.orgId}`, { expire: 0 });

  return Response.json({ receipt: { ...receipt, quantity: parsed.data.quantity } }, { status: 201 });
}
