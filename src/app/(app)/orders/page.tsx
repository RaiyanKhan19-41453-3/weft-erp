import type { Metadata } from "next";
import Link from "next/link";
import { Database, FileUp, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ServerOrdersTable } from "@/components/orders/server-orders-table";
import { Button } from "@/components/ui/button";
import { DEMO_TODAY_LABEL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Purchase orders",
  description:
    "Postgres-driven order book with server-side paging, sorting, filtering and full-text search.",
};

export default function OrdersPage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <span>Order book</span>
            <span className="text-line-strong">/</span>
            <span className="normal-case tracking-normal text-faint">
              Snapshot {DEMO_TODAY_LABEL}
            </span>
          </>
        }
        title="Purchase orders"
        description="Filter, sort and page the order book in Postgres. One page of 50 rows is fetched at a time instead of the whole dataset."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/orders/client">
                <Database />
                Client explorer
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/orders/import">
                <FileUp />
                Import CSV
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
      <ServerOrdersTable />
    </>
  );
}
