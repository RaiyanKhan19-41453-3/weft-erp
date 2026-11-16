import { and, eq } from "drizzle-orm";
import { handleSchedule } from "@vercel/schedules";
import { db, hasDatabase } from "../src/lib/db";
import { purchaseOrders } from "../src/lib/db/schema";
import { log } from "../src/lib/log";

export const POST = handleSchedule(async (metadata) => {
  if (!hasDatabase()) return;

  const orders = await db
    .select({ id: purchaseOrders.id, organizationId: purchaseOrders.organizationId })
    .from(purchaseOrders)
    .where(and(eq(purchaseOrders.atRisk, true), eq(purchaseOrders.status, "in-production")))
    .limit(100);

  log("info", "order_reminders", {
    schedule: metadata.name,
    executionId: metadata.executionId,
    scheduledAt: metadata.scheduledAt.toISOString(),
    count: orders.length,
  });
});
