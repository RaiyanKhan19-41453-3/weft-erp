import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { eq } from "drizzle-orm";
import {
  buildAnalytics,
  buildDashboard,
  buildOrderDetail,
  generateOrders,
} from "@/lib/data/orders";
import { MATERIALS, type Material } from "@/lib/data/materials";
import { getDb, hasDatabase } from "@/lib/db";
import { rowToOrder } from "@/lib/db/mappers";
import {
  materials as materialsTable,
  orderDetails,
  orderEvents,
  purchaseOrders,
  type OrderEvent,
} from "@/lib/db/schema";
import type { Order, OrderDetail } from "@/lib/constants";

async function readDbOrders(): Promise<Order[] | null> {
  if (!hasDatabase()) return null;
  try {
    const rows = await getDb().select().from(purchaseOrders);
    return rows.length ? rows.map(rowToOrder) : null;
  } catch (error) {
    console.error("Database read failed; using deterministic fallback.", error);
    return null;
  }
}

async function readDbDetail(id: string): Promise<OrderDetail | null> {
  if (!hasDatabase()) return null;
  try {
    const [row] = await getDb()
      .select({ detail: orderDetails.detail })
      .from(orderDetails)
      .where(eq(orderDetails.orderId, id))
      .limit(1);
    return row?.detail ?? null;
  } catch (error) {
    console.error("Database detail read failed; using deterministic fallback.", error);
    return null;
  }
}

async function readDbMaterials(): Promise<Material[] | null> {
  if (!hasDatabase()) return null;
  try {
    const rows = await getDb().select({ payload: materialsTable.payload }).from(materialsTable);
    return rows.length ? rows.map((row) => row.payload) : null;
  } catch (error) {
    console.error("Materials read failed; using deterministic fallback.", error);
    return null;
  }
}

export async function getOrders() {
  "use cache";
  cacheLife("days");
  cacheTag("orders");
  return (await readDbOrders()) ?? generateOrders();
}

export async function getOrderDetail(id: string) {
  "use cache";
  cacheLife("days");
  cacheTag("orders", `order-${id}`);
  const stored = await readDbDetail(id);
  if (stored) return stored;

  const order = (await getOrders()).find((candidate) => candidate.id === id);
  return order ? buildOrderDetail(order) : null;
}

export async function getOrderEvents(id: string): Promise<OrderEvent[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`order-events-${id}`);
  if (!hasDatabase()) return [];
  try {
    return await getDb()
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, id))
      .orderBy(orderEvents.createdAt);
  } catch (error) {
    console.error("Order event read failed.", error);
    return [];
  }
}

export async function getOrderIds(limit = 8) {
  const orders = await getOrders();
  return orders.slice(0, limit).map((order) => order.id);
}

export async function getDashboard() {
  "use cache";
  cacheLife("hours");
  cacheTag("orders");
  return buildDashboard(await getOrders());
}

export async function getAnalytics() {
  "use cache";
  cacheLife("hours");
  cacheTag("orders");
  return buildAnalytics(await getOrders());
}

export async function getMaterials() {
  "use cache";
  cacheLife("days");
  return (await readDbMaterials()) ?? MATERIALS;
}
