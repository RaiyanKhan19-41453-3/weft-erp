"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Boxes,
  ChevronDown,
  ClipboardCheck,
  CornerDownRight,
  Layers,
  Plus,
  RotateCcw,
  Search,
  ShoppingCart,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { MobileNav } from "@/components/shell/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCommandMenu } from "@/components/shell/command-palette";
import { Button } from "@/components/ui/button";
import { Kbd, Avatar } from "@/components/ui/misc";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { resetLocalDemoData } from "@/lib/stores/reset";

const routeLabels: Record<string, string> = {
  orders: "Purchase orders",
  new: "New PO",
  materials: "Materials",
  analytics: "Analytics",
  architecture: "Architecture",
  invoice: "Invoice",
};

function useBreadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/") {
    return [{ label: "Overview", href: "/" }];
  }
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((part, index) => {
    const href = `/${parts.slice(0, index + 1).join("/")}`;
    const label =
      routeLabels[part] ??
      (part.startsWith("PO-") ? part : part.charAt(0).toUpperCase() + part.slice(1));
    return { label, href };
  });
}

export function Topbar() {
  const { setOpen } = useCommandMenu();
  const crumbs = useBreadcrumbs();
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

  const resetDemo = () => {
    resetLocalDemoData();
    toast.success("Browser-local demo data cleared");
    router.push("/");
  };

  return (
    <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-canvas/85 px-3 backdrop-blur-md md:px-5">
      <MobileNav />
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-1.5 text-[12px]">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <li
                key={`${crumb.href}-${index}`}
                className={cn(
                  "flex min-w-0 items-center gap-1.5",
                  index === 0 && crumbs.length > 1 ? "hidden sm:flex" : "flex",
                )}
              >
                {index > 0 ? (
                  <span aria-hidden className="text-line-strong">
                    /
                  </span>
                ) : null}
                {last ? (
                  <span className="truncate font-medium text-ink" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="truncate text-muted transition-colors hover:text-ink"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mr-1 hidden h-8 w-[228px] items-center gap-2 rounded-control border border-line-strong bg-surface px-2.5 text-left text-[12px] text-faint shadow-xs transition-colors hover:border-line-strong hover:text-muted sm:flex xl:w-[260px]"
        >
          <Search className="size-3.5" />
          <span>Search orders, pages…</span>
          <span className="ml-auto flex items-center gap-0.5">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open command menu"
        >
          <Search className="size-4" />
        </Button>

        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Operations shortcuts"
            >
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-brand ring-2 ring-canvas" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="end">
            <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
              <p className="text-[12px] font-semibold">Needs attention</p>
              <span className="text-[10px] uppercase tracking-[0.08em] text-faint">Queues</span>
            </div>
            <div className="p-1.5">
              <QueueLink
                href="/orders?risk=1"
                icon={<TriangleAlert className="size-3.5 text-danger" />}
                title="At-risk purchase orders"
                description="Overdue or behind schedule"
                onNavigate={() => setNotificationsOpen(false)}
              />
              <QueueLink
                href="/orders?status=qc"
                icon={<ClipboardCheck className="size-3.5 text-violet-600 dark:text-violet-400" />}
                title="QC queue"
                description="Awaiting final inspection"
                onNavigate={() => setNotificationsOpen(false)}
              />
              <QueueLink
                href="/materials"
                icon={<Boxes className="size-3.5 text-amber-600 dark:text-amber-400" />}
                title="Low-stock materials"
                description="Below reorder point"
                onNavigate={() => setNotificationsOpen(false)}
              />
              <QueueLink
                href="/orders/new"
                icon={<Plus className="size-3.5 text-brand" />}
                title="Create a purchase order"
                description="Start a multi-step PO"
                onNavigate={() => setNotificationsOpen(false)}
              />
            </div>
          </PopoverContent>
        </Popover>

        <ThemeToggle />

        <span className="mx-1 hidden h-5 w-px bg-line sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 items-center gap-1.5 rounded-control px-1 text-left outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-brand/40"
              aria-label="Workspace menu"
            >
              <Avatar name="Demo Operator" className="size-7 bg-brand-soft text-[9px] text-brand-ink dark:bg-brand/15 dark:text-brand" />
              <span className="hidden text-[12px] font-medium md:block">Demo operator</span>
              <ChevronDown className="hidden size-3.5 text-muted md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Workspace</DropdownMenuLabel>
            <div className="px-2 pb-2">
              <p className="text-[12px] font-medium">Weft demo</p>
              <p className="text-[10.5px] text-muted">No sign-in · synthetic data</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/architecture">
                <Layers />
                Architecture notes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/orders">
                <ShoppingCart />
                All purchase orders
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={resetDemo} className="text-danger focus:bg-danger/10">
              <RotateCcw />
              Reset local demo data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function QueueLink({
  href,
  icon,
  title,
  description,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group flex items-start gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-sunken"
    >
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-line bg-raised">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] font-medium text-ink">{title}</span>
        <span className="block text-[10.5px] text-muted">{description}</span>
      </span>
      <CornerDownRight className="ml-auto mt-1 size-3 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
