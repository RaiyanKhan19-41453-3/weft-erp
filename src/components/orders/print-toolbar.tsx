"use client";

import Link from "next/link";
import { ArrowLeft, Package, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintToolbar({
  orderId,
  invoiceNo,
}: {
  orderId: string;
  invoiceNo: string;
}) {
  return (
    <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/orders/${orderId}`}>
            <ArrowLeft />
            Back to order
          </Link>
        </Button>
        <span className="hidden h-4 w-px bg-line sm:block" />
        <div>
          <p className="font-mono text-[12px] font-semibold">{invoiceNo}</p>
          <p className="text-[10px] text-faint">
            A4 commercial invoice · print stylesheet · two pages
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <a href="#packing">
            <Package />
            Packing list
          </a>
        </Button>
        <Button variant="primary" size="sm" onClick={() => window.print()}>
          <Printer />
          Print / Save PDF
        </Button>
      </div>
    </div>
  );
}
