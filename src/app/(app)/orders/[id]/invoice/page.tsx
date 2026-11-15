import type { Metadata } from "next";
import { Suspense } from "react";
import { getOrderDetail, getOrderIds } from "@/lib/data/server";
import { InvoiceDocument } from "@/components/orders/invoice-document";
import { LocalInvoice } from "@/components/orders/local-invoice";
import { PrintToolbar } from "@/components/orders/print-toolbar";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Commercial invoice",
  description:
    "A4 print-ready commercial invoice and packing list with a print stylesheet and Code 39-style barcode.",
};

type Params = Promise<{ id: string }>;

export async function generateStaticParams() {
  const ids = await getOrderIds(8);
  return ids.map((id) => ({ id }));
}

export default function InvoicePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<InvoiceSkeleton />}>
      <InvoiceContent params={params} />
    </Suspense>
  );
}

async function InvoiceContent({ params }: { params: Params }) {
  const { id } = await params;
  const order = await getOrderDetail(id);

  if (!order) {
    return <LocalInvoice id={id} />;
  }

  return (
    <>
      <PrintToolbar orderId={order.id} invoiceNo={order.id.replace("PO-", "INV-")} />
      <InvoiceDocument order={order} />
    </>
  );
}

function InvoiceSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[880px] space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-36" />
      </div>
      <Skeleton className="h-[980px] w-full" />
    </div>
  );
}
