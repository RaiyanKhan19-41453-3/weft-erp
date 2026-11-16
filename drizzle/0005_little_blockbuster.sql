CREATE TABLE "bom_lines" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT 'org_weft_demo' NOT NULL,
	"style" text NOT NULL,
	"material_sku" text NOT NULL,
	"quantity_per_piece" numeric(10, 4) NOT NULL,
	"unit" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goods_receipts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT 'org_weft_demo' NOT NULL,
	"material_sku" text NOT NULL,
	"quantity" numeric(12, 2) NOT NULL,
	"supplier" text,
	"note" text,
	"received_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT 'org_weft_demo' NOT NULL,
	"order_id" text NOT NULL,
	"material_sku" text NOT NULL,
	"quantity" numeric(12, 2) NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "material_reservations" ADD CONSTRAINT "material_reservations_order_id_purchase_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bom_lines_style_idx" ON "bom_lines" USING btree ("organization_id","style");--> statement-breakpoint
CREATE INDEX "goods_receipts_sku_idx" ON "goods_receipts" USING btree ("organization_id","material_sku");--> statement-breakpoint
CREATE INDEX "material_reservations_sku_idx" ON "material_reservations" USING btree ("organization_id","material_sku");