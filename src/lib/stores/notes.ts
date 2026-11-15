"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type NotesState = {
  notes: Record<string, string>;
  setNote: (orderId: string, html: string) => void;
  clear: () => void;
};

export const useOrderNotes = create<NotesState>()(
  persist(
    (set) => ({
      notes: {},
      setNote: (orderId, html) =>
        set((state) => ({ notes: { ...state.notes, [orderId]: html } })),
      clear: () => set({ notes: {} }),
    }),
    {
      name: "weft-order-notes",
      version: 1,
      skipHydration: true,
    },
  ),
);
