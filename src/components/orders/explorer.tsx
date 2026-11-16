"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type FilterFn,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  CircleAlert,
  Link2,
  RotateCcw,
  Rows3,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BUYERS, STATUS_META, type Order, type OrderStatus } from "@/lib/constants";
import { useLocalOrders } from "@/lib/stores/local-orders";
import { useTablePrefs } from "@/lib/stores/table-prefs";
import { orderColumns } from "@/components/orders/columns";
import { OrdersToolbar } from "@/components/orders/toolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Spinner, EmptyState } from "@/components/ui/misc";
import {
  cn,
  downloadCsv,
  formatNumber,
  toCsv,
} from "@/lib/utils";

type OrdersResponse = {
  orders: Order[];
  count: number;
};

async function fetcher(url: string): Promise<OrdersResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`The order service returned ${response.status}.`);
  }
  return (await response.json()) as OrdersResponse;
}

const globalFilter: FilterFn<Order> = (row, _columnId, filterValue) => {
  const tokens = String(filterValue).toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const order = row.original;
  const haystack = [
    order.id,
    order.buyer,
    order.buyerCode,
    order.style,
    order.styleCode,
    order.factory,
    order.line,
    order.buyerCountry,
    order.destination,
    order.season,
  ]
    .join(" ")
    .toLowerCase();
  return tokens.every((token) => haystack.includes(token));
};

const buyerNames = BUYERS.map((buyer) => buyer.name);

export type OrdersExplorerProps = {
  initialQuery?: string;
  initialStatus?: OrderStatus | "all";
  initialBuyer?: string;
  initialRisk?: boolean;
};

