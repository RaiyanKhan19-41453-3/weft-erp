"use client";

import * as React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrderDetail } from "@/lib/constants";

type LocalOrdersState = {
  orders: OrderDetail[];
  addOrder: (order: OrderDetail) => void;
  removeOrder: (id: string) => void;
  clear: () => void;
};

export const useLocalOrders = create<LocalOrdersState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) =>
        set((state) => ({
          orders: [order, ...state.orders.filter((item) => item.id !== order.id)].slice(0, 20),
        })),
      removeOrder: (id) =>
        set((state) => ({ orders: state.orders.filter((item) => item.id !== id) })),
      clear: () => set({ orders: [] }),
    }),
    {
      name: "weft-local-orders",
      version: 1,
      skipHydration: true,
    },
  ),
);

/**
 * Tracks Zustand persist hydration without setting state inside an effect.
 * The store uses skipHydration, so the first client render reads local data
 * only after onFinishHydration fires.
 */
export function useLocalOrdersHydrated() {
  const hydrated = React.useSyncExternalStore(
    (callback) => useLocalOrders.persist.onFinishHydration(callback),
    () => useLocalOrders.persist.hasHydrated(),
    () => false,
  );

  React.useEffect(() => {
    if (!useLocalOrders.persist.hasHydrated()) {
      void useLocalOrders.persist.rehydrate();
    }
  }, []);

  return hydrated;
}
