import type { Order } from "@/lib/constants";
import type { purchaseOrders } from "./schema";

type PurchaseOrderRow = typeof purchaseOrders.$inferSelect;
export type PurchaseOrderInsert = typeof purchaseOrders.$inferInsert;

export function rowToOrder(row: PurchaseOrderRow): Order {
  return {
    id: row.id,
    buyer: row.buyer,
    buyerCode: row.buyerCode,
    buyerCountry: row.buyerCountry,
    style: row.style,
    styleCode: row.styleCode,
    quantity: row.quantity,
    unitPrice: Number(row.unitPrice),
    value: Number(row.value),
    status: row.status,
    priority: row.priority,
    factory: row.factory,
    line: row.line,
    season: row.season,
    destination: row.destination,
    dueDate: row.dueDate,
    createdAt: row.createdAt,
    progress: row.progress,
    unitsProduced: row.unitsProduced,
    atRisk: row.atRisk,
    onTime: row.onTime ?? undefined,
    isLocal: row.isLocal,
  };
}

export function orderToRow(order: Order): PurchaseOrderInsert {
  return {
    id: order.id,
    buyer: order.buyer,
    buyerCode: order.buyerCode,
    buyerCountry: order.buyerCountry,
    style: order.style,
    styleCode: order.styleCode,
    quantity: order.quantity,
    unitPrice: String(order.unitPrice),
    value: String(order.value),
    status: order.status,
    priority: order.priority,
    factory: order.factory,
    line: order.line,
    season: order.season,
    destination: order.destination,
    dueDate: order.dueDate,
    createdAt: order.createdAt,
    progress: order.progress,
    unitsProduced: order.unitsProduced,
    atRisk: order.atRisk,
    onTime: order.onTime ?? null,
    isLocal: order.isLocal ?? false,
  };
}
