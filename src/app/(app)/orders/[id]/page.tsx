import type { Metadata } from "next";
import { Suspense } from "react";
import { getOrderDetail, getOrderEvents, getOrderIds } from "@/lib/data/server";
import { getViewer } from "@/lib/auth-guards";
import { OrderDetailView } from "@/components/orders/order-detail-view";
import { LocalOrderDetail } from "@/components/orders/local-order-detail";
import { OrderDetailSkeleton } from "@/components/orders/detail-skeleton";

export const metadata: Metadata = {
  title: "Purchase order",
  description: "Production, quality and shipment detail for an apparel purchase order.",
};

export const instant = false;

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
  const viewer = await getViewer();
  const [order, events] = await Promise.all([
    getOrderDetail(id, viewer.orgId),
    getOrderEvents(id, viewer.orgId),
  ]);

  if (order) {
    return (
      <OrderDetailView
        order={order}
        events={events}
        canChangeStatus={viewer.role === "owner" || viewer.role === "admin" || viewer.role === "factory"}
      />
    );
  }

  return <LocalOrderDetail id={id} />;
}
