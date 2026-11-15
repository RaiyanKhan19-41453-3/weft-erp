"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpRight,
  ChevronRight,
  TriangleAlert,
} from "lucide-react";
import { ORDER_STATUSES, type Order } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { LocalBadge, OrderStatusBadge } from "@/components/orders/status-badge";
import {
  cn,
  formatDateShort,
  formatDueLabel,
  formatMoney,
  formatNumber,
  isOverdue,
} from "@/lib/utils";

const statusRank = new Map(ORDER_STATUSES.map((status, index) => [status, index]));
const dueStatuses = new Set(["confirmed", "in-production", "qc", "ready"]);

export const orderColumns: ColumnDef<Order>[] = [
  {
    id: "select",
    size: 36,
    enableSorting: false,
    enableHiding: false,
    meta: { label: "Select", width: "36px", minWidth: 36 },
    header: ({ table }) => (
      <div className="flex h-full items-center pl-3.5">
        <Checkbox
          checked={
            table.getIsAllRowsSelected()
              ? true
              : table.getIsSomeRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
          aria-label="Select all purchase orders"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div
        className="flex h-full items-center pl-3.5"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Select ${row.original.id}`}
        />
      </div>
    ),
  },
  {
    accessorKey: "id",
    id: "id",
    enableHiding: false,
    meta: { label: "PO", width: "minmax(128px, 1.05fr)", minWidth: 128 },
    header: "PO",
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div className="flex min-w-0 items-center gap-1.5">
          <Link
            href={`/orders/${order.id}`}
            onClick={(event) => event.stopPropagation()}
            className="truncate font-mono text-[11.5px] font-medium text-ink underline-offset-2 hover:text-brand hover:underline"
          >
            {order.id}
          </Link>
          {order.atRisk ? (
            <TriangleAlert
              className="size-3 shrink-0 text-danger"
              aria-label="At risk"
            />
          ) : null}
          {order.isLocal ? <LocalBadge /> : null}
        </div>
      );
    },
  },
  {
    accessorKey: "buyer",
    id: "buyer",
    meta: { label: "Buyer", width: "minmax(150px, 1.25fr)", minWidth: 150 },
    header: "Buyer",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-[12px] font-medium text-ink">{row.original.buyer}</p>
        <p className="truncate text-[10px] text-faint">
          {row.original.buyerCountry} · {row.original.destination}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "style",
    id: "style",
    meta: { label: "Style", width: "minmax(158px, 1.35fr)", minWidth: 158 },
    header: "Style",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-[12px] text-ink">{row.original.style}</p>
        <p className="truncate font-mono text-[10px] text-faint">{row.original.styleCode}</p>
      </div>
    ),
  },
  {
    accessorKey: "quantity",
    id: "quantity",
    meta: {
      label: "Qty",
      width: "minmax(78px, 0.65fr)",
      minWidth: 78,
      align: "right",
    },
    header: "Qty",
    cell: ({ row }) => (
      <span className="numeric tabular-nums text-[11.5px] text-ink">
        {formatNumber(row.original.quantity)}
      </span>
    ),
  },
  {
    accessorKey: "value",
    id: "value",
    meta: {
      label: "Value",
      width: "minmax(94px, 0.75fr)",
      minWidth: 94,
      align: "right",
    },
    header: "Value",
    cell: ({ row }) => (
      <span className="numeric text-[11.5px] text-ink">{formatMoney(row.original.value)}</span>
    ),
  },
  {
    accessorKey: "status",
    id: "status",
    meta: { label: "Stage", width: "minmax(116px, 0.9fr)", minWidth: 116 },
    header: "Stage",
    sortingFn: (a, b) =>
      (statusRank.get(a.original.status) ?? 99) - (statusRank.get(b.original.status) ?? 99),
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} short />,
  },
  {
    accessorKey: "progress",
    id: "progress",
    meta: { label: "Progress", width: "minmax(126px, 1.05fr)", minWidth: 126 },
    header: "Progress",
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div className="flex items-center gap-2">
          <div className="h-1 w-14 shrink-0 overflow-hidden rounded-full bg-sunken">
            <div
              className={cn(
                "h-full rounded-full",
                order.status === "cancelled"
                  ? "bg-faint"
                  : order.atRisk
                    ? "bg-danger"
                    : "bg-brand",
              )}
              style={{ width: `${Math.max(order.progress > 0 ? 4 : 0, order.progress)}%` }}
            />
          </div>
          <span className="numeric w-7 text-[10px] text-muted">{order.progress}%</span>
        </div>
      );
    },
  },
  {
    accessorKey: "dueDate",
    id: "dueDate",
    meta: { label: "Due", width: "minmax(106px, 0.85fr)", minWidth: 106 },
    header: "Due",
    cell: ({ row }) => {
      const order = row.original;
      const overdue = dueStatuses.has(order.status) && isOverdue(order.dueDate);
      return (
        <div className="min-w-0">
          <p className={cn("text-[11.5px] text-ink", overdue && "text-danger")}>
            {formatDateShort(order.dueDate)}
          </p>
          <p className={cn("text-[10px]", overdue ? "text-danger" : "text-faint")}>
            {formatDueLabel(order.dueDate)}
          </p>
        </div>
      );
    },
  },
  {
    id: "open",
    enableSorting: false,
    enableHiding: false,
    meta: { label: "Open", width: "32px", minWidth: 32 },
    header: () => null,
    cell: () => (
      <span className="flex h-full items-center justify-center text-faint">
        <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    ),
  },
];

export function OrdersTableEmpty({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-sunken">
        <ArrowUpRight className="size-5 text-muted" />
      </div>
      <p className="mt-3 text-[13px] font-medium">No purchase orders match</p>
      <p className="mt-1 max-w-xs text-[11.5px] text-muted">
        {hasFilters
          ? "Try removing a filter or searching for a different buyer, style or PO number."
          : "There are no purchase orders in this dataset."}
      </p>
      {hasFilters ? (
        <Badge tone="neutral" className="mt-3">
          Filters active
        </Badge>
      ) : null}
    </div>
  );
}
