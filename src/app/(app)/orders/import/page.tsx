import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ImportForm } from "@/components/orders/import-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Import orders",
  description: "CSV import with validation preview using the shared Zod schema.",
};

export default function ImportOrdersPage() {
  return (
    <>
      <PageHeader
        eyebrow={<span>Order book / Import</span>}
        title="Import purchase orders"
        description="Validate a CSV batch before any write. This preview uses the same schema as the wizard and the API."
        actions={
          <Button asChild variant="outline">
            <Link href="/orders">
              <ArrowLeft />
              Back to orders
            </Link>
          </Button>
        }
      />
      <ImportForm />
    </>
  );
}
