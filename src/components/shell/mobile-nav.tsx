"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { WeftWordmark } from "@/components/brand";
import { SidebarNav } from "@/components/shell/sidebar";
import { useState } from "react";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
          <Menu className="size-4.5" />
        </Button>
      </SheetTrigger>
      <SheetContent title="Weft navigation">
        <div className="flex h-14 shrink-0 items-center border-b border-sidebar-line px-4">
          <Link href="/" onClick={() => setOpen(false)}>
            <WeftWordmark />
          </Link>
        </div>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
