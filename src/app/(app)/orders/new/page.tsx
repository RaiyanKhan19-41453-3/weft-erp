import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { NewOrderForm } from "@/components/orders/new-order-form";
import { Button } from "@/components/ui/button";
import { DEMO_TODAY_LABEL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "New purchase order",
  description:
    "A multi-step purchase order form with React Hook Form, Zod validation, browser-local draft persistence and a validated API route.",
};

export default function NewOrderPage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <span>Order book</span>
            <span className="text-line-strong">/</span>
            <span className="normal-case tracking-normal text-faint">
              Draft · snapshot {DEMO_TODAY_LABEL}
            </span>
          </>
        }
        title="New purchase order"
        description="Raise a synthetic PO in three steps. Your draft survives a refresh; the API validates the final payload before the order is stored in this browser."
        actions={
          <Button asChild variant="outline">
            <Link href="/orders">
              <ArrowLeft />
              Back to orders
            </Link>
          </Button>
        }
      />
      <NewOrderForm />
    </>
  );
}
