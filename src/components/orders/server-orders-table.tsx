"use client";

import * as React from "react";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import useSWR from "swr";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { ORDER_STATUSES, type Order } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDateShort, formatMoney, formatNumber } from "@/lib/utils";

type QueryResponse = { orders: Order[]; total: number; page: number; pageSize: number };

const fetcher = async (url: string): Promise<QueryResponse> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Query failed");
  return response.json();
};

const columns: ColumnDef<Order>[] = [
  { accessorKey: "id", header: "PO" },
  { accessorKey: "buyer", header: "Buyer" },
  { accessorKey: "factory", header: "Factory" },
  { accessorKey: "status", header: "Stage" },
  { accessorKey: "dueDate", header: "Due", cell: ({ row }) => formatDateShort(row.original.dueDate) },
  { accessorKey: "quantity", header: "Qty", cell: ({ row }) => formatNumber(row.original.quantity) },
  { accessorKey: "value", header: "Value", cell: ({ row }) => formatMoney(row.original.value) },
];

export function ServerOrdersTable() {
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(50);
  const [search, setSearch] = React.useState("");
  const [deferredSearch, setDeferredSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [factory, setFactory] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "dueDate", desc: false }]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredSearch(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sort: sorting[0]?.id ?? "dueDate",
    dir: sorting[0]?.desc ? "desc" : "asc",
  });
  if (deferredSearch) params.set("q", deferredSearch);
  if (status) params.set("status", status);
  if (factory) params.set("factory", factory);

  const { data, isLoading, error } = useSWR<QueryResponse>(
    `/api/orders/query?${params.toString()}`,
    fetcher,
    { keepPreviousData: true },
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data?.orders ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualFiltering: true,
  });

  const rows = table.getRowModel().rows;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 40,
    overscan: 8,
  });

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card>
      <CardHeader className="gap-3 pb-3">
        <div>
          <CardTitle>Server-driven order query</CardTitle>
          <CardDescription>
            Pagination, sorting and search run in Postgres. Only {pageSize} rows are fetched per page.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search PO, buyer, style…"
              className="h-8 w-56 pl-8 text-[11px]"
              aria-label="Server search"
            />
          </div>
          <select
            value={status}
            onChange={(event) => { setStatus(event.target.value); setPage(1); }}
            className="h-8 rounded-control border border-line bg-surface px-2 text-[11px]"
            aria-label="Filter by stage"
          >
            <option value="">All stages</option>
            {ORDER_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Input
            value={factory}
            onChange={(event) => { setFactory(event.target.value); setPage(1); }}
            placeholder="Factory"
            className="h-8 w-36 text-[11px]"
            aria-label="Filter by factory"
          />
          <span className="numeric text-[10px] text-muted">{formatNumber(total)} rows</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-[120px_1fr_1fr_120px_90px_90px_110px] border-y border-line bg-raised/60 px-3 py-2 text-[9px] uppercase tracking-[0.08em] text-faint">
          {table.getHeaderGroups()[0]?.headers.map((header) => (
            <button
              key={header.id}
              type="button"
              onClick={header.column.getToggleSortingHandler()}
              className="flex items-center gap-1 text-left"
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
              {header.column.getIsSorted() === "asc" ? <ArrowUp className="size-3" /> : null}
              {header.column.getIsSorted() === "desc" ? <ArrowDown className="size-3" /> : null}
            </button>
          ))}
        </div>
        <div ref={scrollRef} className="h-[520px] overflow-auto" data-testid="server-orders-scroll">
          {isLoading ? (
            <div className="flex h-24 items-center justify-center gap-2 text-[11px] text-muted">
              <Loader2 className="size-4 animate-spin" /> Querying Postgres…
            </div>
          ) : error ? (
            <p className="p-4 text-[11px] text-danger">The query could not be loaded.</p>
          ) : (
            <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
              {virtualizer.getVirtualItems().map((item) => {
                const row = rows[item.index];
                if (!row) return null;
                return (
                  <div
                    key={row.id}
                    data-testid="server-order-row"
                    className="absolute left-0 top-0 grid w-full grid-cols-[120px_1fr_1fr_120px_90px_90px_110px] items-center border-b border-line/70 px-3 text-[11px]"
                    style={{ height: item.size, transform: `translateY(${item.start}px)` }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <div key={cell.id} className="truncate pr-2">
                        {cell.column.id === "status" ? (
                          <Badge tone="neutral" size="sm">{String(cell.getValue())}</Badge>
                        ) : (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-line px-3 py-2 text-[10px] text-muted">
          <span className={cn("numeric")}>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft /> Previous
            </Button>
            <Button size="sm" variant="outline" className="h-7" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
