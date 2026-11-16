import { describe, expect, it } from "vitest";
import { previewOrderCsv } from "@/lib/csv-import";

describe("CSV import preview", () => {
  it("reports missing required columns", () => {
    const result = previewOrderCsv("buyerName,factory\nAcme,Unit 01");
    expect(result.invalidCount).toBe(1);
    expect(result.rows[0]?.errors[0]).toContain("Missing columns");
  });

  it("validates each row without writing", () => {
    const csv = `buyerName,factory,priority,dueDate,incoterm,style,colour,quantity,unitPrice,notes
North & Pine,Unit 01 — Gazipur,normal,2027-06-01,FOB,Relaxed tee,Ecru,1200,11.5,Imported
Bad,Unit 01 — Gazipur,normal,2020-01-01,FOB,Relaxed tee,Ecru,50,1,`;
    const result = previewOrderCsv(csv);
    expect(result.validCount).toBe(1);
    expect(result.invalidCount).toBe(1);
    expect(result.rows[1]?.errors.length).toBeGreaterThan(0);
  });
});
