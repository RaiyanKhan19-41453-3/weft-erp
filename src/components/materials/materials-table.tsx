"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Download, Search, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { type Material, type MaterialStatus } from "@/lib/data/materials";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn, downloadCsv, formatNumber, toCsv } from "@/lib/utils";

const STATUS_META: Record<
  MaterialStatus,
  { label: string; tone: "red" | "amber" | "green"; bar: string }
> = {
  low: { label: "Below reorder", tone: "red", bar: "bg-danger" },
  watch: { label: "On watch", tone: "amber", bar: "bg-warning" },
  ok: { label: "Healthy", tone: "green", bar: "bg-positive" },
};

const CATEGORIES = ["All", "Fabric", "Trims", "Packaging"] as const;
type Category = (typeof CATEGORIES)[number];

type SortKey = "status" | "name" | "onHand" | "coverage" | "leadTime";
type SortState = { key: SortKey; desc: boolean };

const STATUS_RANK: Record<MaterialStatus, number> = { low: 0, watch: 1, ok: 2 };

function coverageWeeks(material: Material) {
  if (!material.weeklyUse) return Number.POSITIVE_INFINITY;
  return material.onHand / material.weeklyUse;
}

function matches(material: Material, query: string) {
  if (!query) return true;
  const haystack = [
    material.sku,
    material.name,
    material.category,
    material.composition,
    material.colour,
    material.supplier,
  ]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

export function MaterialsTable({ materials }: { materials: Material[] }) {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<Category>("All");
  const [lowOnly, setLowOnly] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortState>({ key: "status", desc: false });
  const deferredSearch = React.useDeferredValue(search);

  const rows = React.useMemo(() => {
    const filtered = materials.filter(
      (material) =>
        (category === "All" || material.category === category) &&
        (!lowOnly || material.status !== "ok") &&
        matches(material, deferredSearch.trim()),
    );
    return filtered.sort((a, b) => {
      let result = 0;
      switch (sorting.key) {
        case "status":
          result =
            STATUS_RANK[a.status] - STATUS_RANK[b.status] || coverageWeeks(a) - coverageWeeks(b);
          break;
        case "name":
          result = a.name.localeCompare(b.name);
          break;
        case "onHand":
          result = a.onHand - b.onHand;
          break;
        case "coverage":
          result = coverageWeeks(a) - coverageWeeks(b);
          break;
        case "leadTime":
          result = a.leadTimeDays - b.leadTimeDays;
          break;
      }
      return sorting.desc ? -result : result;
    });
  }, [materials, category, lowOnly, deferredSearch, sorting]);

  const hasFilters = search.trim() !== "" || category !== "All" || lowOnly;

  const toggleSort = (key: SortKey) => {
    setSorting((current) =>
      current.key === key ? { key, desc: !current.desc } : { key, desc: false },
    );
  };

  const exportRows = () => {
    if (rows.length === 0) return;
    const content = toCsv(
      [
        "SKU",
        "Name",
        "Category",
        "Composition",
        "Colour",
        "Supplier",
        "On hand",
        "Unit",
        "Reorder point",
        "Incoming",
        "Incoming date",
        "Lead time days",
        "Weekly use",
        "Coverage weeks",
        "Unit cost USD",
        "Stock value USD",
        "Status",
      ],
      rows.map((material) => [
        material.sku,
        material.name,
        material.category,
        material.composition,
        material.colour,
        material.supplier,
        material.onHand,
        material.unit,
        material.reorderPoint,
        material.incoming,
        material.incomingDate === "—" ? "" : material.incomingDate.slice(0, 10),
        material.leadTimeDays,
        material.weeklyUse,
        coverageWeeks(material).toFixed(1),
        material.unitCost.toFixed(2),
        (material.onHand * material.unitCost).toFixed(2),
        STATUS_META[material.status].label,
      ]),
    );
    downloadCsv("weft-materials-2026-11-16.csv", content);
    toast.success(`${formatNumber(rows.length)} material SKUs exported`);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setLowOnly(false);
  };

  return (
    <div className="rounded-card border border-line bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
        <div className="relative min-w-[190px] flex-1 sm:max-w-[260px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search SKU, fabric or supplier…"
            className="pl-8 pr-8"
            aria-label="Search materials"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-0.5 rounded-control border border-line bg-raised/60 p-0.5">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={cn(
                "h-6 rounded-[6px] px-2 text-[10.5px] font-medium transition-colors",
                category === item
                  ? "bg-surface text-ink shadow-xs"
                  : "text-muted hover:text-ink",
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-control px-1.5 text-[11px] text-muted hover:text-ink">
          <Checkbox
            checked={lowOnly}
            onCheckedChange={(checked) => setLowOnly(checked === true)}
            aria-label="Only show materials below reorder or on watch"
          />
          Needs attention
        </label>

        <div className="ml-auto flex items-center gap-2">
          <span className="numeric hidden text-[10px] text-faint sm:inline">
            {rows.length} / {materials.length} SKUs
          </span>
          <Button variant="outline" size="sm" onClick={exportRows} disabled={rows.length === 0}>
            <Download />
            Export
          </Button>
        </div>
      </div>

      {hasFilters ? (
        <div className="flex items-center gap-2 border-b border-line bg-raised/40 px-3 py-1.5 text-[10.5px] text-muted">
          <TriangleAlert className="size-3 text-warning" />
          Filtered view · {rows.length} matching SKUs
          <button
            type="button"
            onClick={clearFilters}
            className="ml-auto inline-flex items-center gap-1 text-[10px] hover:text-ink"
          >
            <X className="size-3" />
            Clear filters
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-[12px]">
          <thead>
            <tr className="border-b border-line bg-raised/60 text-[9.5px] uppercase tracking-[0.08em] text-faint">
              <SortHeader
                label="Material"
                sortKey="name"
                sorting={sorting}
                onSort={toggleSort}
                className="pl-3"
              />
              <th className="px-3 py-2 font-medium">Supplier</th>
              <SortHeader
                label="On hand"
                sortKey="onHand"
                sorting={sorting}
                onSort={toggleSort}
                align="right"
              />
              <SortHeader
                label="Coverage"
                sortKey="coverage"
                sorting={sorting}
                onSort={toggleSort}
              />
              <th className="px-3 py-2 text-right font-medium">Inbound</th>
              <SortHeader
                label="Lead time"
                sortKey="leadTime"
                sorting={sorting}
                onSort={toggleSort}
                align="right"
              />
              <th className="px-3 py-2 text-right font-medium">Value</th>
              <SortHeader
                label="Status"
                sortKey="status"
                sorting={sorting}
                onSort={toggleSort}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((material) => {
              const weeks = coverageWeeks(material);
              const meta = STATUS_META[material.status];
              const ratio = Math.min(
                100,
                (material.onHand / (material.reorderPoint * 1.4)) * 100,
              );
              return (
                <tr key={material.sku} className="transition-colors hover:bg-raised/60">
                  <td className="pl-3 pr-3 py-2.5">
                    <p className="font-medium">{material.name}</p>
                    <p className="font-mono text-[9.5px] text-faint">{material.sku}</p>
                    <p className="mt-0.5 text-[9.5px] text-muted">
                      {material.composition} · {material.colour}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-[11.5px]">{material.supplier}</p>
                    <p className="text-[9.5px] text-faint">{material.category}</p>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <p className="numeric text-[11.5px] font-medium">
                      {formatNumber(material.onHand)} {material.unit}
                    </p>
                    <p className="numeric text-[9.5px] text-faint">
                      reorder {formatNumber(material.reorderPoint)}
                    </p>
                    <div className="mt-1 ml-auto h-1 w-20 overflow-hidden rounded-full bg-sunken">
                      <div
                        className={cn("h-full rounded-full", meta.bar)}
                        style={{ width: `${Math.max(4, ratio)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <p
                      className={cn(
                        "numeric text-[11.5px] font-medium",
                        weeks <= 3 ? "text-danger" : weeks <= 5 ? "text-warning" : "text-ink",
                      )}
                    >
                      {weeks.toFixed(1)} weeks
                    </p>
                    <p className="numeric text-[9.5px] text-faint">
                      {formatNumber(material.weeklyUse)} {material.unit}/wk
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {material.incoming > 0 ? (
                      <>
                        <p className="numeric text-[11.5px] font-medium text-positive">
                          +{formatNumber(material.incoming)}
                        </p>
                        <p className="text-[9.5px] text-faint">
                          {material.incomingDate === "—"
                            ? "—"
                            : new Intl.DateTimeFormat("en-GB", {
                                day: "2-digit",
                                month: "short",
                                timeZone: "UTC",
                              }).format(new Date(material.incomingDate))}
                        </p>
                      </>
                    ) : (
                      <span className="text-[10.5px] text-faint">—</span>
                    )}
                  </td>
                  <td className="numeric px-3 py-2.5 text-right text-[11.5px]">
                    {material.leadTimeDays}d
                  </td>
                  <td className="numeric px-3 py-2.5 text-right text-[11.5px]">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(material.onHand * material.unitCost)}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={meta.tone} size="sm">
                      {meta.label}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <p className="text-[12.5px] font-medium">No materials match this view</p>
          <p className="mt-1 text-[11px] text-muted">
            Try a different SKU, supplier or category.
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line bg-raised/40 px-3 py-2 text-[10px] text-faint">
        <span className="numeric">
          {rows.length} of {materials.length} SKUs
        </span>
        <span className="text-line-strong">·</span>
        <span>Coverage = on hand ÷ weekly use</span>
        <span className="ml-auto">
          Data is synthetic · snapshot <span className="text-muted">16 Nov 2026</span>
        </span>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  sorting,
  onSort,
  align,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sorting: SortState;
  onSort: (key: SortKey) => void;
  align?: "right";
  className?: string;
}) {
  const active = sorting.key === sortKey;
  return (
    <th
      className={cn("px-3 py-2 font-medium", align === "right" && "text-right", className)}
      aria-sort={active ? (sorting.desc ? "descending" : "ascending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-ink",
          align === "right" && "justify-end",
          active && "text-ink",
        )}
      >
        {label}
        {active ? (
          sorting.desc ? (
            <ArrowDown className="size-3" />
          ) : (
            <ArrowUp className="size-3" />
          )
        ) : (
          <ChevronsUpDown className="size-3 opacity-40" />
        )}
      </button>
    </th>
  );
}
