import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
} from "drizzle-orm/pg-core";
import type { Material } from "@/lib/data/materials";
import type { OrderDetail, OrderPriority, OrderStatus } from "@/lib/constants";

export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: text("id").primaryKey(),
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
    index("purchase_orders_status_idx").on(table.status),
    index("purchase_orders_buyer_idx").on(table.buyer),
    index("purchase_orders_due_date_idx").on(table.dueDate),
    index("purchase_orders_factory_idx").on(table.factory),
  ],
);

export const orderDetails = pgTable("order_details", {
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
    orderId: text("order_id")
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: "cascade" }),
    fromStatus: text("from_status").$type<OrderStatus>(),
    toStatus: text("to_status").$type<OrderStatus>().notNull(),
    note: text("note"),
    actor: text("actor").notNull().default("demo-operator"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("order_events_order_idx").on(table.orderId)],
);

export type OrderEvent = typeof orderEvents.$inferSelect;

export const materials = pgTable("materials", {
  sku: text("sku").primaryKey(),
  payload: jsonb("payload").$type<Material>().notNull(),
});
