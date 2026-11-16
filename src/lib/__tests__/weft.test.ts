import { describe, expect, it } from "vitest";
import {
  buildAnalytics,
  buildDashboard,
  buildOrderDetail,
  generateOrders,
} from "@/lib/data/orders";
import { buildMaterialsSummary } from "@/lib/data/materials";
import { newOrderSchema } from "@/lib/validation/new-order";
import { amountInWords } from "@/lib/words";
import { csvEscape } from "@/lib/utils";
import { DEMO_TODAY } from "@/lib/constants";

const orders = generateOrders();
const activeStatuses = new Set(["confirmed", "in-production", "qc", "ready"]);

describe("deterministic order data", () => {
  it("generates 5,000 stable, unique purchase orders", () => {
    expect(orders).toHaveLength(5_000);
    expect(new Set(orders.map((order) => order.id)).size).toBe(5_000);

    const again = generateOrders();
    expect(again[0]).toEqual(orders[0]);
    expect(again.at(-1)).toEqual(orders.at(-1));
  });

  it("keeps dashboard totals consistent with the generated rows", () => {
    const dashboard = buildDashboard(orders);
    const active = orders.filter((order) => activeStatuses.has(order.status));

    expect(dashboard.totalOrders).toBe(5_000);
    expect(dashboard.activeOrders).toBe(active.length);
    expect(dashboard.atRiskOrders).toBe(active.filter((order) => order.atRisk).length);
    expect(dashboard.statusMix.reduce((total, slice) => total + slice.count, 0)).toBe(5_000);
    expect(dashboard.lowStock).toHaveLength(5);
    expect(dashboard.topBuyers).toHaveLength(5);
    expect(dashboard.riskOrders.length).toBeLessThanOrEqual(6);
    expect(dashboard.throughput).toHaveLength(12);
  });

  it("keeps order detail size allocation equal to the PO quantity", () => {
    const detail = buildOrderDetail(orders[0]!);

    expect(detail.id).toBe(orders[0]!.id);
    expect(detail.lines).toHaveLength(1);
    expect(detail.lines[0]!.quantity).toBe(detail.quantity);
    expect(detail.sizes.reduce((total, size) => total + size.quantity, 0)).toBe(
      detail.quantity,
    );
    expect(detail.timeline).toHaveLength(6);
    expect(detail.shipping.port).toBeTruthy();
  });

  it("keeps the analytics window derived from the same order book", () => {
    const analytics = buildAnalytics(orders);

    expect(analytics.factoryOutput).toHaveLength(6);
    expect(analytics.onTimeTrend).toHaveLength(6);
    expect(analytics.buyers.length).toBeGreaterThan(0);
    expect(analytics.capacity.every((unit) => unit.committed > 0)).toBe(true);
  });
});

describe("materials", () => {
  it("derives low, watch and healthy states from reorder points", () => {
    const summary = buildMaterialsSummary();

    expect(summary.total).toBe(12);
    expect(summary.low).toBe(5);
    expect(summary.watch).toBe(2);
    expect(summary.low + summary.watch).toBeLessThan(summary.total);
    expect(summary.stockValue).toBeGreaterThan(0);
  });
});

describe("new purchase order schema", () => {
  const valid = {
    buyerName: "North & Pine",
    factory: "Unit 01 — Gazipur",
    priority: "normal" as const,
    dueDate: "2027-01-15",
    incoterm: "FOB" as const,
    notes: "Pack by size.",
    lineItems: [{ style: "Piqué polo", colour: "Ecru", quantity: 2_400, unitPrice: 12.5 }],
  };

  it("accepts a valid multi-line payload", () => {
    expect(newOrderSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects due dates before the demo snapshot", () => {
    const parsed = newOrderSchema.safeParse({ ...valid, dueDate: "2026-11-16" });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toContain("after 16 Nov 2026");
  });

  it("rejects out-of-range quantities and too many lines", () => {
    const lowQuantity = newOrderSchema.safeParse({
      ...valid,
      lineItems: [{ ...valid.lineItems[0], quantity: 99 }],
    });
    const tooManyLines = newOrderSchema.safeParse({
      ...valid,
      lineItems: Array.from({ length: 6 }, () => valid.lineItems[0]),
    });

    expect(lowQuantity.success).toBe(false);
    expect(tooManyLines.success).toBe(false);
  });

  it("keeps the snapshot date as the earliest allowed ship window", () => {
    expect(new Date(DEMO_TODAY).toISOString()).toBe("2026-11-16T00:00:00.000Z");
  });
});

describe("invoice amount in words", () => {
  it("formats dollars and cents for the invoice", () => {
    expect(amountInWords(59_544.1)).toBe(
      "US Dollars fifty-nine thousand five hundred forty-four and ten cents only",
    );
    expect(amountInWords(100)).toBe("US Dollars one hundred only");
    expect(amountInWords(1.01)).toBe("US Dollars one and one cent only");
  });
});

describe("csv export", () => {
  it("neutralizes spreadsheet formula injection without changing numbers", () => {
    expect(csvEscape("=1+1")).toBe("'=1+1");
    expect(csvEscape("  @SUM(A1)")).toBe("'  @SUM(A1)");
    expect(csvEscape('North, "Pine"')).toBe('"North, ""Pine"""');
    expect(csvEscape(-125)).toBe("-125");
  });
});
