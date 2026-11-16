import { eq } from "drizzle-orm";
import { z } from "zod";
import { getViewer } from "@/lib/auth-guards";
import { getDb, hasDatabase } from "@/lib/db";
import { tenantSettings } from "@/lib/db/schema";

const schema = z.object({
  brandName: z.string().trim().min(1).max(60),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  features: z.array(z.enum(["orders", "materials", "analytics", "invoices"])).min(1),
});

export async function GET() {
  const viewer = await getViewer();
  if (!viewer.authenticated) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (!hasDatabase()) return Response.json({ settings: null });
  const [row] = await getDb()
    .select()
    .from(tenantSettings)
    .where(eq(tenantSettings.organizationId, viewer.orgId));
  return Response.json({ settings: row ?? null });
}

export async function PUT(request: Request) {
  const viewer = await getViewer();
  if (!viewer.authenticated) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (viewer.role !== "owner" && viewer.role !== "admin") {
    return Response.json({ error: "Only owners and admins can update settings." }, { status: 403 });
  }
  if (!hasDatabase()) return Response.json({ error: "Settings need a database." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid settings." }, { status: 422 });

  const db = getDb();
  const [row] = await db
    .insert(tenantSettings)
    .values({
      organizationId: viewer.orgId,
      brandName: parsed.data.brandName,
      accent: parsed.data.accent,
      features: parsed.data.features.join(","),
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: tenantSettings.organizationId,
      set: {
        brandName: parsed.data.brandName,
        accent: parsed.data.accent,
        features: parsed.data.features.join(","),
        updatedAt: new Date().toISOString(),
      },
    })
    .returning();

  return Response.json({ settings: row });
}
