import { desc, eq, sql } from "drizzle-orm";
import { getViewer } from "@/lib/auth-guards";
import { getDb, hasDatabase } from "@/lib/db";
import { member } from "@/lib/db/auth-schema";
import { organization } from "@/lib/db/auth-schema";
import { purchaseOrders, tenantSettings } from "@/lib/db/schema";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer.authenticated) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (viewer.role !== "owner" && viewer.role !== "admin") {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }
  if (!hasDatabase()) return Response.json({ organizations: [] });

  const db = getDb();
  const [org] = await db
    .select({ name: organization.name, slug: organization.slug })
    .from(organization)
    .where(eq(organization.id, viewer.orgId))
    .limit(1);
  const [orders] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(purchaseOrders)
    .where(eq(purchaseOrders.organizationId, viewer.orgId));
  const members = await db
    .select({ id: member.id, role: member.role, userId: member.userId })
    .from(member)
    .where(eq(member.organizationId, viewer.orgId))
    .orderBy(desc(member.createdAt));
  const [settings] = await db
    .select()
    .from(tenantSettings)
    .where(eq(tenantSettings.organizationId, viewer.orgId))
    .limit(1);

  return Response.json({
    organization: org ?? null,
    orderCount: orders?.count ?? 0,
    members,
    settings: settings ?? null,
  });
}
