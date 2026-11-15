export type MaterialStatus = "low" | "watch" | "ok";

export type Material = {
  sku: string;
  name: string;
  category: "Fabric" | "Trims" | "Packaging";
  composition: string;
  colour: string;
  supplier: string;
  unit: string;
  onHand: number;
  reorderPoint: number;
  incoming: number;
  incomingDate: string;
  leadTimeDays: number;
  weeklyUse: number;
  unitCost: number;
  status: MaterialStatus;
};

export type MaterialAlert = Material;

type MaterialInput = Omit<Material, "status">;

function withStatus(material: MaterialInput): Material {
  const status: MaterialStatus =
    material.onHand <= material.reorderPoint
      ? "low"
      : material.onHand <= material.reorderPoint * 1.2
        ? "watch"
        : "ok";
  return { ...material, status };
}

const materialInputs: MaterialInput[] = [
  {
    sku: "FAB-JS-180-ECR",
    name: "Single jersey 180gsm",
    category: "Fabric",
    composition: "100% combed cotton",
    colour: "Ecru",
    supplier: "Meghna Knits",
    unit: "kg",
    onHand: 1240,
    reorderPoint: 2200,
    incoming: 3000,
    incomingDate: "2026-11-23T00:00:00.000Z",
    leadTimeDays: 21,
    weeklyUse: 620,
    unitCost: 6.4,
  },
  {
    sku: "FAB-PQ-220-INK",
    name: "Cotton piqué 220gsm",
    category: "Fabric",
    composition: "100% cotton",
    colour: "Ink navy",
    supplier: "Padma Textiles",
    unit: "kg",
    onHand: 3860,
    reorderPoint: 2000,
    incoming: 0,
    incomingDate: "—",
    leadTimeDays: 18,
    weeklyUse: 540,
    unitCost: 7.15,
  },
  {
    sku: "FAB-FL-380-STN",
    name: "Brushed fleece 380gsm",
    category: "Fabric",
    composition: "80% cotton / 20% poly",
    colour: "Stone",
    supplier: "Karnaphuli Knit",
    unit: "kg",
    onHand: 1680,
    reorderPoint: 1900,
    incoming: 2400,
    incomingDate: "2026-11-27T00:00:00.000Z",
    leadTimeDays: 24,
    weeklyUse: 680,
    unitCost: 8.9,
  },
  {
    sku: "FAB-DN-340-IND",
    name: "Rigid denim 12oz",
    category: "Fabric",
    composition: "100% cotton",
    colour: "Indigo",
    supplier: "Jamuna Denim",
    unit: "m",
    onHand: 4200,
    reorderPoint: 5000,
    incoming: 6000,
    incomingDate: "2026-12-02T00:00:00.000Z",
    leadTimeDays: 32,
    weeklyUse: 1450,
    unitCost: 3.85,
  },
  {
    sku: "FAB-TW-260-CLY",
    name: "Cotton twill 260gsm",
    category: "Fabric",
    composition: "98% cotton / 2% elastane",
    colour: "Clay",
    supplier: "Padma Textiles",
    unit: "m",
    onHand: 9100,
    reorderPoint: 4800,
    incoming: 0,
    incomingDate: "—",
    leadTimeDays: 19,
    weeklyUse: 980,
    unitCost: 2.95,
  },
  {
    sku: "FAB-RB-2X2-ECR",
    name: "2x2 rib trim",
    category: "Fabric",
    composition: "95% cotton / 5% elastane",
    colour: "Ecru",
    supplier: "Meghna Knits",
    unit: "kg",
    onHand: 740,
    reorderPoint: 700,
    incoming: 900,
    incomingDate: "2026-11-20T00:00:00.000Z",
    leadTimeDays: 16,
    weeklyUse: 210,
    unitCost: 8.1,
  },
  {
    sku: "TRM-TH-120-BLK",
    name: "Poly core thread 120/2",
    category: "Trims",
    composition: "100% polyester",
    colour: "Black",
    supplier: "Apex Trims",
    unit: "cones",
    onHand: 520,
    reorderPoint: 300,
    incoming: 0,
    incomingDate: "—",
    leadTimeDays: 9,
    weeklyUse: 85,
    unitCost: 3.25,
  },
  {
    sku: "TRM-ZP-5-ANT",
    name: "YKK zip #5",
    category: "Trims",
    composition: "Metal",
    colour: "Antique brass",
    supplier: "YKK Bangladesh",
    unit: "pcs",
    onHand: 8400,
    reorderPoint: 12000,
    incoming: 20000,
    incomingDate: "2026-11-24T00:00:00.000Z",
    leadTimeDays: 14,
    weeklyUse: 2600,
    unitCost: 0.32,
  },
  {
    sku: "TRM-LB-WVN-ECR",
    name: "Woven main label",
    category: "Trims",
    composition: "Polyester damask",
    colour: "Ecru",
    supplier: "Apex Trims",
    unit: "pcs",
    onHand: 21000,
    reorderPoint: 10000,
    incoming: 0,
    incomingDate: "—",
    leadTimeDays: 11,
    weeklyUse: 3100,
    unitCost: 0.08,
  },
  {
    sku: "PKG-CT-5PL-KRF",
    name: "5-ply export carton",
    category: "Packaging",
    composition: "Kraft board",
    colour: "Kraft",
    supplier: "Bengal Packaging",
    unit: "pcs",
    onHand: 1860,
    reorderPoint: 1600,
    incoming: 3000,
    incomingDate: "2026-11-21T00:00:00.000Z",
    leadTimeDays: 7,
    weeklyUse: 740,
    unitCost: 0.94,
  },
  {
    sku: "PKG-PB-CLR-M",
    name: "Poly bag 12x16",
    category: "Packaging",
    composition: "LDPE",
    colour: "Clear",
    supplier: "Bengal Packaging",
    unit: "pcs",
    onHand: 34000,
    reorderPoint: 15000,
    incoming: 0,
    incomingDate: "—",
    leadTimeDays: 6,
    weeklyUse: 4200,
    unitCost: 0.03,
  },
  {
    sku: "TRM-IN-WHT-90",
    name: "Fusible interlining 90gsm",
    category: "Trims",
    composition: "Poly/cotton",
    colour: "White",
    supplier: "Apex Trims",
    unit: "m",
    onHand: 2100,
    reorderPoint: 2600,
    incoming: 2000,
    incomingDate: "2026-11-18T00:00:00.000Z",
    leadTimeDays: 12,
    weeklyUse: 590,
    unitCost: 0.72,
  },
];

export const MATERIALS: Material[] = materialInputs.map(withStatus);

export function buildMaterialsSummary(materials: Material[] = MATERIALS) {
  const low = materials.filter((material) => material.status === "low");
  return {
    total: materials.length,
    low: low.length,
    watch: materials.filter((material) => material.status === "watch").length,
    stockValue: materials.reduce(
      (total, material) => total + material.onHand * material.unitCost,
      0,
    ),
    inboundUnits: materials.filter((material) => material.incoming > 0).length,
    avgLeadTime: Math.round(
      materials.reduce((total, material) => total + material.leadTimeDays, 0) /
        materials.length,
    ),
  };
}
