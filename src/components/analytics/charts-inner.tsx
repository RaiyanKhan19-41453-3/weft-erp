"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FACTORIES } from "@/lib/constants";
import type { AnalyticsData } from "@/lib/data/orders";
import { formatCompactNumber, formatNumber, formatPercent } from "@/lib/utils";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-3)",
  "var(--color-chart-2)",
  "var(--color-chart-5)",
];

const tooltipStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-line)",
  borderRadius: 8,
  boxShadow: "var(--shadow-pop)",
  fontSize: 11,
  padding: "7px 9px",
};

export function FactoryOutputChart({ data }: { data: AnalyticsData["factoryOutput"] }) {
  return (
    <div>
      <div
        className="h-[240px] w-full"
        role="img"
        aria-label="Shipped units by factory and month"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -10, bottom: 0 }} barCategoryGap="24%">
            <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="2 4" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
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
              labelStyle={{ color: "var(--color-muted)", fontSize: 10, marginBottom: 4 }}
              itemStyle={{ color: "var(--color-ink)", fontSize: 11, padding: 0 }}
              cursor={{ fill: "var(--color-raised)", opacity: 0.7 }}
              formatter={(value, name) => [`${formatNumber(Number(value))} pcs`, name]}
            />
            {FACTORIES.map((factory, index) => (
              <Bar
                key={factory.short}
                dataKey={factory.short}
                name={factory.short}
                stackId="output"
                fill={COLORS[index]}
                radius={index === FACTORIES.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                maxBarSize={34}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {FACTORIES.map((factory, index) => (
          <li key={factory.short} className="flex items-center gap-1.5 text-[10.5px] text-muted">
            <span
              aria-hidden
              className="size-1.5 rounded-full"
              style={{ background: COLORS[index] }}
            />
            {factory.short}
            <span className="text-faint">· {factory.lines.length} lines</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OnTimeTrendChart({ data }: { data: AnalyticsData["onTimeTrend"] }) {
  return (
    <div className="h-[240px] w-full" role="img" aria-label="On-time shipment rate by month">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="2 4" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-faint)", fontSize: 10 }}
            dy={8}
          />
          <YAxis
            domain={[80, 100]}
            ticks={[80, 85, 90, 95, 100]}
            tickLine={false}
            axisLine={false}
            width={42}
            tick={{ fill: "var(--color-faint)", fontSize: 10 }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "var(--color-muted)", fontSize: 10, marginBottom: 4 }}
            itemStyle={{ color: "var(--color-ink)", fontSize: 11, padding: 0 }}
            cursor={{ stroke: "var(--color-line-strong)", strokeDasharray: "3 3" }}
            formatter={(value) => [formatPercent(Number(value)), "On-time"]}
          />
          <ReferenceLine
            y={95}
            stroke="var(--color-chart-2)"
            strokeDasharray="4 4"
            strokeWidth={1.2}
            label={{
              value: "Target 95%",
              position: "insideTopRight",
              fill: "var(--color-faint)",
              fontSize: 9,
            }}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="var(--color-chart-1)"
            strokeWidth={2}
            dot={{ r: 2.5, fill: "var(--color-chart-1)", strokeWidth: 0 }}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
