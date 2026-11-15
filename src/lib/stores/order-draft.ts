"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NewOrderInput } from "@/lib/validation/new-order";

type OrderDraftState = {
  draft: NewOrderInput | null;
  updatedAt: string | null;
  save: (draft: NewOrderInput | null) => void;
  clear: () => void;
};

export const useOrderDraft = create<OrderDraftState>()(
  persist(
    (set) => ({
      draft: null,
      updatedAt: null,
      save: (draft) =>
        set({
          draft,
          updatedAt: draft ? new Date().toISOString() : null,
        }),
      clear: () => set({ draft: null, updatedAt: null }),
    }),
    {
      name: "weft-order-draft",
      version: 1,
      skipHydration: true,
    },
  ),
);
