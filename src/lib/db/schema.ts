import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
} from "drizzle-orm/pg-core";
import type { Material } from "@/lib/data/materials";
import { DEMO_ORG_ID, type OrderDetail, type OrderPriority, type OrderStatus } from "@/lib/constants";

export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull().default(DEMO_ORG_ID),
    buyer: text("buyer").notNull(),
    buyerCode: text("buyer_code").notNull(),
    buyerCountry: text("buyer_country").notNull(),
    style: text("style").notNull(),
    styleCode: text("style_code").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    value: numeric("value", { precision: 12, scale: 2 }).notNull(),
    status: text("status").$type<OrderStatus>().notNull(),
    priority: text("priority").$type<OrderPriority>().notNull(),
    factory: text("factory").notNull(),
    line: text("line").notNull(),
    season: text("season").notNull(),
    destination: text("destination").notNull(),
    dueDate: text("due_date").notNull(),
    createdAt: text("created_at").notNull(),
    progress: integer("progress").notNull(),
    unitsProduced: integer("units_produced").notNull(),
    atRisk: boolean("at_risk").notNull().default(false),
    onTime: boolean("on_time"),
    isLocal: boolean("is_local").notNull().default(false),
  },
  (table) => [
    index("purchase_orders_org_idx").on(table.organizationId),
    index("purchase_orders_org_status_idx").on(table.organizationId, table.status),
    index("purchase_orders_org_factory_idx").on(table.organizationId, table.factory),
    index("purchase_orders_status_idx").on(table.status),
    index("purchase_orders_buyer_idx").on(table.buyer),
    index("purchase_orders_due_date_idx").on(table.dueDate),
    index("purchase_orders_search_idx").using(
      "gin",
      sql`to_tsvector('english', coalesce(${table.id}, '') || ' ' || coalesce(${table.buyer}, '') || ' ' || coalesce(${table.style}, ''))`,
    ),
    index("purchase_orders_factory_idx").on(table.factory),
  ],
);

export const orderDetails = pgTable("order_details", {
  organizationId: text("organization_id").notNull().default(DEMO_ORG_ID),
  orderId: text("order_id")
    .primaryKey()
    .references(() => purchaseOrders.id, { onDelete: "cascade" }),
  detail: jsonb("detail").$type<OrderDetail>().notNull(),
  colour: text("colour").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const orderEvents = pgTable(
  "order_events",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull().default(DEMO_ORG_ID),
    orderId: text("order_id")
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: "cascade" }),
    fromStatus: text("from_status").$type<OrderStatus>(),
    toStatus: text("to_status").$type<OrderStatus>().notNull(),
    note: text("note"),
    actor: text("actor").notNull().default("demo-operator"),
    diff: jsonb("diff"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("order_events_order_idx").on(table.orderId)],
);

export type OrderEvent = typeof orderEvents.$inferSelect;

export const orderApprovals = pgTable(
  "order_approvals",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull().default(DEMO_ORG_ID),
    orderId: text("order_id")
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: "cascade" }),
    requestedStatus: text("requested_status").$type<OrderStatus>().notNull(),
    requestedBy: text("requested_by").notNull(),
    requestedAt: text("requested_at").notNull(),
    decidedBy: text("decided_by"),
    decidedAt: text("decided_at"),
    decision: text("decision").$type<"pending" | "approved" | "rejected">().notNull().default("pending"),
    note: text("note"),
  },
  (table) => [index("order_approvals_order_idx").on(table.orderId)],
);

export type OrderApproval = typeof orderApprovals.$inferSelect;

export const bomLines = pgTable(
  "bom_lines",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull().default(DEMO_ORG_ID),
    style: text("style").notNull(),
    materialSku: text("material_sku").notNull(),
    quantityPerPiece: numeric("quantity_per_piece", { precision: 10, scale: 4 }).notNull(),
    unit: text("unit").notNull(),
  },
  (table) => [index("bom_lines_style_idx").on(table.organizationId, table.style)],
);

export const materialReservations = pgTable(
  "material_reservations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull().default(DEMO_ORG_ID),
    orderId: text("order_id")
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: "cascade" }),
    materialSku: text("material_sku").notNull(),
    quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("material_reservations_sku_idx").on(table.organizationId, table.materialSku)],
);

export const goodsReceipts = pgTable(
  "goods_receipts",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull().default(DEMO_ORG_ID),
    materialSku: text("material_sku").notNull(),
    quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
    supplier: text("supplier"),
    note: text("note"),
    receivedAt: text("received_at").notNull(),
  },
  (table) => [index("goods_receipts_sku_idx").on(table.organizationId, table.materialSku)],
);

export const invoices = pgTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull().default(DEMO_ORG_ID),
    orderId: text("order_id")
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    hash: text("hash").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("invoices_order_idx").on(table.organizationId, table.orderId)],
);

export const rateLimitEvents = pgTable(
  "rate_limit_events",
  {
    key: text("key").notNull(),
    windowStart: text("window_start").notNull(),
    count: integer("count").notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.key, table.windowStart] })],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    prefix: text("prefix").notNull(),
    hashedKey: text("hashed_key").notNull(),
    scopes: text("scopes").notNull().default("orders:read"),
    createdAt: text("created_at").notNull(),
    lastUsedAt: text("last_used_at"),
    revokedAt: text("revoked_at"),
  },
  (table) => [index("api_keys_org_idx").on(table.organizationId)],
);

export const webhooks = pgTable(
  "webhooks",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    url: text("url").notNull(),
    secret: text("secret").notNull(),
    events: text("events").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("webhooks_org_idx").on(table.organizationId)],
);

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    organizationId: text("organization_id").notNull(),
    key: text("key").notNull(),
    endpoint: text("endpoint").notNull(),
    response: jsonb("response").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.organizationId, table.key, table.endpoint] })],
);

export const materials = pgTable("materials", {
  organizationId: text("organization_id").notNull().default(DEMO_ORG_ID),
  sku: text("sku").primaryKey(),
  payload: jsonb("payload").$type<Material>().notNull(),
});
