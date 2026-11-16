import type { Metadata } from "next";
import { Suspense } from "react";
import { getOrderDetail, getOrderEvents, getOrderIds } from "@/lib/data/server";
import { OrderDetailView } from "@/components/orders/order-detail-view";
import { LocalOrderDetail } from "@/components/orders/local-order-detail";
import { OrderDetailSkeleton } from "@/components/orders/detail-skeleton";

export const metadata: Metadata = {
  title: "Purchase order",
  description: "Production, quality and shipment detail for an apparel purchase order.",
};

type Params = Promise<{ id: string }>;

export async function generateStaticParams() {
  const ids = await getOrderIds(8);
  return ids.map((id) => ({ id }));
}

export default function OrderPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <OrderContent params={params} />
    </Suspense>
  );
}

async function OrderContent({ params }: { params: Params }) {
  const { id } = await params;
  const [order, events] = await Promise.all([getOrderDetail(id), getOrderEvents(id)]);

  if (order) {
    return (
      <OrderDetailView
        order={order}
        events={events}
        mutationsEnabled={Boolean(process.env.DATABASE_URL)}
      />
    );
  }

  return <LocalOrderDetail id={id} />;
}
