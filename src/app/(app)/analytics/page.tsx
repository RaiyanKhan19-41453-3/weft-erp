import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  Factory,
  PackageCheck,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { getAnalytics } from "@/lib/data/server";
import { FACTORIES } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { FactoryOutputChart, OnTimeTrendChart } from "@/components/analytics/charts";
import { ExportBuyersButton } from "@/components/analytics/export-buyers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkline } from "@/components/ui/sparkline";
import {
  cn,
  formatCompactNumber,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatPercent,
} from "@/lib/utils";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Factory output, on-time shipment trends, capacity utilisation, defect causes and buyer scorecards for a synthetic apparel operation.",
};

export default async function AnalyticsPage() {
  const data = await getAnalytics();
  const monthlyTotals = data.factoryOutput.map((row) =>
    FACTORIES.reduce((total, factory) => total + Number(row[factory.short] ?? 0), 0),
  );
  const topBuyer = data.buyers[0];
  const overCapacity = data.capacity.filter((unit) => unit.committed > unit.capacity);
  const tightest = [...data.capacity].sort(
    (a, b) => b.committed / b.capacity - a.committed / a.capacity,
  )[0];
  const weakestOnTime = [...data.buyers]
    .filter((buyer) => buyer.onTimeRate > 0)
    .sort((a, b) => a.onTimeRate - b.onTimeRate)[0];
  const maxDefect = Math.max(...data.defectCauses.map((cause) => cause.rate), 1);

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <span>Reports</span>
            <span className="text-line-strong">/</span>
            <span className="normal-case tracking-normal text-faint">
              5,000 synthetic POs · snapshot 16 Nov 2026
            </span>
          </>
        }
        title="Analytics"
        description="Six-month shipment performance, capacity pressure and buyer scorecards. Numbers are derived from the same deterministic order book used across the workspace."
        actions={
          <>
            <ExportBuyersButton buyers={data.buyers} />
            <Button asChild variant="primary">
              <Link href="/architecture">
                How it works
                <ArrowRight />
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AnalyticsKpi
          icon={<PackageCheck className="size-4" />}
          label="Shipped units"
          value={formatCompactNumber(data.totalShippedUnits)}
          note={`${formatNumber(data.totalShippedUnits)} pcs across 6 months`}
          trend={monthlyTotals}
        />
        <AnalyticsKpi
          icon={<Clock3 className="size-4" />}
          label="On-time shipment"
          value={formatPercent(data.onTimeRate)}
          note="Target 95% · shipped POs only"
          trend={data.onTimeTrend.map((point) => point.rate)}
          tone={data.onTimeRate >= 95 ? "positive" : "warning"}
        />
        <AnalyticsKpi
          icon={<ShieldCheck className="size-4" />}
          label="Defect rate"
          value={formatPercent(data.defectRate, 2)}
          note="AQL 2.5 final inspections"
          tone="positive"
        />
        <AnalyticsKpi
          icon={<Factory className="size-4" />}
          label="Avg lead time"
          value={`${data.avgLeadTime}d`}
          note={`${formatCompactNumber(data.activeUnits)} pcs still open`}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[1.62fr_1fr]">
        <Card>
          <CardHeader className="pb-0">
            <div>
              <CardTitle>Factory output</CardTitle>
              <CardDescription>Shipped units per month · stacked by production unit</CardDescription>
            </div>
            <Badge tone="neutral" size="sm">
              6 months
            </Badge>
          </CardHeader>
          <CardContent className="pt-0.5">
            <FactoryOutputChart data={data.factoryOutput} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <div>
              <CardTitle>On-time trend</CardTitle>
              <CardDescription>Shipments against the 95% service target</CardDescription>
            </div>
            <Badge tone={data.onTimeRate >= 95 ? "green" : "amber"} size="sm">
              {formatPercent(data.onTimeRate)} now
            </Badge>
          </CardHeader>
          <CardContent className="pt-0.5">
            <OnTimeTrendChart data={data.onTimeTrend} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Capacity utilisation</CardTitle>
              <CardDescription>Committed units across active POs vs modeled capacity</CardDescription>
            </div>
            {overCapacity.length > 0 ? (
              <Badge tone="red" size="sm">
                {overCapacity.length} unit over
              </Badge>
            ) : (
              <Badge tone="green" size="sm">
                Within capacity
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {data.capacity.map((unit) => {
              const percent = (unit.committed / unit.capacity) * 100;
              return (
                <div key={unit.factory}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11.5px] font-medium">{unit.factory}</span>
                    <span
                      className={cn(
                        "numeric text-[10.5px]",
                        percent > 100 ? "text-danger" : percent > 90 ? "text-warning" : "text-muted",
                      )}
                    >
                      {Math.round(percent)}%
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          percent > 100
                            ? "bg-danger"
                            : percent > 90
                              ? "bg-warning"
                              : "bg-brand",
                        )}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                    <span className="numeric w-28 text-right text-[9.5px] text-faint">
                      {formatCompactNumber(unit.committed)} / {formatCompactNumber(unit.capacity)}
                    </span>
                  </div>
                </div>
              );
            })}
            <p className="flex items-start gap-1.5 border-t border-line pt-2.5 text-[10px] leading-4 text-muted">
              <CircleAlert className="mt-0.5 size-3 shrink-0 text-warning" />
              {tightest
                ? `${tightest.factory} is running at ${Math.round(
                    (tightest.committed / tightest.capacity) * 100,
                  )}% of modeled capacity. Consider rebalancing new POs to Unit 03.`
                : "Capacity is balanced across the four units."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Defect causes</CardTitle>
              <CardDescription>Share of inspected pieces · rolling QA sample</CardDescription>
            </div>
            <Badge tone="green" size="sm">
              {formatPercent(data.defectRate, 2)} total
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-0">
            {data.defectCauses.map((cause) => (
              <div key={cause.cause} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-[11px] text-muted">{cause.cause}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-sm bg-sunken">
                  <div
                    className="h-full rounded-sm bg-chart-2"
                    style={{ width: `${Math.max(3, (cause.rate / maxDefect) * 100)}%` }}
                  />
                </div>
                <span className="numeric w-12 text-right text-[10.5px] font-medium">
                  {formatPercent(cause.rate, 2)}
                </span>
              </div>
            ))}
            <div className="flex items-start gap-1.5 border-t border-line pt-2.5 text-[10px] leading-4 text-muted">
              <ClipboardCheck className="mt-0.5 size-3 shrink-0 text-positive" />
              Measurement remains the largest cause at {formatPercent(data.defectCauses[0]?.rate ?? 0, 2)}.
              Tightening the inline measurement audit is the highest-leverage fix.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-3">
        <CardHeader>
          <div>
            <CardTitle>Buyer scorecard</CardTitle>
            <CardDescription>
              All buyers by order value · on-time is shipped POs only · trend vs prior quarter
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/orders">
              Open order book
              <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[12px]">
              <thead>
                <tr className="border-y border-line bg-raised/60 text-[9.5px] uppercase tracking-[0.08em] text-faint">
                  <th className="px-4 py-2 font-medium">Buyer</th>
                  <th className="px-3 py-2 text-right font-medium">Orders</th>
                  <th className="px-3 py-2 text-right font-medium">Units</th>
                  <th className="px-3 py-2 text-right font-medium">Value</th>
                  <th className="px-3 py-2 font-medium">On-time</th>
                  <th className="px-3 py-2 text-right font-medium">At risk</th>
                  <th className="px-3 py-2 text-right font-medium">Defect</th>
                  <th className="px-3 py-2 text-right font-medium">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.buyers.map((buyer) => (
                  <tr key={buyer.name} className="transition-colors hover:bg-raised/60">
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{buyer.name}</p>
                      <p className="text-[9.5px] text-faint">{buyer.country}</p>
                    </td>
                    <td className="numeric px-3 py-2.5 text-right">
                      {formatNumber(buyer.orders)}
                    </td>
                    <td className="numeric px-3 py-2.5 text-right">
                      {formatCompactNumber(buyer.units)}
                    </td>
                    <td className="numeric px-3 py-2.5 text-right font-medium">
                      {formatMoney(buyer.value)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-sunken">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              buyer.onTimeRate >= 95
                                ? "bg-positive"
                                : buyer.onTimeRate >= 90
                                  ? "bg-warning"
                                  : "bg-danger",
                            )}
                            style={{ width: `${buyer.onTimeRate}%` }}
                          />
                        </div>
                        <span className="numeric text-[10.5px]">
                          {formatPercent(buyer.onTimeRate)}
                        </span>
                      </div>
                    </td>
                    <td
                      className={cn(
                        "numeric px-3 py-2.5 text-right",
                        buyer.atRisk > 0 && "text-warning",
                      )}
                    >
                      {formatNumber(buyer.atRisk)}
                    </td>
                    <td className="numeric px-3 py-2.5 text-right">
                      {formatPercent(buyer.defectRate)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 text-[10.5px] font-medium",
                          buyer.trend >= 0 ? "text-positive" : "text-danger",
                        )}
                      >
                        {buyer.trend >= 0 ? (
                          <ArrowUpRight className="size-3" />
                        ) : (
                          <ArrowDownRight className="size-3" />
                        )}
                        {buyer.trend >= 0 ? "+" : ""}
                        {buyer.trend.toFixed(1)} pts
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line bg-raised/40 px-4 py-2 text-[10px] text-faint">
            <span>{data.buyers.length} buyers</span>
            <span className="text-line-strong">·</span>
            <span>{formatMoneyCompact(data.buyers.reduce((total, buyer) => total + buyer.value, 0))} lifetime value</span>
            <span className="ml-auto">Synthetic QA and commercial data</span>
          </div>
        </CardContent>
      </Card>

      <section className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Insight
          icon={<TrendingUp className="size-4" />}
          title="Buyer concentration"
          body={`${topBuyer?.name ?? "—"} is the largest buyer at ${formatMoney(
            topBuyer?.value ?? 0,
          )}, or ${Math.round(
            ((topBuyer?.value ?? 0) /
              Math.max(
                1,
                data.buyers.reduce((total, buyer) => total + buyer.value, 0),
              )) *
              100,
          )}% of book value.`}
        />
        <Insight
          icon={<Clock3 className="size-4" />}
          title="On-time pressure"
          body={
            weakestOnTime
              ? `${weakestOnTime.name} is the weakest shipper at ${formatPercent(
                  weakestOnTime.onTimeRate,
                )}, with ${formatNumber(weakestOnTime.atRisk)} open POs at risk.`
              : "No shipped POs to score yet."
          }
        />
        <Insight
          icon={<Factory className="size-4" />}
          title="Capacity watch"
          body={
            overCapacity.length > 0
              ? `${overCapacity.map((unit) => unit.factory).join(", ")} ${
                  overCapacity.length === 1 ? "is" : "are"
                } above modeled capacity. Rebalance new orders before confirming.`
              : "All four units remain inside modeled capacity."
          }
        />
      </section>
    </>
  );
}

function AnalyticsKpi({
  icon,
  label,
  value,
  note,
  trend,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  trend?: number[];
  tone?: "positive" | "warning";
}) {
  return (
    <Card className="px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted">{label}</p>
        <span className="text-muted">{icon}</span>
      </div>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <p
          className={cn(
            "numeric text-[24px] font-semibold leading-none tracking-[-0.03em]",
            tone === "warning" && "text-warning",
          )}
        >
          {value}
        </p>
        {trend ? (
          <Sparkline
            data={trend}
            stroke={tone === "warning" ? "var(--color-chart-2)" : "var(--color-brand)"}
            className="h-6 w-16 opacity-80"
          />
        ) : null}
      </div>
      <p className="mt-2 truncate text-[10.5px] text-faint">{note}</p>
    </Card>
  );
}

function Insight({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-card border border-dashed border-line-strong/80 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium">
        <span className="text-muted">{icon}</span>
        {title}
      </div>
      <p className="mt-1 text-[10.5px] leading-4 text-muted">{body}</p>
    </div>
  );
}
