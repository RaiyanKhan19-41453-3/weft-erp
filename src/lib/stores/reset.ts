"use client";

import { useLocalOrders } from "@/lib/stores/local-orders";
import { useOrderNotes } from "@/lib/stores/notes";
import { useOrderDraft } from "@/lib/stores/order-draft";
import { useTablePrefs } from "@/lib/stores/table-prefs";

export function resetLocalDemoData() {
  if (typeof window === "undefined") return;
  useLocalOrders.getState().clear();
  useOrderNotes.getState().clear();
  useOrderDraft.getState().clear();
  useTablePrefs.setState({ density: "compact" });

  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("weft-")) localStorage.removeItem(key);
  }
}
