CREATE TABLE "processed_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_settings" ALTER COLUMN "monthly_order_limit" SET DEFAULT 100000;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "stripe_subscription_id" text;