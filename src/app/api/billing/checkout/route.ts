import { z } from "zod";
import { getViewer } from "@/lib/auth-guards";
import { PLANS, type PlanKey } from "@/lib/billing";
import { stripe } from "@/lib/stripe";

const schema = z.object({ plan: z.enum(["pro", "enterprise"]) });

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer.authenticated) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (viewer.role !== "owner" && viewer.role !== "admin") {
    return Response.json({ error: "Only owners and admins can manage billing." }, { status: 403 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Billing is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Unknown plan." }, { status: 422 });
  const plan = PLANS[parsed.data.plan as PlanKey];
  const origin = new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: viewer.email ?? undefined,
    client_reference_id: viewer.orgId,
    metadata: { organizationId: viewer.orgId, plan: parsed.data.plan },
    subscription_data: { metadata: { organizationId: viewer.orgId, plan: parsed.data.plan } },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: plan.amount,
          recurring: { interval: "month" },
          product_data: { name: plan.name, description: `${plan.seats} seats · ${plan.monthlyOrderLimit.toLocaleString()} orders/month` },
        },
      },
    ],
    success_url: `${origin}/settings?checkout=success`,
    cancel_url: `${origin}/settings?checkout=cancelled`,
  });

  return Response.json({ url: session.url });
}
