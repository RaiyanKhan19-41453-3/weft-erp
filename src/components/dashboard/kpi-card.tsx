import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Kpi } from "@/lib/data/orders";
import { formatMoney, formatNumber, formatPercent, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/ui/sparkline";

function formatKpi(kpi: Kpi) {
  if (kpi.kind === "money") return formatMoney(kpi.value);
  if (kpi.kind === "percent") return formatPercent(kpi.value);
  return formatNumber(kpi.value);
}

function trendFor(kpi: Kpi) {
  const first = kpi.trend[0] ?? 0;
  const last = kpi.trend[kpi.trend.length - 1] ?? 0;
  if (!first) return 0;
  return ((last - first) / Math.abs(first)) * 100;
}

export function KpiCard({ kpi, index }: { kpi: Kpi; index: number }) {
  const trend = trendFor(kpi);
  const positive = trend >= 0;
  const label =
    kpi.kind === "percent"
      ? `${Math.abs(trend).toFixed(1)} pts`
      : `${Math.abs(trend).toFixed(1)}%`;

  return (
    <Card className="relative overflow-hidden px-4 py-3.5">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent"
        style={{ opacity: 1 - index * 0.16 }}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="pt-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted">
          {kpi.label}
        </p>
        <Sparkline
          data={kpi.trend}
          stroke={index === 2 ? "var(--color-chart-2)" : "var(--color-brand)"}
          className="h-6 w-16 opacity-80"
        />
      </div>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <p className="numeric text-[25px] font-semibold leading-none tracking-[-0.03em] text-ink">
          {formatKpi(kpi)}
        </p>
        <span
          className={cn(
            "mb-0.5 inline-flex items-center gap-0.5 text-[10.5px] font-medium",
            positive ? "text-positive" : "text-danger",
          )}
          title={`${positive ? "Up" : "Down"} ${label} across the trend window`}
        >
          {positive ? (
            <ArrowUpRight className="size-3" />
          ) : (
            <ArrowDownRight className="size-3" />
          )}
          {label}
        </span>
      </div>
      <p className="mt-2 truncate text-[10.5px] text-faint">{kpi.note}</p>
    </Card>
  );
}

export function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi, index) => (
        <KpiCard key={kpi.key} kpi={kpi} index={index} />
      ))}
    </div>
  );
}
