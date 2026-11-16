import { createHash, randomBytes } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { getViewer } from "@/lib/auth-guards";
import { getDb, hasDatabase } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer.authenticated) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (!hasDatabase()) return Response.json({ keys: [] });
  const rows = await getDb()
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      scopes: apiKeys.scopes,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.organizationId, viewer.orgId))
    .orderBy(desc(apiKeys.createdAt));
  return Response.json({ keys: rows });
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer.authenticated) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (viewer.role !== "owner" && viewer.role !== "admin") {
    return Response.json({ error: "Only owners and admins can create API keys." }, { status: 403 });
  }
  if (!hasDatabase()) return Response.json({ error: "API keys need a database." }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as { name?: string; scopes?: string };
  const name = (body.name ?? "Machine client").trim().slice(0, 80) || "Machine client";
  const token = `wk_live_${randomBytes(24).toString("base64url")}`;
  const prefix = token.slice(0, 20);
  const hashedKey = createHash("sha256").update(token).digest("hex");
  const id = crypto.randomUUID();

  await getDb().insert(apiKeys).values({
    id,
    organizationId: viewer.orgId,
    name,
    prefix,
    hashedKey,
    scopes: (body.scopes ?? "orders:read").slice(0, 200),
    createdAt: new Date().toISOString(),
  });

  return Response.json({ id, name, prefix, token }, { status: 201 });
}
