"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocalDataHydrator } from "@/components/local-data-hydrator";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <LocalDataHydrator />
        {children}
        <Toaster
          position="bottom-right"
          closeButton
          gap={8}
          toastOptions={{
            classNames: {
              toast:
                "!rounded-lg !border !border-line !bg-surface !text-ink !shadow-pop !text-[12.5px]",
              title: "!font-medium",
              description: "!text-muted !text-[11.5px]",
              actionButton: "!bg-ink !text-surface !text-[11px] !rounded-md",
              cancelButton: "!bg-sunken !text-ink !text-[11px] !rounded-md",
              closeButton:
                "!bg-surface !border-line !text-muted hover:!text-ink",
            },
          }}
        />
      </TooltipProvider>
    </ThemeProvider>
  );
}
