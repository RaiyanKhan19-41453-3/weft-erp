import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import {
  buildAnalytics,
  buildDashboard,
  buildOrderDetail,
  generateOrders,
} from "@/lib/data/orders";
import { MATERIALS, withStatus, type Material } from "@/lib/data/materials";
import { DEMO_ORG_ID, type Order, type OrderDetail } from "@/lib/constants";
import { getDb, hasDatabase } from "@/lib/db";
import { rowToOrder } from "@/lib/db/mappers";
import {
  goodsReceipts,
  materialReservations,
  materials as materialsTable,
  orderApprovals,
  orderDetails,
  orderEvents,
  purchaseOrders,
  type OrderApproval,
  type OrderEvent,
} from "@/lib/db/schema";

async function readDbOrders(orgId: string): Promise<Order[] | null> {
  if (!hasDatabase()) return null;
  try {
    const rows = await getDb()
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.organizationId, orgId));
    return rows.map(rowToOrder);
  } catch (error) {
    console.error("Database read failed; using deterministic fallback.", error);
    return null;
  }
}

async function readDbDetail(id: string, orgId: string): Promise<OrderDetail | null> {
  if (!hasDatabase()) return null;
  try {
    const [row] = await getDb()
      .select({ detail: orderDetails.detail })
      .from(orderDetails)
      .where(and(eq(orderDetails.orderId, id), eq(orderDetails.organizationId, orgId)))
      .limit(1);
    return row?.detail ?? null;
  } catch (error) {
    console.error("Database detail read failed; using deterministic fallback.", error);
    return null;
  }
}

async function readDbMaterials(orgId: string): Promise<Material[] | null> {
  if (!hasDatabase()) return null;
  try {
    const rows = await getDb()
      .select({ payload: materialsTable.payload })
      .from(materialsTable)
      .where(eq(materialsTable.organizationId, orgId));
    return rows.map((row) => row.payload);
  } catch (error) {
    console.error("Materials read failed; using deterministic fallback.", error);
    return null;
  }
}

export async function getOrders(orgId = DEMO_ORG_ID) {
  "use cache";
  cacheLife("days");
  cacheTag("orders", `orders-${orgId}`);
  const stored = await readDbOrders(orgId);
  if (stored && stored.length > 0) return stored;
  if (stored && stored.length === 0 && orgId !== DEMO_ORG_ID) return [];
  return generateOrders();
}

export async function getOrderDetail(id: string, orgId = DEMO_ORG_ID) {
  "use cache";
  cacheLife("days");
  cacheTag("orders", `order-${id}`, `orders-${orgId}`);
  const stored = await readDbDetail(id, orgId);
  if (stored) return stored;

  const order = (await getOrders(orgId)).find((candidate) => candidate.id === id);
  return order && orgId === DEMO_ORG_ID ? buildOrderDetail(order) : null;
}

export async function getOrderEvents(id: string, orgId = DEMO_ORG_ID): Promise<OrderEvent[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`order-events-${id}`, `orders-${orgId}`);
  if (!hasDatabase()) return [];
  try {
    return await getDb()
      .select()
      .from(orderEvents)
      .where(and(eq(orderEvents.orderId, id), eq(orderEvents.organizationId, orgId)))
      .orderBy(orderEvents.createdAt);
  } catch (error) {
    console.error("Order event read failed.", error);
    return [];
  }
}

export async function getOrderApprovals(
  id: string,
  orgId = DEMO_ORG_ID,
): Promise<OrderApproval[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`approvals-${id}`, `orders-${orgId}`);
  if (!hasDatabase()) return [];
  try {
    return await getDb()
      .select()
      .from(orderApprovals)
      .where(and(eq(orderApprovals.orderId, id), eq(orderApprovals.organizationId, orgId)))
      .orderBy(orderApprovals.requestedAt);
  } catch (error) {
    console.error("Approval read failed.", error);
    return [];
  }
}

export async function getOrderIds(limit = 8, orgId = DEMO_ORG_ID) {
  const orders = await getOrders(orgId);
  return orders.slice(0, limit).map((order) => order.id);
}

export async function getDashboard(orgId = DEMO_ORG_ID) {
  "use cache";
  cacheLife("hours");
  cacheTag("orders", `orders-${orgId}`);
  return buildDashboard(await getOrders(orgId));
}

export async function getAnalytics(orgId = DEMO_ORG_ID) {
  "use cache";
  cacheLife("hours");
  cacheTag("orders", `orders-${orgId}`);
  return buildAnalytics(await getOrders(orgId));
}

export async function getMaterials(orgId = DEMO_ORG_ID) {
  "use cache";
  cacheLife("hours");
  cacheTag(`materials-${orgId}`);
  const stored = await readDbMaterials(orgId);
  const base = stored && stored.length > 0 ? stored : orgId === DEMO_ORG_ID ? MATERIALS : [];
  if (base.length === 0 || !hasDatabase()) return base;

  try {
    const db = getDb();
    const [receiptRows, reservationRows] = await Promise.all([
      db
        .select({
          sku: goodsReceipts.materialSku,
          total: sql<number>`coalesce(sum(${goodsReceipts.quantity}), 0)::float`,
        })
        .from(goodsReceipts)
        .where(eq(goodsReceipts.organizationId, orgId))
        .groupBy(goodsReceipts.materialSku),
      db
        .select({
          sku: materialReservations.materialSku,
          total: sql<number>`coalesce(sum(${materialReservations.quantity}), 0)::float`,
        })
        .from(materialReservations)
        .innerJoin(purchaseOrders, eq(purchaseOrders.id, materialReservations.orderId))
        .where(
          and(
            eq(materialReservations.organizationId, orgId),
            ne(purchaseOrders.status, "cancelled"),
          ),
        )
        .groupBy(materialReservations.materialSku),
    ]);

    const receipts = new Map(receiptRows.map((row) => [row.sku, Number(row.total)]));
    const reserved = new Map(reservationRows.map((row) => [row.sku, Number(row.total)]));

    return base.map((material) => {
      const reservedQty = reserved.get(material.sku) ?? 0;
      const received = receipts.get(material.sku) ?? 0;
      const effectiveOnHand = Math.max(0, material.onHand + received - reservedQty);
      const unitLot = material.unit === "pcs" ? 500 : 100;
      const target = material.weeklyUse * 8;
      const suggestedBuy = Math.max(
        0,
        Math.ceil(Math.max(0, target - effectiveOnHand - material.incoming) / unitLot) * unitLot,
      );
      return withStatus({
        ...material,
        baselineOnHand: material.onHand,
        reserved: reservedQty,
        effectiveOnHand,
        openDemand: reservedQty,
        suggestedBuy,
        onHand: effectiveOnHand,
      });
    });
  } catch (error) {
    console.error("Material flow read failed.", error);
    return base;
  }
}
