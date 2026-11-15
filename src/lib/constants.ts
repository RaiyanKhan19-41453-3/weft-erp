export const DEMO_TODAY = "2026-11-16T00:00:00.000Z";
export const DEMO_TODAY_LABEL = "16 Nov 2026";

export const ORDER_STATUSES = [
  "draft",
  "confirmed",
  "in-production",
  "qc",
  "ready",
  "shipped",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type OrderPriority = (typeof ORDER_PRIORITIES)[number];

export type Order = {
  id: string;
  buyer: string;
  buyerCode: string;
  buyerCountry: string;
  style: string;
  styleCode: string;
  quantity: number;
  unitPrice: number;
  value: number;
  status: OrderStatus;
  priority: OrderPriority;
  factory: string;
  line: string;
  season: string;
  destination: string;
  dueDate: string;
  createdAt: string;
  progress: number;
  unitsProduced: number;
  atRisk: boolean;
  onTime?: boolean;
  isLocal?: boolean;
};

export type SizeLine = {
  size: string;
  quantity: number;
};

export type OrderLine = {
  style: string;
  styleCode: string;
  colour: string;
  quantity: number;
  unitPrice: number;
};

export type TimelineStage = {
  label: string;
  detail: string;
  date: string | null;
  state: "done" | "active" | "pending";
};

export type OrderDetail = Order & {
  colour: string;
  fabric: string;
  gsm: number;
  wash: string;
  sizes: SizeLine[];
  lines: OrderLine[];
  timeline: TimelineStage[];
  qcNote: string;
  shipping: {
    mode: string;
    incoterm: string;
    port: string;
    etd: string;
    container: string;
  };
  buyerContact: string;
  buyerEmail: string;
  poDate: string;
};

export type StatusMeta = {
  label: string;
  short: string;
  description: string;
  badgeClass: string;
  dotClass: string;
  chartVar: string;
};

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  draft: {
    label: "Draft",
    short: "Draft",
    description: "Not yet confirmed with the buyer",
    badgeClass:
      "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-300 dark:ring-zinc-500/20",
    dotClass: "bg-zinc-400",
    chartVar: "var(--chart-3)",
  },
  confirmed: {
    label: "Confirmed",
    short: "Confirmed",
    description: "PO confirmed, awaiting cutting",
    badgeClass:
      "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20",
    dotClass: "bg-blue-500",
    chartVar: "var(--chart-3)",
  },
  "in-production": {
    label: "In production",
    short: "Production",
    description: "Cut and sew is in progress",
    badgeClass:
      "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
    dotClass: "bg-amber-500",
    chartVar: "var(--chart-2)",
  },
  qc: {
    label: "In QC",
    short: "QC",
    description: "Final inspection in progress",
    badgeClass:
      "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20",
    dotClass: "bg-violet-500",
    chartVar: "var(--chart-5)",
  },
  ready: {
    label: "Ready to ship",
    short: "Ready",
    description: "Packed and awaiting collection",
    badgeClass:
      "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/20",
    dotClass: "bg-teal-500",
    chartVar: "var(--chart-1)",
  },
  shipped: {
    label: "Shipped",
    short: "Shipped",
    description: "Handed over to the freight forwarder",
    badgeClass:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
    dotClass: "bg-emerald-500",
    chartVar: "var(--chart-1)",
  },
  cancelled: {
    label: "Cancelled",
    short: "Cancelled",
    description: "PO cancelled by buyer or merchandiser",
    badgeClass:
      "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20",
    dotClass: "bg-rose-500",
    chartVar: "var(--chart-5)",
  },
};

export const PRIORITY_META: Record<
  OrderPriority,
  { label: string; badgeClass: string; dotClass: string }
> = {
  low: {
    label: "Low",
    badgeClass:
      "bg-zinc-50 text-zinc-600 ring-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:ring-zinc-500/20",
    dotClass: "bg-zinc-400",
  },
  normal: {
    label: "Normal",
    badgeClass:
      "bg-zinc-50 text-zinc-700 ring-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-300 dark:ring-zinc-500/20",
    dotClass: "bg-zinc-500",
  },
  high: {
    label: "High",
    badgeClass:
      "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/20",
    dotClass: "bg-orange-500",
  },
  urgent: {
    label: "Urgent",
    badgeClass:
      "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20",
    dotClass: "bg-red-500",
  },
};

export const SIZE_RUNS: Record<string, string[]> = {
  tops: ["XS", "S", "M", "L", "XL", "XXL"],
  bottoms: ["28", "30", "32", "34", "36", "38", "40"],
  kids: ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y"],
};

