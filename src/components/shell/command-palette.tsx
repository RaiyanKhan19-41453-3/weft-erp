"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Command } from "cmdk";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Command as CommandIcon,
  Copy,
  LayoutDashboard,
  Layers,
  Moon,
  Plus,
  RotateCcw,
  Search,
  ShoppingCart,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { resetLocalDemoData } from "@/lib/stores/reset";

type CommandMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CommandMenuContext = React.createContext<CommandMenuContextValue | null>(null);

export function useCommandMenu() {
  const context = React.useContext(CommandMenuContext);
  if (!context) {
    throw new Error("useCommandMenu must be used inside CommandPaletteProvider");
  }
  return context;
}

const navigation = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Purchase orders", href: "/orders", icon: ShoppingCart },
  { label: "Create purchase order", href: "/orders/new", icon: Plus },
  { label: "Materials", href: "/materials", icon: Boxes },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Architecture notes", href: "/architecture", icon: Layers },
];

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const run = React.useCallback(
    (action: () => void) => {
      setOpen(false);
      window.setTimeout(action, 20);
    },
    [],
  );

  const go = React.useCallback(
    (href: string) => {
      run(() => router.push(href));
    },
    [router, run],
  );

  return (
    <CommandMenuContext.Provider value={{ open, setOpen }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="block max-w-[560px] p-0" hideClose>
          <DialogTitle className="sr-only">Command menu</DialogTitle>
          <DialogDescription className="sr-only">
            Search pages, jump to an order, or run an action.
          </DialogDescription>
          <Command
            label="Command menu"
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-faint"
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
          >
            <div className="flex items-center gap-2 border-b border-line px-3.5">
              <Search className="size-4 shrink-0 text-muted" />
              <Command.Input
                autoFocus
                value={query}
                onValueChange={setQuery}
                placeholder="Search orders, pages and actions…"
                className="h-12 w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
              />
              <Kbd>ESC</Kbd>
            </div>
            <Command.List className="max-h-[360px] overflow-y-auto overscroll-contain p-2">
              <Command.Empty className="px-3 py-8 text-center text-[12.5px] text-muted">
                No matches. Try a PO number, buyer, or page name.
              </Command.Empty>

              {query.trim().length > 1 ? (
                <Command.Group heading="Search">
                  <CommandItem
                    value={`search orders ${query}`}
                    onSelect={() => go(`/orders?q=${encodeURIComponent(query.trim())}`)}
                  >
                    <Search className="size-3.5" />
                    <span className="truncate">
                      Search purchase orders for “{query.trim()}”
                    </span>
                    <ArrowRight className="ml-auto size-3.5" />
                  </CommandItem>
                </Command.Group>
              ) : null}

              <Command.Group heading="Navigate">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.href}
                      value={`${item.label} ${item.href}`}
                      onSelect={() => go(item.href)}
                    >
                      <Icon className="size-3.5" />
                      {item.label}
                      <span className="ml-auto font-mono text-[10px] text-faint">
                        {item.href}
                      </span>
                    </CommandItem>
                  );
                })}
              </Command.Group>

              <Command.Group heading="Actions">
                <CommandItem
                  value="toggle theme dark light"
                  onSelect={() =>
                    run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))
                  }
                >
                  {resolvedTheme === "dark" ? (
                    <Sun className="size-3.5" />
                  ) : (
                    <Moon className="size-3.5" />
                  )}
                  Switch to {resolvedTheme === "dark" ? "light" : "dark"} mode
                </CommandItem>
                <CommandItem
                  value="copy current page link"
                  onSelect={() =>
                    run(async () => {
                      await navigator.clipboard.writeText(window.location.href);
                      toast.success("Page link copied");
                    })
                  }
                >
                  <Copy className="size-3.5" />
                  Copy current page link
                </CommandItem>
                <CommandItem
                  value="reset local demo data clear browser orders drafts notes"
                  onSelect={() =>
                    run(() => {
                      resetLocalDemoData();
                      toast.success("Browser-local demo data cleared");
                      router.push("/");
                    })
                  }
                >
                  <RotateCcw className="size-3.5" />
                  Reset browser-local demo data
                </CommandItem>
              </Command.Group>
            </Command.List>
            <div className="flex items-center justify-between border-t border-line bg-raised px-3.5 py-2 text-[10.5px] text-faint">
              <span className="flex items-center gap-1.5">
                <CommandIcon className="size-3" />
                <span>Weft quick actions</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <Kbd>↵</Kbd>
                  open
                </span>
              </span>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </CommandMenuContext.Provider>
  );
}

function CommandItem({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Command.Item>) {
  return (
    <Command.Item
      className={cn(
        "flex cursor-default select-none items-center gap-2.5 rounded-md px-2 py-2 text-[12.5px] text-ink outline-none data-[selected=true]:bg-sunken data-[selected=true]:text-ink [&_svg]:shrink-0 [&_svg]:text-muted",
        className,
      )}
      {...props}
    >
      {children}
    </Command.Item>
  );
}
