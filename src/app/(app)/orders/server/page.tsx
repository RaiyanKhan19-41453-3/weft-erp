import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ServerOrdersTable } from "@/components/orders/server-orders-table";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Server-driven orders",
  description: "Postgres-backed pagination, sorting, filtering and search for the order book.",
};

export default function ServerOrdersPage() {
  return (
    <>
      <PageHeader
        eyebrow={<span>Order book / Server mode</span>}
        title="Server-driven orders"
        description="The same ERP data queried through Postgres with cursor-style paging, indexed filters and full-text search."
        actions={
          <Button asChild variant="outline">
            <Link href="/orders">
              <ArrowLeft />
              Client explorer
            </Link>
          </Button>
        }
      />
      <ServerOrdersTable />
    </>
  );
}
