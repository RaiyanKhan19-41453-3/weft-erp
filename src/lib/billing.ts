export const PLANS = {
  pro: {
    name: "Weft Pro",
    amount: 2900,
    seats: 25,
    monthlyOrderLimit: 25_000,
    features: "orders,materials,analytics,invoices",
  },
  enterprise: {
    name: "Weft Enterprise",
    amount: 9900,
    seats: 200,
    monthlyOrderLimit: 1_000_000,
    features: "orders,materials,analytics,invoices",
  },
} as const;

export type PlanKey = keyof typeof PLANS;
