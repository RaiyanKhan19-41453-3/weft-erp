import { eq } from "drizzle-orm";
import { getViewer } from "@/lib/auth-guards";
import { db, hasDatabase } from "@/lib/db";
import { tenantSettings } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer.authenticated) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (viewer.role !== "owner" && viewer.role !== "admin") {
    return Response.json({ error: "Only owners and admins can manage billing." }, { status: 403 });
  }
  if (!hasDatabase() || !process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Billing is not configured." }, { status: 503 });
  }

  const [settings] = await db
    .select()
    .from(tenantSettings)
    .where(eq(tenantSettings.organizationId, viewer.orgId))
    .limit(1);
  if (!settings?.stripeCustomerId) {
    return Response.json({ error: "No billing account yet." }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: settings.stripeCustomerId,
    return_url: `${new URL(request.url).origin}/settings`,
  });
  return Response.json({ url: session.url });
}
