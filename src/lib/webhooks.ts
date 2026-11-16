import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, hasDatabase } from "./db";
import { webhooks } from "./db/schema";

export async function dispatchWebhook(
  organizationId: string,
  event: string,
  payload: unknown,
) {
  if (!hasDatabase()) return;
  try {
    const rows = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.organizationId, organizationId));
    const body = JSON.stringify({ event, createdAt: new Date().toISOString(), data: payload });

    await Promise.allSettled(
      rows
        .filter((row) => row.events.split(",").map((item) => item.trim()).includes(event))
        .map((row) => {
          const signature = createHmac("sha256", row.secret).update(body).digest("hex");
          return fetch(row.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Weft-Event": event,
              "X-Weft-Signature": `sha256=${signature}`,
            },
            body,
            signal: AbortSignal.timeout(5000),
          });
        }),
    );
  } catch (error) {
    console.error("Webhook dispatch failed.", error);
  }
}
