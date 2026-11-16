import type { Metadata } from "next";
import { Suspense } from "react";
import { getOrderApprovals, getOrderDetail, getOrderEvents, getOrderIds } from "@/lib/data/server";
import { canChangeStatus, canDecideApprovals, getViewer } from "@/lib/auth-guards";
import type { WeftRole } from "@/lib/permissions";
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
  const [order, events, approvals] = await Promise.all([
    getOrderDetail(id, viewer.orgId),
    getOrderEvents(id, viewer.orgId),
    getOrderApprovals(id, viewer.orgId),
  ]);

  if (order) {
    return (
      <OrderDetailView
        order={order}
        events={events}
        approvals={approvals}
        canDecideApprovals={canDecideApprovals(viewer.role)}
        canChangeStatus={canChangeStatus(viewer.role)}
        role={viewer.role as WeftRole | "public"}
      />
    );
  }

  return <LocalOrderDetail id={id} />;
}
