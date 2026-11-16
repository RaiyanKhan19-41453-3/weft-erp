import "../load-env";
import { sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { DEMO_ORG_ID } from "../constants";
import { buildOrderDetail, generateOrders } from "../data/orders";
import { MATERIALS } from "../data/materials";
import { getDb } from "./index";
import { orderToRow } from "./mappers";
import { materials, orderDetails, orderEvents, purchaseOrders } from "./schema";
import { account, member, organization, user } from "./auth-schema";

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
  const now = new Date();
  const demoUserId = "user_demo_admin";

  console.log("Seeding demo workspace and user...");
  await db
    .insert(organization)
    .values({
      id: DEMO_ORG_ID,
      name: "Weft Demo",
      slug: "weft-demo",
      createdAt: now,
    })
    .onConflictDoNothing();

  await db
    .insert(user)
    .values({
      id: demoUserId,
      name: "Demo Operator",
      email: "demo@weft.local",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();

  await db
    .insert(account)
    .values({
      id: "account_demo_admin",
      accountId: demoUserId,
      providerId: "credential",
      userId: demoUserId,
      password: await hashPassword("demo1234"),
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();

  await db
    .insert(member)
    .values({
      id: "member_demo_admin",
      organizationId: DEMO_ORG_ID,
      userId: demoUserId,
      role: "owner",
      createdAt: now,
    })
    .onConflictDoNothing();

  console.log(`Seeding ${orders.length} purchase orders...`);

  for (const [index, batch] of chunks(orders, BATCH).entries()) {
    await db
      .insert(purchaseOrders)
      .values(batch.map((order) => ({ ...orderToRow(order), organizationId: DEMO_ORG_ID })))
      .onConflictDoNothing();

    await db
      .insert(orderDetails)
      .values(
        batch.map((order) => {
          const detail = buildOrderDetail(order);
          return {
            organizationId: DEMO_ORG_ID,
            orderId: order.id,
            detail,
            colour: detail.colour,
            updatedAt: detail.poDate,
          };
        }),
      )
      .onConflictDoNothing();

    await db
      .insert(orderEvents)
      .values(
        batch.map((order) => ({
          id: `${order.id}-seeded`,
          organizationId: DEMO_ORG_ID,
          orderId: order.id,
          fromStatus: null,
          toStatus: order.status,
          note: "Seeded from the deterministic order book",
          actor: "seed",
          createdAt: order.createdAt,
        })),
      )
      .onConflictDoNothing();

    console.log(`  batch ${index + 1}/${Math.ceil(orders.length / BATCH)}`);
  }

  console.log(`Seeding ${MATERIALS.length} materials...`);
  await db
    .insert(materials)
    .values(
      MATERIALS.map((material) => ({
        organizationId: DEMO_ORG_ID,
        sku: material.sku,
        payload: material,
      })),
    )
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