export const BUYERS = [
  {
    name: "North & Pine",
    code: "NP",
    country: "Sweden",
    city: "Stockholm",
    contact: "Elin Sandberg",
    email: "elin.sandberg@northpine.example",
    port: "Gothenburg",
  },
  {
    name: "Aurelia",
    code: "AU",
    country: "Spain",
    city: "A Coruña",
    contact: "Marta Ferreiro",
    email: "marta.f@aurelia.example",
    port: "Valencia",
  },
  {
    name: "Kite & Co.",
    code: "KC",
    country: "Japan",
    city: "Osaka",
    contact: "Ren Takahashi",
    email: "r.takahashi@kiteco.example",
    port: "Kobe",
  },
  {
    name: "Fieldnote",
    code: "FN",
    country: "United Kingdom",
    city: "Manchester",
    contact: "Amelia Hart",
    email: "amelia.hart@fieldnote.example",
    port: "Felixstowe",
  },
  {
    name: "Baseline Supply",
    code: "BS",
    country: "United States",
    city: "Minneapolis",
    contact: "Cole Bennett",
    email: "cole.b@baselinesupply.example",
    port: "Los Angeles",
  },
  {
    name: "Alpine Metric",
    code: "AM",
    country: "France",
    city: "Lyon",
    contact: "Camille Roux",
    email: "camille.roux@alpinemetric.example",
    port: "Le Havre",
  },
  {
    name: "Wren & Loom",
    code: "WL",
    country: "Denmark",
    city: "Copenhagen",
    contact: "Freja Møller",
    email: "freja@wrenloom.example",
    port: "Aarhus",
  },
  {
    name: "Oakline",
    code: "OL",
    country: "Germany",
    city: "Hamburg",
    contact: "Jonas Weber",
    email: "j.weber@oakline.example",
    port: "Hamburg",
  },
  {
    name: "Foundry Kids",
    code: "FK",
    country: "Netherlands",
    city: "Utrecht",
    contact: "Sanne de Vries",
    email: "sanne@foundrykids.example",
    port: "Rotterdam",
  },
  {
    name: "Cedar Row",
    code: "CR",
    country: "Canada",
    city: "Vancouver",
    contact: "Noah Leclerc",
    email: "noah.l@cedarrow.example",
    port: "Vancouver",
  },
] as const;

export const STYLES = [
  { name: "Piqué polo", code: "PL", category: "tops", fabric: "Cotton piqué", gsm: 220 },
  { name: "Heavy hoodie", code: "HD", category: "tops", fabric: "Brushed fleece", gsm: 380 },
  { name: "Denim jacket", code: "DJ", category: "tops", fabric: "Rigid denim", gsm: 340 },
  { name: "Cargo pant", code: "CP", category: "bottoms", fabric: "Cotton twill", gsm: 260 },
  { name: "Relaxed tee", code: "TS", category: "tops", fabric: "Single jersey", gsm: 180 },
  { name: "Crew sweatshirt", code: "CS", category: "tops", fabric: "Loopback fleece", gsm: 330 },
  { name: "Chino short", code: "CH", category: "bottoms", fabric: "Cotton twill", gsm: 240 },
  { name: "Knit cardigan", code: "KC", category: "tops", fabric: "Cotton knit", gsm: 300 },
  { name: "Overshirt", code: "OS", category: "tops", fabric: "Cotton flannel", gsm: 210 },
  { name: "Utility skirt", code: "US", category: "bottoms", fabric: "Canvas", gsm: 280 },
] as const;

export const COLOURS = [
  "Ecru",
  "Ink navy",
  "Forest",
  "Clay",
  "Stone",
  "Washed black",
  "Sage",
  "Ochre",
  "Sky",
  "Burgundy",
] as const;

export const FACTORIES = [
  { name: "Unit 01 — Gazipur", short: "Unit 01", lines: ["Line A", "Line B", "Line C"] },
  { name: "Unit 02 — Savar", short: "Unit 02", lines: ["Line D", "Line E"] },
  { name: "Unit 03 — Narayanganj", short: "Unit 03", lines: ["Line F", "Line G"] },
  { name: "Unit 04 — Chattogram", short: "Unit 04", lines: ["Line H", "Line I"] },
] as const;

export const SEASONS = ["SS26", "AW26", "SS27", "Core"] as const;

export const WASHES = [
  "Enzyme wash",
  "Silicone softener",
  "Garment dye",
  "No wash",
  "Stone wash",
] as const;

export const STATUS_ORDER = ORDER_STATUSES;
