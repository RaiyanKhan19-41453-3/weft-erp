import { describe, expect, it } from "vitest";
import { bomForStyle, requirementsForLines } from "@/lib/bom";

describe("bill of materials", () => {
  it("explodes a style into fabric, thread, label and carton", () => {
    const lines = bomForStyle("Relaxed tee");
    expect(lines.some((line) => line.sku === "FAB-JS-180-ECR")).toBe(true);
    expect(lines.some((line) => line.sku === "TRM-TH-120-BLK")).toBe(true);
    expect(lines.some((line) => line.sku === "PKG-CT-5PL-KRF")).toBe(true);
  });

  it("aggregates material demand across style lines", () => {
    const demand = requirementsForLines([
      { style: "Relaxed tee", quantity: 1000 },
      { style: "Piqué polo", quantity: 1000 },
    ]);
    const carton = demand.find((item) => item.sku === "PKG-CT-5PL-KRF");
    expect(carton?.quantity).toBe(100);
    const denim = demand.find((item) => item.sku === "FAB-DN-340-IND");
    expect(denim).toBeUndefined();
  });
});
