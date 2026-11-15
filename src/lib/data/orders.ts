import {
  BUYERS,
  COLOURS,
  DEMO_TODAY,
  FACTORIES,
  ORDER_STATUSES,
  SIZE_RUNS,
  STYLES,
  WASHES,
  type Order,
  type OrderDetail,
  type OrderLine,
  type OrderPriority,
  type OrderStatus,
  type SizeLine,
  type TimelineStage,
} from "@/lib/constants";
import { addDays, formatDateShort, formatMonth, formatNumber, sum, toUtcDay } from "@/lib/utils";
import { MATERIALS, type MaterialAlert } from "@/lib/data/materials";

const ORDER_COUNT = 5000;
const ANCHOR = toUtcDay(DEMO_TODAY);
const DAY = 86_400_000;

function mulberry32(seed: number) {
  let value = seed;
  return function random() {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function hashString(value: string) {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)]!;
}

function weighted<T>(random: () => number, values: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((accumulator, weight) => accumulator + weight, 0);
  let threshold = random() * total;
  for (let index = 0; index < values.length; index += 1) {
    threshold -= weights[index] ?? 0;
    if (threshold <= 0) return values[index]!;
  }
  return values[values.length - 1]!;
}

function isoDay(date: Date) {
  return toUtcDay(date).toISOString();
}

function round(value: number, precision = 0) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function statusForWindow(random: () => number, daysToDue: number): OrderStatus {
  if (daysToDue < -30) {
    return weighted(
      random,
      ["shipped", "cancelled", "ready", "qc", "in-production"],
      [90, 4, 3, 2, 1],
    );
  }
  if (daysToDue < 0) {
    return weighted(
      random,
      ["shipped", "cancelled", "ready", "qc", "in-production"],
      [82, 6, 4, 4, 4],
    );
  }
  if (daysToDue <= 14) {
    return weighted(
      random,
      ["in-production", "qc", "ready", "confirmed", "draft"],
      [32, 18, 14, 30, 6],
    );
  }
  return weighted(
    random,
    ["confirmed", "in-production", "draft", "qc"],
    [45, 38, 10, 7],
  );
}

function progressFor(random: () => number, status: OrderStatus) {
  switch (status) {
    case "draft":
      return 0;
    case "confirmed":
      return 6 + Math.floor(random() * 8);
    case "in-production":
      return 24 + Math.floor(random() * 62);
    case "qc":
      return 88 + Math.floor(random() * 4);
    case "ready":
      return 97;
    case "shipped":
      return 100;
    case "cancelled":
      return 0;
  }
}

function seasonFor(dueDate: Date) {
  const month = dueDate.getUTCMonth();
  const year = dueDate.getUTCFullYear().toString().slice(-2);
  return month < 6 ? `SS${year}` : `AW${year}`;
}

function isActiveStatus(status: OrderStatus) {
  return (
    status === "confirmed" ||
    status === "in-production" ||
    status === "qc" ||
    status === "ready"
  );
}

export function generateOrders(): Order[] {
  const random = mulberry32(0x5eed1e);
  const orders: Order[] = [];

  for (let index = 0; index < ORDER_COUNT; index += 1) {
    const createdOffset =
      -300 + Math.floor((index / ORDER_COUNT) * 300) + Math.floor(random() * 5) - 2;
    const createdAt = addDays(ANCHOR, Math.min(createdOffset, -1));
    const leadTime = 35 + Math.floor(random() * 85);
    const dueDate = addDays(createdAt, leadTime);
    const daysToDue = Math.round((dueDate.getTime() - ANCHOR.getTime()) / DAY);

    const status = statusForWindow(random, daysToDue);
    const progress = progressFor(random, status);
    const buyer = pick(random, BUYERS);
    const style = pick(random, STYLES);
    const factory = pick(random, FACTORIES);
    const line = pick(random, factory.lines);
    const quantity = (800 + Math.floor(random() * 14_800)) * 1;
    const roundedQuantity = Math.round(quantity / 10) * 10;
    const unitPrice = round(4.25 + random() * 21.5, 2);
    const active = isActiveStatus(status);
    const atRisk =
      active &&
      (daysToDue < -21
        ? progress < 55
        : daysToDue <= 7 && progress < 82);

    const priority: OrderPriority =
      atRisk && random() < 0.72
        ? weighted(random, ["high", "urgent"], [72, 28])
        : weighted(random, ["low", "normal", "high", "urgent"], [10, 62, 22, 6]);

    const season = random() < 0.14 ? "Core" : seasonFor(dueDate);
    const id = `PO-26-${String(4001 + index)}`;

    orders.push({
      id,
      buyer: buyer.name,
      buyerCode: buyer.code,
      buyerCountry: buyer.country,
      style: style.name,
      styleCode: `${style.code}-${1000 + Math.floor(random() * 900)}`,
      quantity: roundedQuantity,
      unitPrice,
      value: round(roundedQuantity * unitPrice, 2),
      status,
      priority,
      factory: factory.name,
      line,
      season,
      destination: buyer.city,
      dueDate: isoDay(dueDate),
      createdAt: isoDay(createdAt),
      progress,
      unitsProduced: Math.round((roundedQuantity * progress) / 100),
      atRisk,
      onTime: status === "shipped" ? random() > 0.085 : undefined,
    });
  }

  return orders;
}

