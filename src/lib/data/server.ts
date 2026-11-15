import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { buildAnalytics, buildDashboard, buildOrderDetail, generateOrders } from "@/lib/data/orders";
import { MATERIALS } from "@/lib/data/materials";

export async function getOrders() {
  "use cache";
  cacheLife("days");
  cacheTag("orders");
  return generateOrders();
}

export async function getOrderDetail(id: string) {
  "use cache";
  cacheLife("days");
  cacheTag("orders", `order-${id}`);
  const orders = await getOrders();
  const order = orders.find((candidate) => candidate.id === id);
  return order ? buildOrderDetail(order) : null;
}

export async function getOrderIds(limit = 8) {
  const orders = await getOrders();
  return orders.slice(0, limit).map((order) => order.id);
}

export async function getDashboard() {
  "use cache";
  cacheLife("hours");
  cacheTag("orders");
  const orders = await getOrders();
  return buildDashboard(orders);
}

export async function getAnalytics() {
  "use cache";
  cacheLife("hours");
  cacheTag("orders");
  const orders = await getOrders();
  return buildAnalytics(orders);
}

export async function getMaterials() {
  "use cache";
  cacheLife("days");
  return MATERIALS;
}
