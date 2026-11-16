import { ORDER_STATUSES, type OrderStatus } from "./constants";
import type { WeftRole } from "./permissions";

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["in-production", "cancelled"],
  "in-production": ["qc", "cancelled"],
  qc: ["ready"],
  ready: ["shipped"],
  shipped: [],
  cancelled: [],
};

const PRIVILEGED: WeftRole[] = ["owner", "admin"];

export type TransitionCheck = { ok: true } | { ok: false; reason: string };

export function checkTransition(
  from: OrderStatus,
  to: OrderStatus,
  role: WeftRole,
): TransitionCheck {
  if (!ORDER_STATUSES.includes(to)) return { ok: false, reason: "Unknown status." };
  if (from === to) return { ok: false, reason: "The order is already in that status." };
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    return { ok: false, reason: `Cannot move from ${from} to ${to}.` };
  }
  if (to === "cancelled" && !PRIVILEGED.includes(role)) {
    return { ok: false, reason: "Only owners and admins can cancel an order." };
  }
  return { ok: true };
}

export function requiresApproval(to: OrderStatus, role: WeftRole) {
  return to === "shipped" && !PRIVILEGED.includes(role);
}

export function nextStatuses(from: OrderStatus, role: WeftRole) {
  return ALLOWED_TRANSITIONS[from].filter((status) => checkTransition(from, status, role).ok);
}