export function OrdersExplorer({
  initialQuery = "",
  initialStatus = "all",
  initialBuyer = "all",
  initialRisk = false,
}: OrdersExplorerProps) {
  const router = useRouter();
  const density = useTablePrefs((state) => state.density);
  const localOrders = useLocalOrders((state) => state.orders);
  const clearLocalOrders = useLocalOrders((state) => state.clear);

  const [search, setSearch] = React.useState(initialQuery);
  const [status, setStatus] = React.useState<OrderStatus | "all">(initialStatus);
  const [buyer, setBuyer] = React.useState(initialBuyer);
  const [riskOnly, setRiskOnly] = React.useState(initialRisk);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "dueDate", desc: false },
  ]);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const deferredSearch = React.useDeferredValue(search);
  const isFiltering = search !== deferredSearch;

  const { data, error, isLoading, isValidating, mutate } = useSWR<OrdersResponse>(
    "/api/orders",
    fetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 300_000,
    },
  );

  React.useEffect(() => {
    setSearch(initialQuery);
  }, [initialQuery]);

  React.useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  React.useEffect(() => {
    setBuyer(initialBuyer);
  }, [initialBuyer]);

  React.useEffect(() => {
    setRiskOnly(initialRisk);
  }, [initialRisk]);

  const orders = React.useMemo(() => {
    const generated = data?.orders ?? [];
    const localIds = new Set(localOrders.map((order) => order.id));
    return [...localOrders, ...generated.filter((order) => !localIds.has(order.id))];
  }, [data, localOrders]);

  const baseFiltered = React.useMemo(
    () =>
      orders.filter(
        (order) =>
          (status === "all" || order.status === status) &&
          (buyer === "all" || order.buyer === buyer) &&
          (!riskOnly || order.atRisk),
      ),
    [orders, status, buyer, riskOnly],
  );

  // TanStack Table exposes mutable function references that the React Compiler
  // intentionally does not memoize. The table remains the source of truth.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: baseFiltered,
    columns: orderColumns,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
      globalFilter: deferredSearch,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    globalFilterFn: globalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const rows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const selectedRows = table.getSelectedRowModel().rows;
  const riskCount = orders.filter((order) => order.atRisk).length;
  const hasFilters =
    search.trim().length > 0 || status !== "all" || buyer !== "all" || riskOnly;

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setBuyer("all");
    setRiskOnly(false);
  };

  const exportOrders = (ordersToExport: Order[], suffix: string) => {
    if (ordersToExport.length === 0) return;
    const content = toCsv(
      [
        "PO",
        "Buyer",
        "Country",
        "Style",
        "Style code",
        "Quantity",
        "Unit price (USD)",
        "Value (USD)",
        "Stage",
        "Priority",
        "Factory",
        "Line",
        "Season",
        "Due date",
        "Created",
        "Progress %",
        "At risk",
        "Browser-local",
      ],
      ordersToExport.map((order) => [
        order.id,
        order.buyer,
        order.buyerCountry,
        order.style,
        order.styleCode,
        order.quantity,
        order.unitPrice.toFixed(2),
        order.value.toFixed(2),
        STATUS_META[order.status].label,
        order.priority,
        order.factory,
        order.line,
        order.season,
        order.dueDate.slice(0, 10),
        order.createdAt.slice(0, 10),
        order.progress,
        order.atRisk ? "yes" : "no",
        order.isLocal ? "yes" : "no",
      ]),
    );
    downloadCsv(`weft-${suffix}-2026-11-16.csv`, content);
    toast.success(`${formatNumber(ordersToExport.length)} purchase orders exported`);
  };

  const copyViewLink = async () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (status !== "all") params.set("status", status);
    if (buyer !== "all") params.set("buyer", buyer);
    if (riskOnly) params.set("risk", "1");
    const url = `${window.location.origin}/orders${params.size ? `?${params.toString()}` : ""}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("View link copied", {
        description: "The current filters are encoded in the URL.",
      });
    } catch {
      toast.error("Could not copy the link", { description: url });
    }
  };

  return (
    <>
      {localOrders.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-card border border-brand/20 bg-brand-soft/60 px-3.5 py-2.5 text-[11.5px] text-brand-ink dark:border-brand/20 dark:bg-brand/[0.07]">
          <span className="flex size-6 items-center justify-center rounded-full bg-brand/10">
            <Rows3 className="size-3.5" />
          </span>
          <span>
            <strong className="font-semibold">{localOrders.length} browser-local PO</strong>
            {localOrders.length === 1 ? " is" : "s are"} included in this view. They live in this
            browser only — the API does not persist them.
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-brand-ink hover:bg-brand/10 dark:text-brand"
            onClick={() => {
              clearLocalOrders();
              toast.success("Browser-local POs removed");
            }}
          >
            <X />
            Clear local POs
          </Button>
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <OrdersToolbar
          table={table}
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          buyer={buyer}
          onBuyerChange={setBuyer}
          riskOnly={riskOnly}
          onRiskChange={setRiskOnly}
          buyers={buyerNames}
          riskCount={riskCount}
          resultCount={filteredCount}
          totalCount={orders.length}
          isFiltering={isFiltering}
          hasFilters={hasFilters}
          onClear={clearFilters}
          onExport={() => exportOrders(rows.map((row) => row.original), "purchase-orders")}
        />

        {selectedRows.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-ink px-3 py-2 text-surface">
            <span className="inline-flex items-center gap-1.5 text-[11.5px]">
              <Checkbox
                checked
                onCheckedChange={() => table.resetRowSelection()}
                aria-label="Clear selection"
                className="border-white/40 bg-white/10 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-ink"
              />
              <strong className="numeric">{formatNumber(selectedRows.length)}</strong> selected
            </span>
            <span className="hidden text-[10px] text-surface/50 sm:inline">
              Bulk actions are demo-only and do not mutate the synthetic dataset.
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="text-surface hover:bg-white/10 hover:text-surface"
                onClick={() =>
                  exportOrders(
                    selectedRows.map((row) => row.original),
                    "selected-purchase-orders",
                  )
                }
              >
                Export selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-surface hover:bg-white/10 hover:text-surface"
                onClick={() =>
                  toast.success(
                    `${formatNumber(selectedRows.length)} POs queued for QC sign-off`,
                    { description: "Demo action — no server mutation is performed." },
                  )
                }
              >
                Mark ready
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-surface hover:bg-white/10 hover:text-surface"
                onClick={() => table.resetRowSelection()}
                aria-label="Clear selection"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : null}

        {error && !isLoading ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-danger/10 text-danger">
              <CircleAlert className="size-5" />
            </div>
            <p className="mt-3 text-[13px] font-medium">The order dataset could not be loaded</p>
            <p className="mt-1 max-w-sm text-[11.5px] text-muted">
              {error instanceof Error ? error.message : "Check the connection and try again."}
            </p>
            <Button variant="outline" size="default" className="mt-4" onClick={() => void mutate()}>
              <RotateCcw />
              Try again
            </Button>
          </div>
        ) : isLoading ? (
          <div>
            <OrdersTableHeader table={table} />
            <TableSkeleton rows={10} />
            <OrdersTableFooter
              resultCount={0}
              totalCount={0}
              renderedCount={0}
              loading
              onCopyView={copyViewLink}
            />
          </div>
        ) : (
          <OrdersTable
            table={table}
            rowHeight={density === "compact" ? 44 : 56}
            resultCount={filteredCount}
            totalCount={orders.length}
            hasFilters={hasFilters}
            onClear={clearFilters}
            onCopyView={copyViewLink}
            onOpen={(id) => router.push(`/orders/${id}`)}
            isValidating={isValidating}
          />
        )}
      </Card>

      <p className="mt-2 px-1 text-[10px] leading-4 text-faint">
        {formatNumber(orders.length)} synthetic purchase orders · rows are virtualized and only
        the visible window is mounted · the filter input uses{" "}
        <code className="rounded bg-sunken px-1 py-0.5 font-mono text-[9.5px] text-ink">useDeferredValue</code>{" "}
        so typing stays responsive while the table catches up.
      </p>
    </>
  );
}

type OrdersTableProps = {
  table: ReturnType<typeof useReactTable<Order>>;
  rowHeight: number;
  resultCount: number;
  totalCount: number;
  hasFilters: boolean;
  onClear: () => void;
  onCopyView: () => void;
  onOpen: (id: string) => void;
  isValidating: boolean;
};

function columnTemplate(table: OrdersTableProps["table"]) {
  const visible = table.getVisibleLeafColumns();
  return {
    gridTemplateColumns: visible
      .map((column) => column.columnDef.meta?.width ?? "1fr")
      .join(" "),
    minWidth: visible.reduce(
      (total, column) => total + (column.columnDef.meta?.minWidth ?? 80),
      0,
    ),
  };
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp className="size-3" />;
  if (direction === "desc") return <ArrowDown className="size-3" />;
  return <ChevronsUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-50" />;
}

function OrdersTableHeader({ table }: { table: OrdersTableProps["table"] }) {
  const style = columnTemplate(table);
  return (
    <div
      role="rowgroup"
      className="sticky top-0 z-10 border-b border-line bg-raised"
      style={{ minWidth: style.minWidth }}
    >
      <div
        role="row"
        className="grid h-8 w-full items-stretch text-[9.5px] font-medium uppercase tracking-[0.08em] text-faint"
        style={style}
      >
        {table.getHeaderGroups()[0]?.headers.map((header) => {
          const align = header.column.columnDef.meta?.align;
          const sorted = header.column.getIsSorted();
          return (
            <div
              key={header.id}
              role="columnheader"
              aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
              className={cn(
                "flex min-w-0 items-center px-3",
                align === "right" && "justify-end",
                (header.column.id === "select" || header.column.id === "open") && "px-0",
              )}
            >
              {header.isPlaceholder ? null : header.column.getCanSort() ? (
                <button
                  type="button"
                  onClick={header.column.getToggleSortingHandler()}
                  className={cn(
                    "group flex w-full items-center gap-1 whitespace-nowrap outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/30",
                    align === "right" && "justify-end",
                  )}
                  aria-label={`Sort by ${header.column.columnDef.meta?.label ?? header.column.id}`}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  <SortIcon direction={sorted} />
                </button>
              ) : (
                flexRender(header.column.columnDef.header, header.getContext())
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrdersTable({
  table,
  rowHeight,
  resultCount,
  totalCount,
  hasFilters,
  onClear,
  onCopyView,
  onOpen,
  isValidating,
}: OrdersTableProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;
  const template = columnTemplate(table);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
  });

  React.useEffect(() => {
    virtualizer.measure();
  }, [rowHeight, virtualizer]);

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div>
      <div
        ref={scrollRef}
        className="h-[min(640px,calc(100dvh-315px))] min-h-[380px] overflow-auto overscroll-contain"
        role="table"
        aria-label="Purchase orders"
        aria-rowcount={rows.length + 1}
      >
        <OrdersTableHeader table={table} />
        {rows.length === 0 ? (
          <EmptyState
            title="No purchase orders match"
            description={
              hasFilters
                ? "Try removing a filter or searching for a different buyer, style or PO number."
                : "There are no purchase orders in this dataset."
            }
            action={
              hasFilters ? (
                <Button variant="outline" size="default" onClick={onClear}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        ) : (
          <div
            role="rowgroup"
            style={{
              height: virtualizer.getTotalSize(),
              minWidth: template.minWidth,
              position: "relative",
            }}
          >
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              if (!row) return null;
              const selected = row.getIsSelected();
              return (
                <div
                  key={row.id}
                  role="row"
                  aria-rowindex={virtualRow.index + 2}
                  aria-selected={selected}
                  data-state={selected ? "selected" : undefined}
                  className={cn(
                    "group absolute left-0 top-0 grid w-full cursor-pointer items-center border-b border-line/80 text-[12px] transition-colors hover:bg-raised/80 data-[state=selected]:bg-brand-soft/45 dark:data-[state=selected]:bg-brand/[0.06]",
                  )}
                  style={{
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                    ...template,
                  }}
                  onClick={(event) => {
                    const target = event.target as HTMLElement;
                    if (target.closest("a, button, input, label, [role=checkbox]")) return;
                    onOpen(row.original.id);
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const align = cell.column.columnDef.meta?.align;
                    return (
                      <div
                        key={cell.id}
                        role="cell"
                        className={cn(
                          "flex min-w-0 items-center px-3",
                          align === "right" && "justify-end text-right",
                          (cell.column.id === "select" || cell.column.id === "open") && "px-0",
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <OrdersTableFooter
        resultCount={resultCount}
        totalCount={totalCount}
        renderedCount={virtualRows.length}
        isValidating={isValidating}
        onCopyView={onCopyView}
      />
    </div>
  );
}

function OrdersTableFooter({
  resultCount,
  totalCount,
  renderedCount,
  loading,
  isValidating,
  onCopyView,
}: {
  resultCount: number;
  totalCount: number;
  renderedCount: number;
  loading?: boolean;
  isValidating?: boolean;
  onCopyView: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line bg-raised/40 px-3 py-2 text-[10px] text-faint">
      <span aria-live="polite">
        {loading ? (
          <span className="inline-flex items-center gap-1.5">
            <Spinner className="size-3" />
            Loading 5,000 purchase orders…
          </span>
        ) : (
          <>
            Showing <span className="numeric text-muted">{formatNumber(resultCount)}</span> of{" "}
            <span className="numeric">{formatNumber(totalCount)}</span> POs
          </>
        )}
      </span>
      {!loading ? (
        <>
          <span className="text-line-strong">·</span>
          <span className="numeric">{renderedCount} rows in DOM</span>
          <span className="hidden text-line-strong sm:inline">·</span>
          <span className="hidden sm:inline">Virtualized with TanStack Virtual</span>
        </>
      ) : null}
      {isValidating ? (
        <span className="inline-flex items-center gap-1">
          <span className="text-line-strong">·</span>
          <Spinner className="size-3" /> Refreshing
        </span>
      ) : null}
      <div className="ml-auto flex items-center gap-2">
        {resultCount < totalCount && !loading ? (
          <span className="inline-flex items-center gap-1 text-warning">
            <TriangleAlert className="size-3" />
            Filtered view
          </span>
        ) : null}
        <button
          type="button"
          onClick={onCopyView}
          className="inline-flex items-center gap-1 text-[10px] text-muted transition-colors hover:text-ink"
        >
          <Link2 className="size-3" />
          Copy view link
        </button>
      </div>
    </div>
  );
}
