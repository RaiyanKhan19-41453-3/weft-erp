type BomRequirement = { sku: string; perPiece: number; unit: string };

const THREAD: BomRequirement = { sku: "TRM-TH-120-BLK", perPiece: 0.012, unit: "kg" };
const LABEL: BomRequirement = { sku: "TRM-LB-WVN-ECR", perPiece: 1, unit: "pcs" };
const POLYBAG: BomRequirement = { sku: "PKG-PB-CLR-M", perPiece: 1, unit: "pcs" };
const CARTON: BomRequirement = { sku: "PKG-CT-5PL-KRF", perPiece: 0.05, unit: "pcs" };
const INTERLINING: BomRequirement = { sku: "TRM-IN-WHT-90", perPiece: 0.08, unit: "m" };
const ZIP: BomRequirement = { sku: "TRM-ZP-5-ANT", perPiece: 1, unit: "pcs" };

const FABRIC: Record<string, string> = {
  "Piqué polo": "FAB-PQ-220-INK",
  "Heavy hoodie": "FAB-FL-380-STN",
  "Denim jacket": "FAB-DN-340-IND",
  "Cargo pant": "FAB-TW-260-CLY",
  "Relaxed tee": "FAB-JS-180-ECR",
  "Crew sweatshirt": "FAB-RB-2X2-ECR",
  "Chino short": "FAB-TW-260-CLY",
  "Knit cardigan": "FAB-RB-2X2-ECR",
  Overshirt: "FAB-TW-260-CLY",
  "Utility skirt": "FAB-TW-260-CLY",
};

export type MaterialDemand = { sku: string; quantity: number; unit: string };

export function requirementsForLines(
  lines: Array<{ style: string; quantity: number }>,
): MaterialDemand[] {
  const totals = new Map<string, MaterialDemand>();
  for (const line of lines) {
    for (const item of bomForStyle(line.style)) {
      const quantity = Math.round(line.quantity * item.perPiece * 100) / 100;
      const existing = totals.get(item.sku);
      if (existing) existing.quantity += quantity;
      else totals.set(item.sku, { sku: item.sku, quantity, unit: item.unit });
    }
  }
  return [...totals.values()].sort((a, b) => a.sku.localeCompare(b.sku));
}

export function bomForStyle(style: string): BomRequirement[] {
  const fabric = FABRIC[style] ?? "FAB-JS-180-ECR";
  const lines: BomRequirement[] = [
    { sku: fabric, perPiece: 1.15, unit: "kg" },
    THREAD,
    LABEL,
    CARTON,
  ];

  if (style === "Piqué polo" || style === "Overshirt") lines.push(INTERLINING);
  if (style === "Denim jacket") lines.push(ZIP);
  if (style === "Relaxed tee" || style === "Piqué polo") lines.push(POLYBAG);

  return lines;
}
