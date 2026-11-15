import Link from "next/link";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { CommandPaletteProvider } from "@/components/shell/command-palette";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <CommandPaletteProvider>
      <a
        href="#main-content"
        className="no-print sr-only z-[100] rounded-control bg-ink px-3 py-2 text-[12px] font-medium text-surface focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="app-content min-h-dvh lg:pl-[236px]">
        <Topbar />
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1560px] px-4 py-5 md:px-6 lg:px-8 lg:py-7"
        >
          {children}
        </main>
        <footer className="no-print mx-auto flex w-full max-w-[1560px] flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-6 text-[10.5px] text-faint md:px-6 lg:px-8">
          <span>Weft · apparel operations console</span>
          <span className="text-line-strong">/</span>
          <span>Synthetic dataset · snapshot 16 Nov 2026</span>
          <span className="text-line-strong">/</span>
          <Link href="/architecture" className="transition-colors hover:text-ink">
            Architecture &amp; tradeoffs
          </Link>
          <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.08em]">
            Next.js 16 · React 19 · Tailwind v4
          </span>
        </footer>
      </div>
    </CommandPaletteProvider>
  );
}
