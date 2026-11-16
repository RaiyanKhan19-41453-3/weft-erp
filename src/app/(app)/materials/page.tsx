import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CalendarClock,
  CircleAlert,
  Factory,
  PackageOpen,
  Truck,
} from "lucide-react";
import { getMaterials } from "@/lib/data/server";
import { buildMaterialsSummary, type Material } from "@/lib/data/materials";
import { PageHeader } from "@/components/page-header";
import { MaterialsTable } from "@/components/materials/materials-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  cn,
  daysFromDemoToday,
  formatDateShort,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
} from "@/lib/utils";

export const metadata: Metadata = {
  title: "Materials",
  description:
    "Fabric, trims and packaging inventory with coverage weeks, reorder status and inbound replenishment planning.",
};

const STATUS_LABEL = {
  low: "Below reorder",
  watch: "On watch",
  ok: "Healthy",
} as const;

function coverageWeeks(material: Material) {
  return material.weeklyUse ? material.onHand / material.weeklyUse : Number.POSITIVE_INFINITY;
}

function suggestedBuy(material: Material) {
  const target = material.weeklyUse * 8;
  const raw = Math.max(0, target - material.onHand - material.incoming);
  const lot = material.unit === "pcs" ? 500 : 100;
  return Math.ceil(raw / lot) * lot;
}