export type Kpi = {
  key: "active" | "units" | "on-time" | "value";
  label: string;
  value: number;
  kind: "number" | "percent" | "money";
  note: string;
  trend: number[];
};

export type ThroughputPoint = {
  label: string;
  actual: number;
  target: number;
};

export type StatusSlice = {
  status: OrderStatus;
  count: number;
};

export type TopBuyer = {
  name: string;
  country: string;
  activeOrders: number;
  units: number;
  value: number;
  atRisk: number;
};

export type DashboardData = {
  totalOrders: number;
  activeOrders: number;
  atRiskOrders: number;
  atRiskValue: number;
  onTimeRate: number;
  pipelineValue: number;
  unitsInProduction: number;
  buyers: number;
  factories: number;
  lines: number;
  kpis: Kpi[];
  throughput: ThroughputPoint[];
  statusMix: StatusSlice[];
  topBuyers: TopBuyer[];
  recentOrders: Order[];
  riskOrders: Order[];
  lowStock: MaterialAlert[];
};

function weeklyBuckets(orders: Order[], metric: "created" | "shipped", weeks = 12) {
  const result: Array<{ start: Date; value: number }> = [];
  for (let index = weeks - 1; index >= 0; index -= 1) {
    const start = addDays(ANCHOR, -index * 7 - 7);
    const end = addDays(start, 7);
    const value = orders.reduce((total, order) => {
      if (metric === "shipped" && order.status !== "shipped") return total;
      const date = new Date(metric === "shipped" ? order.dueDate : order.createdAt);
      if (date >= start && date < end) {
        return total + (metric === "shipped" ? order.quantity : 1);
      }
      return total;
    }, 0);
    result.push({ start, value });
  }
  return result;
}

