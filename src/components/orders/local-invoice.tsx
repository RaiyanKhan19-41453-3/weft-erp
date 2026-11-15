"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";
import { useLocalOrders, useLocalOrdersHydrated } from "@/lib/stores/local-orders";
import { InvoiceDocument } from "@/components/orders/invoice-document";
import { PrintToolbar } from "@/components/orders/print-toolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/skeleton";

export function LocalInvoice({ id }: { id: string }) {
  const ready = useLocalOrdersHydrated();
  const order = useLocalOrders((state) => state.orders.find((item) => item.id === id));

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-[880px] space-y-4">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-[900px] w-full rounded-none" />
      </div>
    );
  }

  if (!order) {
    return (
      <Card className="mx-auto max-w-xl">
        <EmptyState
          icon={<SearchX />}
          title={`Invoice ${id.replace("PO-", "INV-")} was not found`}
          description="This PO is neither in the generated dataset nor in browser storage. Create a PO to generate a printable invoice."
          action={
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/orders">Back to purchase orders</Link>
              </Button>
              <Button asChild variant="primary">
                <Link href="/orders/new">Create a PO</Link>
              </Button>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <PrintToolbar orderId={order.id} invoiceNo={order.id.replace("PO-", "INV-")} />
      <InvoiceDocument order={order} />
    </>
  );
}
