"use client";

import Link from "next/link";
import { useLocalOrders, useLocalOrdersHydrated } from "@/lib/stores/local-orders";
import { OrderDetailView } from "@/components/orders/order-detail-view";
import { OrderDetailSkeleton } from "@/components/orders/detail-skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { SearchX } from "lucide-react";

export function LocalOrderDetail({ id }: { id: string }) {
  const ready = useLocalOrdersHydrated();
  const order = useLocalOrders((state) => state.orders.find((item) => item.id === id));

  if (!ready) return <OrderDetailSkeleton />;

  if (!order) {
    return (
      <Card>
        <EmptyState
          icon={<SearchX />}
          title={`Purchase order ${id} was not found`}
          description="It may have been created in another browser, or the local demo data was cleared. Server-generated POs use the PO-26-#### format."
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

  return <OrderDetailView order={order} />;
}