export function buildDashboard(orders: Order[]): DashboardData {
  const active = orders.filter((order) => isActiveStatus(order.status));
  const risk = active.filter((order) => order.atRisk);
  const shipped = orders.filter((order) => order.status === "shipped");
  const onTimeShipped = shipped.filter((order) => order.onTime);
  const onTimeRate = shipped.length
    ? round((onTimeShipped.length / shipped.length) * 100, 1)
    : 0;
  const pipelineValue = sum(active.map((order) => order.value));
  const floorStatuses = new Set<OrderStatus>(["in-production", "qc"]);
  const unitsInProduction = sum(
    active.filter((order) => floorStatuses.has(order.status)).map((order) => order.quantity),
  );

  const throughputRaw = weeklyBuckets(orders, "shipped", 12);
  const average = throughputRaw.reduce((total, point) => total + point.value, 0) / throughputRaw.length;
  const target = Math.max(500, Math.round((average * 1.04) / 500) * 500);
  const throughput = throughputRaw.map((point) => ({
    label: formatDateShort(point.start.toISOString()),
    actual: point.value,
    target,
  }));

  const createdWeekly = weeklyBuckets(orders, "created", 8);
  const shippedWeekly = weeklyBuckets(orders, "shipped", 8);
  const valueWeekly = createdWeekly.map((point) => {
    const start = point.start.getTime();
    const end = start + 7 * DAY;
    return round(
      orders.reduce((total, order) => {
        const created = new Date(order.createdAt).getTime();
        return created >= start && created < end ? total + order.value : total;
      }, 0) / 1000,
      0,
    );
  });

  const onTimeTrend = Array.from({ length: 8 }, (_, index) => {
    const drift = [1.6, 0.9, -0.4, 0.7, 1.1, -0.2, 0.5, 1.4][index] ?? 0;
    return round(onTimeRate + drift, 1);
  });

  const kpis: Kpi[] = [
    {
      key: "active",
      label: "Open purchase orders",
      value: active.length,
      kind: "number",
      note: `${active.filter((order) => order.status === "confirmed").length} confirmed · ${active.filter((order) => order.status === "in-production").length} in production`,
      trend: createdWeekly.map((point) => point.value),
    },
    {
      key: "units",
      label: "Units in production",
      value: unitsInProduction,
      kind: "number",
      note: `On the floor across ${FACTORIES.length} units`,
      trend: shippedWeekly.map((point) => point.value),
    },
    {
      key: "on-time",
      label: "On-time shipment",
      value: onTimeRate,
      kind: "percent",
      note: `${formatNumber(shipped.length)} shipped POs · 90 day view`,
      trend: onTimeTrend,
    },
    {
      key: "value",
      label: "Pipeline value",
      value: pipelineValue,
      kind: "money",
      note: `Excludes ${orders.filter((order) => order.status === "cancelled").length} cancelled POs`,
      trend: valueWeekly,
    },
  ];

  const buyers = new Map<string, TopBuyer>();
  for (const order of active) {
    const existing = buyers.get(order.buyer) ?? {
      name: order.buyer,
      country: order.buyerCountry,
      activeOrders: 0,
      units: 0,
      value: 0,
      atRisk: 0,
    };
    existing.activeOrders += 1;
    existing.units += order.quantity;
    existing.value += order.value;
    existing.atRisk += order.atRisk ? 1 : 0;
    buyers.set(order.buyer, existing);
  }

  const statusMix = ORDER_STATUSES.map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));

  const priorityRank: Record<OrderPriority, number> = {
    urgent: 4,
    high: 3,
    normal: 2,
    low: 1,
  };

  const riskOrders = [...risk]
    .sort((a, b) => {
      const due = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (due !== 0) return due;
      return priorityRank[b.priority] - priorityRank[a.priority];
    })
    .slice(0, 6);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 7);

  return {
    totalOrders: orders.length,
    activeOrders: active.length,
    atRiskOrders: risk.length,
    atRiskValue: sum(risk.map((order) => order.value)),
    onTimeRate,
    pipelineValue,
    unitsInProduction,
    buyers: BUYERS.length,
    factories: FACTORIES.length,
    lines: FACTORIES.reduce((total, factory) => total + factory.lines.length, 0),
    kpis,
    throughput,
    statusMix,
    topBuyers: [...buyers.values()].sort((a, b) => b.value - a.value).slice(0, 5),
    recentOrders,
    riskOrders,
    lowStock: MATERIALS.filter((material) => material.status === "low"),
  };
}

export type BuyerScore = {
  name: string;
  country: string;
  orders: number;
  units: number;
  value: number;
  onTimeRate: number;
  atRisk: number;
  defectRate: number;
  trend: number;
};

export type AnalyticsData = {
  totalShippedUnits: number;
  onTimeRate: number;
  defectRate: number;
  avgLeadTime: number;
  factoryOutput: Array<Record<string, string | number>>;
  onTimeTrend: Array<{ month: string; rate: number }>;
  defectCauses: Array<{ cause: string; rate: number }>;
  buyers: BuyerScore[];
  activeUnits: number;
  capacity: Array<{ factory: string; committed: number; capacity: number }>;
};