export default async function MaterialsPage() {
  const materials = await getMaterials();
  const summary = buildMaterialsSummary(materials);
  const attention = materials
    .filter((material) => material.status !== "ok")
    .sort((a, b) => coverageWeeks(a) - coverageWeeks(b));
  const earliest = attention[0];
  const inbound = materials
    .filter((material) => material.incoming > 0)
    .sort(
      (a, b) => new Date(a.incomingDate).getTime() - new Date(b.incomingDate).getTime(),
    );
  const plan = [...attention]
    .sort((a, b) => coverageWeeks(a) - coverageWeeks(b))
    .slice(0, 5)
    .map((material) => ({
      material,
      buy: suggestedBuy(material),
      stockoutDays: Math.floor(coverageWeeks(material) * 7),
    }));

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <span>Inventory</span>
            <span className="text-line-strong">/</span>
            <span className="normal-case tracking-normal text-faint">
              Fabric, trims &amp; packaging · 16 Nov 2026
            </span>
          </>
        }
        title="Materials"
        description="Coverage, reorder risk and inbound supply across 12 material SKUs. Coverage is calculated against current weekly consumption; suggested buys cover eight weeks after inbound."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/orders?status=in-production">
                <Factory />
                Floor demand
              </Link>
            </Button>
            <Button asChild variant="primary">
              <Link href="/orders/new">
                <PackageOpen />
                Raise a PO
              </Link>
            </Button>
          </>
        }
      />

      {earliest ? (
        <div className="mb-3 flex flex-col gap-3 rounded-card border border-amber-300/70 bg-amber-50/70 px-4 py-3 sm:flex-row sm:items-center dark:border-amber-500/20 dark:bg-amber-500/[0.07]">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <CircleAlert className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-medium text-amber-900 dark:text-amber-200">
              {summary.low} SKUs are below their reorder point
            </p>
            <p className="text-[11px] text-amber-900 dark:text-amber-200/90">
              {earliest.name} has {coverageWeeks(earliest).toFixed(1)} weeks of cover left —
              roughly {Math.floor(coverageWeeks(earliest) * 7)} days at current consumption.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-amber-300 bg-amber-100/50 text-amber-900 hover:bg-amber-100 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/15"
          >
            <a href="#materials-table">
              View materials
              <ArrowRight />
            </a>
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric
          icon={<Boxes className="size-4" />}
          label="SKUs tracked"
          value={formatNumber(summary.total)}
          note={`${materials.filter((item) => item.category === "Fabric").length} fabrics · ${
            materials.filter((item) => item.category === "Trims").length
          } trims`}
        />
        <Metric
          icon={<CircleAlert className="size-4" />}
          label="Below reorder"
          value={formatNumber(summary.low)}
          note="Raise a requisition this week"
          tone="danger"
        />
        <Metric
          icon={<CalendarClock className="size-4" />}
          label="On watch"
          value={formatNumber(summary.watch)}
          note="Within 20% of reorder point"
          tone="warning"
        />
        <Metric
          icon={<Truck className="size-4" />}
          label="Stock at cost"
          value={formatMoney(summary.stockValue)}
          note={`${formatMoneyCompact(materials.reduce((total, material) => total + material.incoming * material.unitCost, 0))} inbound on order`}
        />
        <Metric
          icon={<Factory className="size-4" />}
          label="Avg lead time"
          value={`${summary.avgLeadTime}d`}
          note={`${summary.inboundUnits} inbound shipments`}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[1.62fr_1fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Suggested replenishment</CardTitle>
              <CardDescription>
                Eight weeks of cover after incoming stock · rounded to a practical lot size
              </CardDescription>
            </div>
            <Badge tone="amber" size="sm">
              {plan.length} to review
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-[11.5px]">
                <thead>
                  <tr className="border-y border-line bg-raised/60 text-[9px] uppercase tracking-[0.08em] text-faint">
                    <th className="px-4 py-2 font-medium">Material</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 text-right font-medium">Cover</th>
                    <th className="px-3 py-2 font-medium">Inbound</th>
                    <th className="px-3 py-2 text-right font-medium">Suggested buy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {plan.map(({ material, buy, stockoutDays }) => (
                    <tr key={material.sku} className="transition-colors hover:bg-raised/60">
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{material.name}</p>
                        <p className="font-mono text-[9px] text-faint">{material.sku}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          tone={material.status === "low" ? "red" : "amber"}
                          size="sm"
                        >
                          {STATUS_LABEL[material.status]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <p
                          className={cn(
                            "numeric font-medium",
                            coverageWeeks(material) <= 3 ? "text-danger" : "text-warning",
                          )}
                        >
                          {coverageWeeks(material).toFixed(1)} wk
                        </p>
                        <p className="text-[9.5px] text-faint">
                          {stockoutDays}d to stockout
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        {material.incoming > 0 ? (
                          <>
                            <p className="numeric">
                              +{formatNumber(material.incoming)} {material.unit}
                            </p>
                            <p className="text-[9.5px] text-faint">
                              {formatDateShort(material.incomingDate)}
                            </p>
                          </>
                        ) : (
                          <span className="text-[10px] text-faint">None scheduled</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {buy > 0 ? (
                          <>
                            <p className="numeric font-medium text-brand">
                              {formatNumber(buy)} {material.unit}
                            </p>
                            <p className="text-[9.5px] text-faint">
                              {formatMoney(buy * material.unitCost)}
                            </p>
                          </>
                        ) : (
                          <span className="text-[10px] text-muted">Inbound covers target</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-line bg-raised/30 px-4 py-2 text-[9.5px] leading-4 text-faint">
              Demo formula only: weekly use × 8 − on hand − inbound, rounded up to 100 kg/m or 500
              pcs. A production ERP would also model safety stock, MOQs and open POs.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Inbound calendar</CardTitle>
              <CardDescription>Confirmed supplier deliveries</CardDescription>
            </div>
            <Truck className="size-4 text-muted" />
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {inbound.map((material) => {
              const days = daysFromDemoToday(material.incomingDate);
              return (
                <div
                  key={material.sku}
                  className="flex items-start gap-2.5 rounded-md border border-line bg-raised/40 px-2.5 py-2"
                >
                  <span className="mt-0.5 flex w-9 shrink-0 flex-col items-center rounded bg-surface px-1 py-1 ring-1 ring-line">
                    <span className="text-[8px] uppercase tracking-[0.08em] text-faint">
                      {new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(
                        new Date(material.incomingDate),
                      )}
                    </span>
                    <span className="numeric text-[13px] font-semibold leading-none">
                      {new Intl.DateTimeFormat("en-GB", { day: "2-digit", timeZone: "UTC" }).format(
                        new Date(material.incomingDate),
                      )}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-medium">{material.name}</span>
                    <span className="block text-[9.5px] text-faint">
                      {material.supplier} · {formatNumber(material.incoming)} {material.unit}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[9px] font-medium",
                      days <= 7 ? "text-positive" : "text-muted",
                    )}
                  >
                    {days === 0 ? "today" : days > 0 ? `+${days}d` : `${Math.abs(days)}d late`}
                  </span>
                </div>
              );
            })}
            <div className="mt-1 flex items-center justify-between border-t border-line pt-2.5 text-[10px] text-faint">
              <span>{inbound.length} scheduled deliveries</span>
              <Link href="/orders?status=confirmed" className="text-brand hover:underline">
                Open demand
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div id="materials-table" className="mt-3 scroll-mt-20">
        <MaterialsTable materials={materials} />
      </div>
    </>
  );
}

function Metric({
  icon,
  label,
  value,
  note,
  tone,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  tone?: "danger" | "warning";
  className?: string;
}) {
  return (
    <Card className={cn("px-4 py-3.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted">{label}</p>
        <span
          className={cn(
            "text-muted",
            tone === "danger" && "text-danger",
            tone === "warning" && "text-warning",
          )}
        >
          {icon}
        </span>
      </div>
      <p
        className={cn(
          "numeric mt-1.5 text-[22px] font-semibold leading-none tracking-[-0.03em]",
          tone === "danger" && "text-danger",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </p>
      <p className="mt-2 truncate text-[10px] text-faint">{note}</p>
    </Card>
  );
}
