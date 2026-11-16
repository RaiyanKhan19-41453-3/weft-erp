CREATE TABLE "tenant_settings" (
	"organization_id" text PRIMARY KEY NOT NULL,
	"brand_name" text DEFAULT 'Weft' NOT NULL,
	"accent" text DEFAULT '#2f7d63' NOT NULL,
	"features" text DEFAULT 'orders,materials,analytics,invoices' NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"seat_limit" integer DEFAULT 5 NOT NULL,
	"monthly_order_limit" integer DEFAULT 500 NOT NULL,
	"updated_at" text NOT NULL
);
