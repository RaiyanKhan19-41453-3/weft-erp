import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { buildOrderDetail, generateOrders } from "../data/orders";
import { MATERIALS } from "../data/materials";
import { getDb } from "./index";
import { orderToRow } from "./mappers";
import { materials, orderDetails, purchaseOrders } from "./schema";

config({ path: ".env.local" });
config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local first.");
  process.exit(1);
}

const BATCH = 250;

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

async function main() {
  const db = getDb();
  const orders = generateOrders();

  console.log(`Seeding ${orders.length} purchase orders...`);

  for (const [index, batch] of chunks(orders, BATCH).entries()) {
    await db
      .insert(purchaseOrders)
      .values(batch.map(orderToRow))
      .onConflictDoNothing();

    await db
      .insert(orderDetails)
      .values(
        batch.map((order) => {
          const detail = buildOrderDetail(order);
          return {
            orderId: order.id,
            detail,
            colour: detail.colour,
            updatedAt: detail.poDate,
          };
        }),
      )
      .onConflictDoNothing();

    console.log(`  batch ${index + 1}/${Math.ceil(orders.length / BATCH)}`);
  }

  console.log(`Seeding ${MATERIALS.length} materials...`);
  await db
    .insert(materials)
    .values(MATERIALS.map((material) => ({ sku: material.sku, payload: material })))
    .onConflictDoNothing();

  const [{ count: orderCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(purchaseOrders);

  console.log(`Done. purchase_orders now has ${orderCount} rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
