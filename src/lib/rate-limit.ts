import { sql } from "drizzle-orm";
import { db, hasDatabase } from "./db";
import { rateLimitEvents } from "./db/schema";

export async function allowRequest(
  request: Request,
  bucket: string,
  limit = 60,
  windowMs = 60_000,
) {
  if (!hasDatabase()) return true;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs).toISOString();

  try {
    const [row] = await db
      .insert(rateLimitEvents)
      .values({ key: `${bucket}:${ip}`, windowStart, count: 1 })
      .onConflictDoUpdate({
        target: [rateLimitEvents.key, rateLimitEvents.windowStart],
        set: { count: sql`${rateLimitEvents.count} + 1` },
      })
      .returning({ count: rateLimitEvents.count });
    return (row?.count ?? 1) <= limit;
  } catch {
    return true;
  }
}
