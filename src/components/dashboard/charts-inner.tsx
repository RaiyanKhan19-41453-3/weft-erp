"use client";

import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { STATUS_META } from "@/lib/constants";
import type { StatusSlice, ThroughputPoint } from "@/lib/data/orders";
import { formatCompactNumber, formatNumber, formatPercent, percentOf } from "@/lib/utils";

const tooltipStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-line)",
  borderRadius: 8,
  boxShadow: "var(--shadow-pop)",
  fontSize: 11,
  padding: "7px 9px",
};

const tooltipLabelStyle = {
  color: "var(--color-muted)",
  fontSize: 10,
  marginBottom: 4,
};

const tooltipItemStyle = {
  color: "var(--color-ink)",
  fontSize: 11,
  padding: 0,
};

export function ThroughputChart({ data }: { data: ThroughputPoint[] }) {
  return (
    <div
      className="h-[220px] w-full"
      role="img"
      aria-label="Shipped units per week compared with target"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="throughput-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.18} />
              <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--color-line)"
            strokeDasharray="2 4"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={26}
            tick={{ fill: "var(--color-faint)", fontSize: 10 }}
            dy={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={42}
            tick={{ fill: "var(--color-faint)", fontSize: 10 }}
            tickFormatter={(value) => formatCompactNumber(Number(value))}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
            wrapperStyle={{ outline: "none" }}
            cursor={{ stroke: "var(--color-line-strong)", strokeDasharray: "3 3" }}
            formatter={(value) => `${formatNumber(Number(value))} pcs`}
          />
          <Area
            type="monotone"
            dataKey="actual"
            name="Shipped units"
            stroke="var(--color-chart-1)"
            strokeWidth={1.9}
            fill="url(#throughput-fill)"
            activeDot={{ r: 3, strokeWidth: 0, fill: "var(--color-chart-1)" }}
          />
          <Line
            type="monotone"
            dataKey="target"
            name="Weekly target"
            stroke="var(--color-chart-2)"
            strokeWidth={1.2}
            strokeDasharray="4 4"
            dot={false}
            activeDot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PipelineChart({
  data,
  total,
}: {
  data: StatusSlice[];
  total: number;
}) {
  const slices = data
    .filter((slice) => slice.count > 0)
    .map((slice) => ({
      name: STATUS_META[slice.status].label,
      value: slice.count,
      color: STATUS_META[slice.status].chartVar,
      status: slice.status,
    }));

  return (
    <div>
      <div className="relative h-[190px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={54}
              outerRadius={78}
              paddingAngle={2}
              stroke="var(--color-surface)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
              wrapperStyle={{ outline: "none" }}
              formatter={(value, name) => [
                `${formatNumber(Number(value))} POs · ${formatPercent(
                  percentOf(Number(value), total),
                  0,
                )}`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="numeric text-[22px] font-semibold leading-none tracking-[-0.03em]">
            {formatCompactNumber(total)}
          </span>
          <span className="mt-1 text-[9.5px] uppercase tracking-[0.1em] text-faint">
            total POs
          </span>
        </div>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {slices.map((slice) => (
          <li key={slice.name} className="flex items-center gap-1.5 text-[10.5px]">
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: slice.color }}
            />
            <span className="truncate text-muted">{slice.name}</span>
            <span className="numeric ml-auto text-ink">{formatNumber(slice.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
