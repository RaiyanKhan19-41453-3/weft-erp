"use client";

import type { Table } from "@tanstack/react-table";
import {
  Columns3,
  Download,
  FilterX,
  Rows3,
  Rows4,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";
import { ORDER_STATUSES, STATUS_META, type Order, type OrderStatus } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/misc";
import { useTablePrefs } from "@/lib/stores/table-prefs";
import { cn, formatNumber } from "@/lib/utils";

type ToolbarProps = {
  table: Table<Order>;
  search: string;
  onSearchChange: (value: string) => void;
  status: OrderStatus | "all";
  onStatusChange: (value: OrderStatus | "all") => void;
  buyer: string;
  onBuyerChange: (value: string) => void;
  riskOnly: boolean;
  onRiskChange: (value: boolean) => void;
  buyers: readonly string[];
  riskCount: number;
  resultCount: number;
  totalCount: number;
  isFiltering: boolean;
  hasFilters: boolean;
  onClear: () => void;
  onExport: () => void;
};

export function OrdersToolbar({
  table,
  search,
  onSearchChange,
  status,
  onStatusChange,
  buyer,
  onBuyerChange,
  riskOnly,
  onRiskChange,
  buyers,
  riskCount,
  resultCount,
  totalCount,
  isFiltering,
  hasFilters,
  onClear,
  onExport,
}: ToolbarProps) {
  const density = useTablePrefs((state) => state.density);
  const toggleDensity = useTablePrefs((state) => state.toggleDensity);

  return (
    <div className="border-b border-line px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[190px] flex-1 sm:max-w-[260px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search PO, buyer, style…"
            aria-label="Search purchase orders"
            className="h-8 pl-8 pr-8"
          />
          <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
            {isFiltering ? <Spinner className="size-3 text-brand" /> : null}
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="inline-flex size-5 items-center justify-center rounded text-faint hover:bg-sunken hover:text-ink"
                aria-label="Clear search"
              >
                <X className="size-3" />
              </button>
            ) : null}
          </div>
        </div>

        <Select
          value={status}
          onValueChange={(value) => onStatusChange(value as OrderStatus | "all")}
        >
          <SelectTrigger className="w-[132px]" aria-label="Filter by stage">
            <SelectValue placeholder="All stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {ORDER_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {STATUS_META[value].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={buyer} onValueChange={onBuyerChange}>
          <SelectTrigger className="w-[142px]" aria-label="Filter by buyer">
            <SelectValue placeholder="All buyers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All buyers</SelectItem>
            {buyers.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant={riskOnly ? "primary" : "outline"}
          size="default"
          onClick={() => onRiskChange(!riskOnly)}
          aria-pressed={riskOnly}
          className={cn(riskOnly && "border-ink")}
        >
          <TriangleAlert className={cn("size-3.5", riskOnly ? "text-amber-300" : "text-danger")} />
          At risk
          <span
            className={cn(
              "numeric ml-0.5 rounded-full px-1.5 py-0 text-[9.5px]",
              riskOnly ? "bg-white/15" : "bg-danger/10 text-danger",
            )}
          >
            {formatNumber(riskCount)}
          </span>
        </Button>

        {hasFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            <FilterX />
            Clear
          </Button>
        ) : null}

        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden text-[10.5px] text-faint lg:block" aria-live="polite">
            {formatNumber(resultCount)} of {formatNumber(totalCount)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleDensity}
            aria-label={density === "compact" ? "Use comfortable rows" : "Use compact rows"}
            title={density === "compact" ? "Comfortable rows" : "Compact rows"}
          >
            {density === "compact" ? <Rows4 className="size-4" /> : <Rows3 className="size-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="default">
                <Columns3 />
                <span className="hidden sm:inline">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.columnDef.meta?.label ?? column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button type="button" variant="outline" size="default" onClick={onExport}>
            <Download />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
