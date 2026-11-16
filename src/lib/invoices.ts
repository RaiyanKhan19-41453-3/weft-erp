import { createHash } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import type { OrderDetail } from "./constants";
import { getDb } from "./db";
import { invoices } from "./db/schema";
import { ssccForOrder } from "./gtin";

function buildPayload(order: OrderDetail, version: number) {
  return {
    invoiceNo: order.id.replace("PO-", "INV-"),
    version,
    poId: order.id,
    buyer: order.buyer,
    buyerCountry: order.buyerCountry,
    destination: order.destination,
    incoterm: order.shipping.incoterm,
    sscc: ssccForOrder(order.id),
    totalQuantity: order.quantity,
    totalValue: order.value,
    lines: order.lines,
    sizes: order.sizes,
    generatedAt: new Date().toISOString(),
  };
}

export async function createInvoiceSnapshot(order: OrderDetail, organizationId: string) {
  const db = getDb();
  const [row] = await db
    .select({ version: sql<number>`coalesce(max(${invoices.version}), 0)::int` })
    .from(invoices)
    .where(eq(invoices.orderId, order.id));
  const version = (row?.version ?? 0) + 1;
  const payload = buildPayload(order, version);
  const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");

  const [created] = await db
    .insert(invoices)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      orderId: order.id,
      version,
      payload,
      hash,
      createdAt: new Date().toISOString(),
    })
    .returning();

  return created;
}

export async function getInvoiceSnapshot(orderId: string, organizationId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.orderId, orderId))
    .orderBy(desc(invoices.version))
    .limit(1);
  return row && row.organizationId === organizationId ? row : null;
}
