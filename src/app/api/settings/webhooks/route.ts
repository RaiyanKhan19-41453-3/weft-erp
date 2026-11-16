import { randomBytes } from "node:crypto";
import { z } from "zod";
import { getViewer } from "@/lib/auth-guards";
import { getDb, hasDatabase } from "@/lib/db";
import { webhooks } from "@/lib/db/schema";

const schema = z.object({
  url: z.string().url().max(500),
  events: z.array(z.enum(["order.status_changed", "order.created", "material.low_stock"])).min(1),
});

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer.authenticated) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (viewer.role !== "owner" && viewer.role !== "admin") {
    return Response.json({ error: "Only owners and admins can manage webhooks." }, { status: 403 });
  }
  if (!hasDatabase()) return Response.json({ error: "Webhooks need a database." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid webhook." }, { status: 422 });

  const secret = randomBytes(24).toString("base64url");
  const id = crypto.randomUUID();
  await getDb().insert(webhooks).values({
    id,
    organizationId: viewer.orgId,
    url: parsed.data.url,
    secret,
    events: parsed.data.events.join(","),
    createdAt: new Date().toISOString(),
  });

  return Response.json({ id, url: parsed.data.url, events: parsed.data.events, secret }, { status: 201 });
}
