import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Database, FileUp, Plus } from "lucide-react";
import { BUYERS, ORDER_STATUSES, DEMO_TODAY_LABEL, type OrderStatus } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { OrdersExplorer } from "@/components/orders/explorer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Purchase orders",
  description:
    "A virtualized, filterable book of 5,000 synthetic apparel purchase orders with server-side caching and URL-addressable filters.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <span>Order book</span>
            <span className="text-line-strong">/</span>
            <span className="normal-case tracking-normal text-faint">
              5,000 POs · snapshot {DEMO_TODAY_LABEL}
            </span>
          </>
        }
        title="Purchase orders"
        description="Every PO across four production units. Filter without waiting, sort any column, and open a PO for the full production and shipping record."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/orders/import">
                <FileUp />
                Import CSV
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/orders/server">
                <Database />
                Server mode
              </Link>
            </Button>
            <Button asChild variant="primary">
              <Link href="/orders/new">
                <Plus />
                New purchase order
              </Link>
            </Button>
          </>
        }
      />

      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersWithParams searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function OrdersWithParams({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const rawQuery = typeof params.q === "string" ? params.q : "";
  const initialQuery = rawQuery.slice(0, 120);

  const rawStatus = typeof params.status === "string" ? params.status : "";
  const initialStatus: OrderStatus | "all" = ORDER_STATUSES.includes(rawStatus as OrderStatus)
    ? (rawStatus as OrderStatus)
    : "all";

  const rawBuyer = typeof params.buyer === "string" ? params.buyer : "";
  const initialBuyer = BUYERS.some((buyer) => buyer.name === rawBuyer) ? rawBuyer : "all";

  const initialRisk = params.risk === "1" || params.risk === "true";

  return (
    <OrdersExplorer
      initialQuery={initialQuery}
      initialStatus={initialStatus}
      initialBuyer={initialBuyer}
      initialRisk={initialRisk}
    />
  );
}

function OrdersSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
        <Skeleton className="h-8 w-[240px]" />
        <Skeleton className="h-8 w-[132px]" />
        <Skeleton className="h-8 w-[142px]" />
        <Skeleton className="h-8 w-[96px]" />
        <Skeleton className="ml-auto h-8 w-[100px]" />
        <Skeleton className="h-8 w-[110px]" />
      </div>
      <TableSkeleton rows={12} />
      <div className="flex items-center gap-3 border-t border-line px-3 py-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="ml-auto h-3 w-24" />
      </div>
    </Card>
  );
}
