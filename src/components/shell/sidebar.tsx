"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  FileText,
  Layers,
  LayoutDashboard,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WeftWordmark } from "@/components/brand";
import { Badge } from "@/components/ui/badge";

export const navSections = [
  {
    label: "Operations",
    items: [
      { label: "Overview", href: "/", icon: LayoutDashboard },
      { label: "Purchase orders", href: "/orders", icon: ShoppingCart, badge: "5.0k" },
      { label: "New order", href: "/orders/new", icon: Plus },
      { label: "Materials", href: "/materials", icon: Boxes },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Architecture", href: "/architecture", icon: Layers, badge: "Case study" },
    ],
  },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/orders") {
    return pathname.startsWith("/orders") && pathname !== "/orders/new";
  }
  if (href === "/orders/new") return pathname === "/orders/new";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4" aria-label="Primary">
      {navSections.map((section) => (
        <div key={section.label}>
          <p className="mb-1.5 px-2 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-[12.5px] font-medium transition-colors",
                      active
                        ? "bg-sidebar-active text-sidebar-ink"
                        : "text-sidebar-muted hover:bg-white/[0.045] hover:text-sidebar-ink",
                    )}
                  >
                    {active ? (
                      <span className="absolute -left-3 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-sidebar-brand" />
                    ) : null}
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-sidebar-brand" : "text-sidebar-muted",
                      )}
                      strokeWidth={1.8}
                    />
                    <span className="truncate">{item.label}</span>
                    {"badge" in item && item.badge ? (
                      <Badge
                        tone="neutral"
                        className={cn(
                          "ml-auto border-0 bg-white/[0.06] px-1.5 text-[9px] ring-white/10",
                          active ? "text-sidebar-ink" : "text-sidebar-muted",
                        )}
                      >
                        {item.badge}
                      </Badge>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="mt-auto space-y-3 px-1">
        <div className="rounded-lg border border-sidebar-line bg-white/[0.025] p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-sidebar-muted">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
            </span>
            Demo workspace
          </div>
          <p className="mt-1.5 text-[11.5px] leading-4 text-sidebar-ink/85">
            5,000 synthetic POs across 4 production units.
          </p>
          <p className="mt-1 text-[10px] text-sidebar-muted">Snapshot · 16 Nov 2026</p>
        </div>
        <Link
          href="/architecture"
          onClick={onNavigate}
          className="flex items-center gap-1.5 px-2 text-[10.5px] text-sidebar-muted transition-colors hover:text-sidebar-ink"
        >
          <FileText className="size-3" />
          How this was built
        </Link>
      </div>
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-[236px] flex-col border-r border-sidebar-line bg-sidebar lg:flex">
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-line px-4">
        <Link href="/" className="rounded-md">
          <WeftWordmark />
        </Link>
      </div>
      <SidebarNav />
      <div className="flex h-9 shrink-0 items-center border-t border-sidebar-line px-4 text-[9.5px] uppercase tracking-[0.12em] text-sidebar-muted">
        Apparel ERP · v1.4
      </div>
    </aside>
  );
}