export function buildAnalytics(orders: Order[]): AnalyticsData {
  const shipped = orders.filter((order) => order.status === "shipped");
  const totalShippedUnits = sum(shipped.map((order) => order.quantity));
  const onTimeRate = shipped.length
    ? round((shipped.filter((order) => order.onTime).length / shipped.length) * 100, 1)
    : 0;
  const avgLeadTime = orders.length
    ? Math.round(
        sum(
          orders.map(
            (order) =>
              (new Date(order.dueDate).getTime() - new Date(order.createdAt).getTime()) / DAY,
          ),
        ) / orders.length,
      )
    : 0;

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(ANCHOR.getUTCFullYear(), ANCHOR.getUTCMonth() - 5 + index, 1));
    return { date, label: formatMonth(date.toISOString()) };
  });

  const factoryOutput = months.map((month) => {
    const row: Record<string, string | number> = { month: month.label };
    const start = month.date.getTime();
    const end = new Date(
      Date.UTC(month.date.getUTCFullYear(), month.date.getUTCMonth() + 1, 1),
    ).getTime();
    for (const factory of FACTORIES) {
      const units = shipped.reduce((total, order) => {
        if (order.factory !== factory.name) return total;
        const due = new Date(order.dueDate).getTime();
        return due >= start && due < end ? total + order.quantity : total;
      }, 0);
      row[factory.short] = units;
    }
    return row;
  });

  const onTimeTrend = months.map((month, index) => {
    const start = month.date.getTime();
    const end = new Date(
      Date.UTC(month.date.getUTCFullYear(), month.date.getUTCMonth() + 1, 1),
    ).getTime();
    const shippedInMonth = shipped.filter((order) => {
      const due = new Date(order.dueDate).getTime();
      return due >= start && due < end;
    });
    const rate = shippedInMonth.length
      ? Math.min(99, Math.max(82, onTimeRate - 3.4 + index * 0.9 + ((index % 3) - 1) * 0.7))
      : onTimeRate;
    return { month: month.label, rate: round(rate, 1) };
  });

  const buyerMap = new Map<string, BuyerScore>();
  for (const order of orders) {
    const existing = buyerMap.get(order.buyer) ?? {
      name: order.buyer,
      country: order.buyerCountry,
      orders: 0,
      units: 0,
      value: 0,
      onTimeRate: 0,
      atRisk: 0,
      defectRate: 0,
      trend: 0,
    };
    existing.orders += 1;
    existing.units += order.quantity;
    existing.value += order.value;
    existing.atRisk += order.atRisk ? 1 : 0;
    buyerMap.set(order.buyer, existing);
  }

  for (const [name, buyer] of buyerMap) {
    const buyerShipped = shipped.filter((order) => order.buyer === name);
    buyer.onTimeRate = buyerShipped.length
      ? round((buyerShipped.filter((order) => order.onTime).length / buyerShipped.length) * 100, 1)
      : 0;
    const seed = hashString(name);
    buyer.defectRate = round(0.4 + ((seed % 90) / 100) * 1.4, 1);
    buyer.trend = round((((seed >> 8) % 60) - 20) / 10, 1);
  }

  const active = orders.filter((order) => isActiveStatus(order.status));
  // Capacity is modeled from current commitments so the four units land at
  // realistic utilisation levels for the demo. Unit 04 is deliberately tight.
  const utilisationFactors = [0.84, 0.9, 0.76, 1.04];
  const capacity = FACTORIES.map((factory, index) => {
    const committed = sum(
      active
        .filter((order) => order.factory === factory.name)
        .map((order) => order.quantity),
    );
    const factor = utilisationFactors[index] ?? 0.85;
    return {
      factory: factory.short,
      committed,
      capacity: Math.round(committed / factor / 500) * 500,
    };
  });

  return {
    totalShippedUnits,
    onTimeRate,
    defectRate: 1.24,
    avgLeadTime,
    factoryOutput,
    onTimeTrend,
    defectCauses: [
      { cause: "Measurement", rate: 0.46 },
      { cause: "Stitching", rate: 0.31 },
      { cause: "Shade", rate: 0.22 },
      { cause: "Trims & labels", rate: 0.15 },
      { cause: "Packing", rate: 0.1 },
    ],
    buyers: [...buyerMap.values()].sort((a, b) => b.value - a.value),
    activeUnits: sum(active.map((order) => order.quantity)),
    capacity,
  };
}

const SIZE_DISTRIBUTIONS: Record<number, number[]> = {
  5: [0.1, 0.24, 0.3, 0.24, 0.12],
  6: [0.06, 0.16, 0.26, 0.26, 0.18, 0.08],
  7: [0.05, 0.1, 0.18, 0.22, 0.2, 0.15, 0.1],
};

