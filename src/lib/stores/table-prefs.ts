"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Density = "compact" | "comfortable";

type TablePrefsState = {
  density: Density;
  setDensity: (density: Density) => void;
  toggleDensity: () => void;
};

export const useTablePrefs = create<TablePrefsState>()(
  persist(
    (set) => ({
      density: "compact",
      setDensity: (density) => set({ density }),
      toggleDensity: () =>
        set((state) => ({ density: state.density === "compact" ? "comfortable" : "compact" })),
    }),
    {
      name: "weft-table-prefs",
      version: 1,
      skipHydration: true,
    },
  ),
);
