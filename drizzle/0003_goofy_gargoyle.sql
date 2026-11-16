CREATE TABLE "order_approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT 'org_weft_demo' NOT NULL,
	"order_id" text NOT NULL,
	"requested_status" text NOT NULL,
	"requested_by" text NOT NULL,
	"requested_at" text NOT NULL,
	"decided_by" text,
	"decided_at" text,
	"decision" text DEFAULT 'pending' NOT NULL,
	"note" text
);
--> statement-breakpoint
ALTER TABLE "order_events" ADD COLUMN "diff" jsonb;--> statement-breakpoint
ALTER TABLE "order_approvals" ADD CONSTRAINT "order_approvals_order_id_purchase_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_approvals_order_idx" ON "order_approvals" USING btree ("order_id");