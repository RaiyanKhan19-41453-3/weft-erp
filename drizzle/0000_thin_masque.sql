CREATE TABLE "materials" (
	"sku" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_details" (
	"order_id" text PRIMARY KEY NOT NULL,
	"detail" jsonb NOT NULL,
	"colour" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"buyer" text NOT NULL,
	"buyer_code" text NOT NULL,
	"buyer_country" text NOT NULL,
	"style" text NOT NULL,
	"style_code" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"value" numeric(12, 2) NOT NULL,
	"status" text NOT NULL,
	"priority" text NOT NULL,
	"factory" text NOT NULL,
	"line" text NOT NULL,
	"season" text NOT NULL,
	"destination" text NOT NULL,
	"due_date" text NOT NULL,
	"created_at" text NOT NULL,
	"progress" integer NOT NULL,
	"units_produced" integer NOT NULL,
	"at_risk" boolean DEFAULT false NOT NULL,
	"on_time" boolean,
	"is_local" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_order_id_purchase_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "purchase_orders_buyer_idx" ON "purchase_orders" USING btree ("buyer");--> statement-breakpoint
CREATE INDEX "purchase_orders_due_date_idx" ON "purchase_orders" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "purchase_orders_factory_idx" ON "purchase_orders" USING btree ("factory");