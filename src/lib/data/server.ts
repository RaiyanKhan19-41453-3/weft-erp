import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, eq } from "drizzle-orm";
import {
  buildAnalytics,
  buildDashboard,
  buildOrderDetail,
  generateOrders,
} from "@/lib/data/orders";
import { MATERIALS, type Material } from "@/lib/data/materials";
import { DEMO_ORG_ID, type Order, type OrderDetail } from "@/lib/constants";
import { getDb, hasDatabase } from "@/lib/db";
import { rowToOrder } from "@/lib/db/mappers";
import {
  materials as materialsTable,
  orderDetails,
  orderEvents,
  purchaseOrders,
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
  cacheLife("days");
  cacheTag(`materials-${orgId}`);
  const stored = await readDbMaterials(orgId);
  if (stored && stored.length > 0) return stored;
  return orgId === DEMO_ORG_ID ? MATERIALS : [];
}
