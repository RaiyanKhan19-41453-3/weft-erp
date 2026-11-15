"use client";

import { useEffect } from "react";
import { useLocalOrders } from "@/lib/stores/local-orders";
import { useOrderNotes } from "@/lib/stores/notes";
import { useTablePrefs } from "@/lib/stores/table-prefs";

export function LocalDataHydrator() {
  useEffect(() => {
    void useLocalOrders.persist.rehydrate();
    void useOrderNotes.persist.rehydrate();
    void useTablePrefs.persist.rehydrate();
  }, []);

  return null;
}