function distributeSizes(quantity: number, category: "tops" | "bottoms" | "kids") {
  const sizes = SIZE_RUNS[category] ?? SIZE_RUNS.tops;
  const weights = SIZE_DISTRIBUTIONS[sizes.length] ?? SIZE_DISTRIBUTIONS[6]!;
  const lines: SizeLine[] = sizes.map((size, index) => ({
    size,
    quantity: Math.floor(quantity * (weights[index] ?? 0)),
  }));
  const allocated = sum(lines.map((line) => line.quantity));
  const middle = lines.reduce(
    (best, line, index) => (line.quantity > lines[best]!.quantity ? index : best),
    0,
  );
  lines[middle]!.quantity += quantity - allocated;
  return lines;
}

function timelineFor(
  order: Order,
  progress: number,
  detail: Pick<OrderDetail, "shipping" | "colour">,
): TimelineStage[] {
  const offsets = [30, 22, 12, 7, 4, 1];
  const stages = [
    {
      label: "Cutting",
      detail: `${formatNumber(Math.round(order.quantity * 0.98))} pcs cut`,
    },
    {
      label: "Sewing",
      detail: `${formatNumber(Math.max(order.unitsProduced, 0))} pcs through line`,
    },
    {
      label: "Finishing",
      detail: `Trims, press and thread clean · ${detail.colour}`,
    },
    {
      label: "Quality control",
      detail: `AQL 2.5 · ${formatNumber(Math.round(order.quantity * 0.1))} pcs inspected`,
    },
    {
      label: "Packing",
      detail: `${formatNumber(order.quantity)} pcs · solid colour cartons`,
    },
    {
      label: "Dispatch",
      detail: `${detail.shipping.port} · ${detail.shipping.mode}`,
    },
  ];

  let activeIndex = 0;
  if (order.status === "confirmed") activeIndex = 0;
  else if (order.status === "in-production") activeIndex = progress >= 62 ? 2 : 1;
  else if (order.status === "qc") activeIndex = 3;
  else if (order.status === "ready") activeIndex = 5;
  else if (order.status === "shipped") activeIndex = 6;
  else activeIndex = -1;

  return stages.map((stage, index) => {
    let state: TimelineStage["state"] = "pending";
    if (order.status === "shipped") state = "done";
    else if (index < activeIndex) state = "done";
    else if (index === activeIndex) state = "active";
    const dateBase = addDays(order.dueDate, -offsets[index]!);
    const date =
      order.status === "cancelled" || order.status === "draft"
        ? null
        : isoDay(dateBase > ANCHOR ? (index <= activeIndex ? ANCHOR : dateBase) : dateBase);
    return {
      ...stage,
      date,
      state: order.status === "cancelled" ? "pending" : state,
      detail:
        order.status === "cancelled"
          ? "Order cancelled — line released"
          : stage.detail,
    };
  });
}

const QC_NOTES = [
  "<p><strong>Inline inspection · 14 Nov</strong></p><p>Passed AQL 2.5 at 94% completion. Two shade-band deviations found on the left front panel and re-cut before sewing.</p><ul><li>Seam strength: 96 N (spec ≥ 90 N)</li><li>Measurement audit: 3 of 80 samples at −0.5 cm chest</li><li>Metal detection: pass</li></ul>",
  "<p><strong>Final inspection · 12 Nov</strong></p><p>Packing started after a clean inspection. The buyer's QA representative reviewed 20 cartons on the floor.</p><ul><li>Carton drop test: pass</li><li>Colour continuity: approved against lab dip 04</li><li>Hangtag placement: corrected on 2 cartons</li></ul>",
  "<p><strong>QC note · 09 Nov</strong></p><p>First output is within tolerance. The line is running 4% under target on the sleeve attach operation; the mechanic re-timed the folder at 14:20.</p><p>Recheck planned for the next 120 pieces.</p>",
];

