import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CircleAlert,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { getDashboard } from "@/lib/data/server";
import { getViewer } from "@/lib/auth-guards";
import { PageHeader } from "@/components/page-header";
import { KpiGrid } from "@/components/dashboard/kpi-card";
import { ThroughputChart, PipelineChart } from "@/components/dashboard/charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/misc";
import { OrderStatusBadge, PriorityBadge } from "@/components/orders/status-badge";
import {
  cn,
  formatDate,
  formatDateShort,
  formatDueLabel,
  formatMoney,
  formatNumber,
  isOverdue,
} from "@/lib/utils";
import { DEMO_TODAY_LABEL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Operations overview",
};

export const instant = false;

export default async function DashboardPage() {
  const viewer = await getViewer();
  const data = await getDashboard(viewer.orgId);
  const maxBuyerValue = Math.max(...data.topBuyers.map((buyer) => buyer.value), 1);

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-positive opacity-40" />
                <span className="relative inline-flex size-1.5 rounded-full bg-positive" />
              </span>
              Live operations
            </span>
            <span className="text-line-strong">/</span>
            <span className="normal-case tracking-normal text-faint">
              Snapshot {DEMO_TODAY_LABEL}
            </span>
          </>
        }
        title="Operations overview"
        description="Purchase orders, floor output and shipment risk across four production units — one view for the merchandising and production teams."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/analytics">
                <BarChart3 />
                Reports
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

      {data.atRiskOrders > 0 ? (
        <div className="mb-3 flex flex-col gap-3 rounded-card border border-amber-300/70 bg-amber-50/70 px-4 py-3 sm:flex-row sm:items-center dark:border-amber-500/20 dark:bg-amber-500/[0.07]">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <CircleAlert className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-medium text-amber-900 dark:text-amber-200">
              {data.atRiskOrders} purchase orders are overdue or behind schedule
            </p>
            <p className="text-[11px] text-amber-900 dark:text-amber-200/90">
              {formatMoney(data.atRiskValue)} of pipeline value is exposed. Oldest due dates are
              shown first.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-[9.5px] uppercase tracking-[0.08em] text-amber-800 dark:text-amber-200/90">
                On-time
              </span>
              <span className="numeric text-[13px] font-semibold text-amber-900 dark:text-amber-200">
                {data.onTimeRate}%
              </span>
            </span>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-amber-300 bg-amber-100/50 text-amber-900 hover:bg-amber-100 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/15"
            >
              <Link href="/orders?risk=1">
                Review queue
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      <KpiGrid kpis={data.kpis} />

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[1.62fr_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <div>
              <CardTitle>Shipment throughput</CardTitle>
              <CardDescription>Shipped units per week · last 12 weeks</CardDescription>
            </div>
            <div className="hidden items-center gap-3 pt-0.5 text-[10px] text-muted sm:flex">
              <span className="flex items-center gap-1.5">
                <span className="h-[2px] w-4 rounded bg-chart-1" />
                Shipped
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-[2px] w-4 border-t border-dashed border-chart-2" />
                Target
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <ThroughputChart data={data.throughput} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <div>
              <CardTitle>Portfolio mix</CardTitle>
              <CardDescription>Every PO by current stage</CardDescription>
            </div>
            <Badge tone="neutral" className="mt-0.5">
              {formatNumber(data.totalOrders)} POs
            </Badge>
          </CardHeader>
          <CardContent className="pt-1">
            <PipelineChart data={data.statusMix} total={data.totalOrders} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[1.62fr_1fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>At-risk purchase orders</CardTitle>
              <CardDescription>Overdue or more than 7 days behind plan</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/orders?risk=1">
                View all
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[660px] text-left text-[12px]">
                <thead>
                  <tr className="border-y border-line bg-raised/60 text-[9.5px] uppercase tracking-[0.08em] text-faint">
                    <th className="px-4 py-2 font-medium">PO</th>
                    <th className="px-3 py-2 font-medium">Buyer</th>
                    <th className="px-3 py-2 font-medium">Stage</th>
                    <th className="px-3 py-2 font-medium">Due</th>
                    <th className="px-3 py-2 font-medium">Progress</th>
                    <th className="px-3 py-2 font-medium">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.riskOrders.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-raised/70">
                      <td className="px-4 py-2">
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-mono text-[11.5px] font-medium text-ink hover:text-brand"
                        >
                          {order.id}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <span className="block max-w-[130px] truncate font-medium">
                          {order.buyer}
                        </span>
                        <span className="block text-[10px] text-faint">{order.buyerCountry}</span>
                      </td>
                      <td className="px-3 py-2">
                        <OrderStatusBadge status={order.status} short />
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn("block text-[11.5px]", isOverdue(order.dueDate) && "text-danger")}>
                          {formatDateShort(order.dueDate)}
                        </span>
                        <span
                          className={cn(
                            "block text-[10px]",
                            isOverdue(order.dueDate) ? "text-danger" : "text-faint",
                          )}
                        >
                          {formatDueLabel(order.dueDate)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={order.progress}
                            className="w-16"
                            indicatorClassName={cn(
                              order.progress < 40 ? "bg-danger" : "bg-warning",
                            )}
                            label={`${order.buyer} progress`}
                          />
                          <span className="numeric text-[10.5px] text-muted">{order.progress}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <PriorityBadge priority={order.priority} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top buyers</CardTitle>
              <CardDescription>By open pipeline value</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/analytics">
                Scorecards
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1 pt-0.5">
            {data.topBuyers.map((buyer, index) => (
              <Link
                key={buyer.name}
                href={`/orders?buyer=${encodeURIComponent(buyer.name)}`}
                className="block rounded-md px-1.5 py-2 transition-colors hover:bg-raised"
              >
                <div className="flex items-center gap-2">
                  <span className="numeric w-3 text-[10px] text-faint">0{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[12px] font-medium">{buyer.name}</p>
                      <p className="numeric text-[11.5px] font-medium">{formatMoney(buyer.value)}</p>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-sunken">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${Math.max(6, (buyer.value / maxBuyerValue) * 100)}%` }}
                        />
                      </div>
                      <span className="numeric w-16 text-right text-[9.5px] text-faint">
                        {buyer.activeOrders} open
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            <div className="mt-1 flex items-center justify-between border-t border-line px-1.5 pt-2.5 text-[10px] text-faint">
              <span>{data.buyers} active buyers</span>
              <span className="flex items-center gap-1">
                {data.atRiskOrders > 0 ? (
                  <>
                    <TrendingDown className="size-3 text-danger" />
                    {data.atRiskOrders} at risk
                  </>
                ) : (
                  <>
                    <TrendingUp className="size-3 text-positive" />
                    On track
                  </>
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[1.62fr_1fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recently created</CardTitle>
              <CardDescription>Latest POs entering the book</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/orders">
                All orders
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-[12px]">
                <thead>
                  <tr className="border-y border-line bg-raised/60 text-[9.5px] uppercase tracking-[0.08em] text-faint">
                    <th className="px-4 py-2 font-medium">PO</th>
                    <th className="px-3 py-2 font-medium">Buyer / style</th>
                    <th className="px-3 py-2 font-medium">Created</th>
                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                    <th className="px-3 py-2 text-right font-medium">Value</th>
                    <th className="px-3 py-2 font-medium">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.recentOrders.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-raised/70">
                      <td className="px-4 py-2">
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-mono text-[11.5px] font-medium hover:text-brand"
                        >
                          {order.id}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <span className="block max-w-[180px] truncate font-medium">
                          {order.buyer}
                        </span>
                        <span className="block max-w-[180px] truncate text-[10px] text-faint">
                          {order.style}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-muted">
                        {formatDate(order.createdAt, { day: "2-digit", month: "short" })}
                      </td>
                      <td className="numeric px-3 py-2 text-right">{formatNumber(order.quantity)}</td>
                      <td className="numeric px-3 py-2 text-right">{formatMoney(order.value)}</td>
                      <td className="px-3 py-2">
                        <OrderStatusBadge status={order.status} short />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Materials below reorder</CardTitle>
              <CardDescription>Fabric, trims and packaging</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/materials">
                <Boxes />
                Inventory
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-0.5">
            {data.lowStock.map((material) => {
              const ratio = Math.min(100, (material.onHand / (material.reorderPoint * 1.4)) * 100);
              return (
                <div key={material.sku} className="rounded-md border border-line bg-raised/50 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[11.5px] font-medium">{material.name}</p>
                      <p className="font-mono text-[9.5px] text-faint">{material.sku}</p>
                    </div>
                    <Badge tone={material.status === "low" ? "red" : "amber"} size="sm">
                      {material.status === "low" ? "Reorder" : "Watch"}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-sunken">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          material.status === "low" ? "bg-danger" : "bg-warning",
                        )}
                        style={{ width: `${Math.max(4, ratio)}%` }}
                      />
                    </div>
                    <span className="numeric text-[9.5px] text-muted">
                      {formatNumber(material.onHand)} / {formatNumber(material.reorderPoint)}{" "}
                      {material.unit}
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-2 rounded-md bg-sunken/60 px-2.5 py-2 text-[10px] text-muted">
              <CircleAlert className="size-3.5 shrink-0 text-warning" />
              {data.lowStock.length} SKUs need a purchase requisition this week.
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mt-6 rounded-card border border-dashed border-line-strong/80 px-4 py-3.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11.5px] font-medium">How this dashboard is built</p>
            <p className="mt-0.5 max-w-2xl text-[10.5px] leading-4 text-muted">
              Server Components render the shell and cached data; only the two charts and the
              interactive order table ship client JavaScript. Chart and editor bundles are loaded
              on demand.
            </p>
          </div>
          <Link
            href="/architecture"
            className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-brand hover:underline"
          >
            Read the case study
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>
    </>
  );
}
