import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db, hasDatabase } from "@/lib/db";
import { processedWebhookEvents, tenantSettings } from "@/lib/db/schema";
import { PLANS, type PlanKey } from "@/lib/billing";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return Response.json({ error: "Missing signature." }, { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (!hasDatabase()) return Response.json({ received: true });

  const [seen] = await db
    .select({ id: processedWebhookEvents.id })
    .from(processedWebhookEvents)
    .where(eq(processedWebhookEvents.id, event.id))
    .limit(1);
  if (seen) return Response.json({ received: true, duplicate: true });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const organizationId = session.metadata?.organizationId ?? session.client_reference_id;
    const planKey = session.metadata?.plan as PlanKey | undefined;
    if (organizationId && planKey && PLANS[planKey]) {
      const plan = PLANS[planKey];
      await db
        .insert(tenantSettings)
        .values({
          organizationId,
          plan: planKey,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
          stripeSubscriptionId:
            typeof session.subscription === "string" ? session.subscription : null,
          seatLimit: plan.seats,
          monthlyOrderLimit: plan.monthlyOrderLimit,
          features: plan.features,
          updatedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: tenantSettings.organizationId,
          set: {
            plan: planKey,
            stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
            stripeSubscriptionId:
              typeof session.subscription === "string" ? session.subscription : null,
            seatLimit: plan.seats,
            monthlyOrderLimit: plan.monthlyOrderLimit,
            updatedAt: new Date().toISOString(),
          },
        });
    }
  }

  await db.insert(processedWebhookEvents).values({
    id: event.id,
    provider: "stripe",
    createdAt: new Date().toISOString(),
  });
  return Response.json({ received: true });
}