export function buildOrderDetail(order: Order): OrderDetail {
  const random = mulberry32(hashString(order.id));
  const style = STYLES.find((item) => item.name === order.style) ?? pick(random, STYLES);
  const buyer =
    BUYERS.find((item) => item.name === order.buyer) ?? pick(random, BUYERS);
  const colour = pick(random, COLOURS);
  const category = style.category as "tops" | "bottoms" | "kids";
  const mode = weighted(random, ["Sea FCL", "Sea LCL", "Air freight"], [72, 18, 10]);
  const incoterm = weighted(random, ["FOB", "CIF", "EXW", "DDP"], [68, 18, 9, 5]);
  const container = weighted(
    random,
    ["40' HC", "40' GP", "20' GP", "LCL"],
    [48, 26, 20, 6],
  );
  const shipping = {
    mode,
    incoterm,
    port: buyer.port,
    etd: isoDay(addDays(order.dueDate, order.status === "shipped" ? 2 : 3)),
    container,
  };

  const line: OrderLine = {
    style: order.style,
    styleCode: order.styleCode,
    colour,
    quantity: order.quantity,
    unitPrice: order.unitPrice,
  };

  return {
    ...order,
    colour,
    fabric: style.fabric,
    gsm: style.gsm,
    wash: pick(random, WASHES),
    sizes: distributeSizes(order.quantity, category),
    lines: [line],
    timeline: timelineFor(order, order.progress, { shipping, colour }),
    qcNote: pick(random, QC_NOTES),
    shipping,
    buyerContact: buyer.contact,
    buyerEmail: buyer.email,
    poDate: order.createdAt,
  };
}

export type LocalOrderInput = {
  buyerName: string;
  factory: string;
  priority: OrderPriority;
  dueDate: string;
  incoterm: string;
  notes?: string;
  lines: Array<{
    style: string;
    colour: string;
    quantity: number;
    unitPrice: number;
  }>;
};

export function buildLocalOrder(input: LocalOrderInput, id: string): Order {
  const buyer = BUYERS.find((item) => item.name === input.buyerName) ?? BUYERS[0];
  const firstLine = input.lines[0]!;
  const style = STYLES.find((item) => item.name === firstLine.style) ?? STYLES[0];
  const dueDate = toUtcDay(input.dueDate);
  const quantity = sum(input.lines.map((line) => line.quantity));
  const value = round(
    sum(input.lines.map((line) => line.quantity * line.unitPrice)),
    2,
  );
  const now = new Date();
  return {
    id,
    buyer: buyer.name,
    buyerCode: buyer.code,
    buyerCountry: buyer.country,
    style: style.name,
    styleCode: `${style.code}-${1000 + (hashString(id) % 900)}`,
    quantity,
    unitPrice: round(value / quantity, 2),
    value,
    status: "confirmed",
    priority: input.priority,
    factory: input.factory,
    line: FACTORIES.find((factory) => factory.name === input.factory)?.lines[0] ?? "Line A",
    season: seasonFor(dueDate),
    destination: buyer.city,
    dueDate: isoDay(dueDate),
    createdAt: now.toISOString(),
    progress: 8,
    unitsProduced: Math.round(quantity * 0.08),
    atRisk: false,
    isLocal: true,
  };
}

export function buildLocalDetail(order: Order, input: LocalOrderInput): OrderDetail {
  const base = buildOrderDetail(order);
  const buyer = BUYERS.find((item) => item.name === order.buyer) ?? BUYERS[0];
  const shipping = {
    ...base.shipping,
    incoterm: input.incoterm,
  };
  return {
    ...base,
    colour: input.lines[0]!.colour,
    lines: input.lines.map((line) => {
      const style = STYLES.find((item) => item.name === line.style) ?? STYLES[0];
      return {
        style: style.name,
        styleCode: `${style.code}-${1000 + (hashString(`${order.id}-${style.code}`) % 900)}`,
        colour: line.colour,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      };
    }),
    sizes: distributeSizes(order.quantity, "tops"),
    shipping,
    timeline: timelineFor(order, order.progress, { shipping, colour: input.lines[0]!.colour }),
    qcNote:
      "<p><strong>No production notes yet.</strong></p><p>This purchase order was created in the browser demo. Add a note once cutting starts.</p>",
    buyerContact: buyer.contact,
    buyerEmail: buyer.email,
    poDate: order.createdAt,
  };
}
