import { describe, expect, it } from "vitest";
import { gtinForSku, ssccForOrder, validGtin, validSscc } from "@/lib/gtin";

describe("GS1 identifiers", () => {
  it("validates known GTIN-13 check digits", () => {
    expect(validGtin("4006381333931")).toBe(true);
    expect(validGtin("4006381333932")).toBe(false);
  });

  it("generates valid SSCC-18 values deterministically", () => {
    const sscc = ssccForOrder("PO-26-4001");
    expect(sscc).toHaveLength(18);
    expect(validSscc(sscc)).toBe(true);
    expect(ssccForOrder("PO-26-4001")).toBe(sscc);
  });

  it("generates valid GTIN-14 values for SKUs", () => {
    const gtin = gtinForSku("FAB-JS-180-ECR");
    expect(gtin).toHaveLength(14);
    expect(validGtin(gtin)).toBe(true);
  });
});
