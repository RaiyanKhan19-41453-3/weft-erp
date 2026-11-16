import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { WeftMark } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="grid-wash flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-card border border-line bg-surface p-8 shadow-card">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg border border-brand/20 bg-brand-soft/60 text-brand">
            <WeftMark className="size-6" />
          </span>
          <div>
            <p className="text-[15px] font-semibold tracking-[-0.02em]">Weft</p>
            <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-faint">
              Apparel operations
            </p>
          </div>
        </div>

        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
          404 · route not found
        </p>
        <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.03em]">
          This page is off the cutting table
        </h1>
        <p className="mt-2 max-w-sm text-[12.5px] leading-5 text-muted">
          The link may be mistyped, or the page was removed. The synthetic order book, materials
          and analytics views are all still available.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Button asChild variant="primary">
            <Link href="/">
              <ArrowLeft />
              Operations overview
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/orders">
              <Compass />
              Browse purchase orders
            </Link>
          </Button>
        </div>

        <p className="mt-6 border-t border-line pt-3 text-[10px] text-faint">
          Looking for a local PO? Browser-created orders use the{" "}
          <code className="font-mono text-[9.5px]">PO-26-L…</code> format and only exist in the
          browser that created them.
        </p>
      </div>
    </main>
  );
}
