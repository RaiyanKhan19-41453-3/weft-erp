import { revalidateTag } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { rowToOrder } from "./db/mappers";
import { materialReservations, orderDetails, orderEvents, purchaseOrders } from "./db/schema";
import { checkTransition } from "./workflow";
import type { WeftRole } from "./permissions";
import type { OrderStatus } from "./constants";

export async function applyTransition({
  organizationId,
  orderId,
  from,
  to,
  role,
  actor,
  note,
}: {
  organizationId: string;
  orderId: string;
  from: OrderStatus;
  to: OrderStatus;
  role: WeftRole;
  actor: string;
  note?: string | null;
}): Promise<{ ok: true; order: unknown } | { ok: false; reason: string; status?: number }> {
  const check = checkTransition(from, to, role);
  if (!check.ok) return { ok: false, reason: check.reason, status: 422 };

  const db = getDb();
  const [updated] = await db
    .update(purchaseOrders)
    .set({ status: to })
    .where(and(eq(purchaseOrders.id, orderId), eq(purchaseOrders.organizationId, organizationId)))
    .returning();

  if (!updated) return { ok: false, reason: "Purchase order not found.", status: 404 };

  const [detail] = await db
    .select()
    .from(orderDetails)
    .where(and(eq(orderDetails.orderId, orderId), eq(orderDetails.organizationId, organizationId)))
    .limit(1);

  if (detail) {
    await db
      .update(orderDetails)
      .set({ detail: { ...detail.detail, status: to } })
      .where(and(eq(orderDetails.orderId, orderId), eq(orderDetails.organizationId, organizationId)));
  }

  if (to === "cancelled") {
    await db
      .delete(materialReservations)
      .where(
        and(
          eq(materialReservations.orderId, orderId),
          eq(materialReservations.organizationId, organizationId),
        ),
      );
  }

  await db.insert(orderEvents).values({
    id: crypto.randomUUID(),
    organizationId,
    orderId,
    fromStatus: from,
    toStatus: to,
    note: note ?? null,
    actor,
    diff: { status: { from, to } },
    createdAt: new Date().toISOString(),
  });

  revalidateTag("orders", "max");
  revalidateTag(`orders-${organizationId}`, "max");
  revalidateTag(`order-${orderId}`, "max");
  revalidateTag(`order-events-${orderId}`, "max");
  revalidateTag(`approvals-${orderId}`, "max");
  revalidateTag(`materials-${organizationId}`, { expire: 0 });

  return { ok: true, order: rowToOrder(updated) };
}
