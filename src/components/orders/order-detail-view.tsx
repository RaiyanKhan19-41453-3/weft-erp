"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  CircleAlert,
  Copy,
  Download,
  ExternalLink,
  Factory,
  FileJson,
  FileText,
  Mail,
  MapPin,
  MoreHorizontal,
  Package,
  Pencil,
  Printer,
  Ship,
  Trash2,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import type { OrderDetail } from "@/lib/constants";
import { useLocalOrders } from "@/lib/stores/local-orders";
import { useOrderNotes } from "@/lib/stores/notes";
import {
  cn,
  formatDate,
  formatDueLabel,
  formatMoney,
  formatMoneyFull,
  formatNumber,
  isOverdue,
  sanitizeNoteHtml,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress, Spinner } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocalBadge, OrderStatusBadge, PriorityBadge } from "@/components/orders/status-badge";

const NotesEditorDialog = dynamic(
  () => import("@/components/orders/notes-editor").then((module) => module.NotesEditorDialog),
  {
    ssr: false,
    loading: () => <NotesEditorLoading />,
  },
);

function NotesEditorLoading() {
  return (
    <Dialog open>
      <DialogContent className="max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle>Loading rich-text editor</DialogTitle>
          <DialogDescription>
            Fetching the Tiptap chunk on demand. The base order page does not include it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 px-5 pb-5 text-[12px] text-muted">
          <Spinner className="text-brand" />
          Loading editor bundle…
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OrderDetailView({ order }: { order: OrderDetail }) {
  const router = useRouter();
  const [notesOpen, setNotesOpen] = React.useState(false);
  const storedNote = useOrderNotes((state) => state.notes[order.id]);
  const removeLocalOrder = useLocalOrders((state) => state.removeOrder);
  const note = React.useMemo(
    () => sanitizeNoteHtml(storedNote ?? order.qcNote),
    [storedNote, order.qcNote],
  );
  const overdue = isOverdue(order.dueDate);
  const maxSize = Math.max(...order.sizes.map((size) => size.quantity), 1);
  const activeStage = order.timeline.findIndex((stage) => stage.state === "active");

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Purchase order link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(order, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${order.id.toLowerCase()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Order JSON downloaded");
  };

  const removeLocal = () => {
    removeLocalOrder(order.id);
    toast.success("Local purchase order removed");
    router.push("/orders");
  };

  return (
    <>
      <div className="mb-5">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-[11px] text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          All purchase orders
        </Link>

        <div className="mt-2 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-faint">
                Purchase order
              </span>
              <span className="text-line-strong">/</span>
              <span className="text-[10.5px] text-muted">{order.season}</span>
              <OrderStatusBadge status={order.status} />
              <PriorityBadge priority={order.priority} />
              {order.isLocal ? <LocalBadge /> : null}
            </div>
            <h1 className="mt-1.5 font-mono text-[25px] font-semibold tracking-[-0.03em] text-ink md:text-[28px]">
              {order.id}
            </h1>
            <p className="mt-1 text-[12.5px] text-muted">
              {order.buyer} · {order.style}{" "}
              <span className="font-mono text-[11px] text-faint">{order.styleCode}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setNotesOpen(true)}>
              <Pencil />
              Edit notes
            </Button>
            <Button asChild variant="primary">
              <Link href={`/orders/${order.id}/invoice`} target="_blank">
                <Printer />
                Print invoice
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More purchase order actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Order actions</DropdownMenuLabel>
                <DropdownMenuItem onSelect={copyLink}>
                  <Copy />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={exportJson}>
                  <Download />
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/orders/${order.id}/invoice`} target="_blank">
                    <Printer />
                    Open print sheet
                  </Link>
                </DropdownMenuItem>
                {order.isLocal ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={removeLocal}
                      className="text-danger focus:bg-danger/10"
                    >
                      <Trash2 />
                      Remove local copy
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {order.isLocal ? (
        <div className="mb-3 flex items-start gap-2.5 rounded-card border border-brand/20 bg-brand-soft/60 px-3.5 py-2.5 text-[11.5px] leading-5 dark:border-brand/20 dark:bg-brand/[0.07]">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-brand" />
          <p className="text-brand-ink dark:text-brand">
            This purchase order is stored in this browser only. It was created through the demo API,
            which validates the payload but does not persist it to a database.
          </p>
        </div>
      ) : null}

      {order.atRisk ? (
        <div className="mb-3 flex flex-col gap-2.5 rounded-card border border-red-200 bg-red-50/70 px-3.5 py-2.5 sm:flex-row sm:items-center dark:border-red-500/20 dark:bg-red-500/[0.06]">
          <TriangleAlert className="size-4 shrink-0 text-danger" />
          <p className="text-[11.5px] leading-5 text-red-900 dark:text-red-200">
            <strong className="font-semibold">This PO needs attention.</strong> It is{" "}
            {formatDueLabel(order.dueDate).toLowerCase()} with {100 - order.progress}% of production
            remaining. Escalate with {order.factory} if the ship window cannot be recovered.
          </p>
          <span className="ml-auto shrink-0 text-[10.5px] font-medium text-danger">
            {formatMoney(order.value)} exposed
          </span>
        </div>
      ) : null}

      <Card className="mb-3 overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-4 sm:divide-y-0">
          <SummaryStat
            icon={<FileText className="size-3.5" />}
            label="Order value"
            value={formatMoneyFull(order.value)}
            sub={`${formatNumber(order.quantity)} pcs · $${order.unitPrice.toFixed(2)} avg`}
          />
          <SummaryStat
            icon={<Package className="size-3.5" />}
            label="Produced"
            value={`${formatNumber(order.unitsProduced)} pcs`}
            sub={`${order.progress}% of ${formatNumber(order.quantity)}`}
          />
          <SummaryStat
            icon={<Factory className="size-3.5" />}
            label="Production unit"
            value={order.line}
            sub={order.factory}
          />
          <SummaryStat
            icon={<CalendarDays className="size-3.5" />}
            label="Ship window"
            value={formatDate(order.dueDate)}
            sub={formatDueLabel(order.dueDate)}
            danger={overdue && !["shipped", "cancelled"].includes(order.status)}
          />
        </div>
        <div className="flex items-center gap-3 border-t border-line bg-raised/40 px-4 py-2.5">
          <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-faint">
            Cut &amp; sew
          </span>
          <Progress
            value={order.progress}
            className="max-w-md"
            indicatorClassName={order.atRisk ? "bg-danger" : "bg-brand"}
            label={`${order.id} production progress`}
          />
          <span className="numeric text-[10.5px] text-muted">{order.progress}%</span>
          <span className="ml-auto hidden text-[10px] text-faint sm:block">
            {activeStage >= 0
              ? `${order.timeline[activeStage]?.label} in progress`
              : order.status === "shipped"
                ? "Dispatched"
                : "Not started"}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.62fr_1fr]">
        <div className="min-w-0 space-y-3 xl:self-start">
        <Card className="min-w-0">
          <Tabs defaultValue="overview">
            <div className="px-4 pt-1">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="items">
                  Line items <Badge tone="neutral" size="sm">{order.lines.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="notes">
                  Notes
                  {storedNote ? (
                    <span className="size-1.5 rounded-full bg-brand" aria-label="Edited locally" />
                  ) : null}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="p-4">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                <Field label="Buyer" value={order.buyer} sub={order.buyerCountry} />
                <Field label="Style" value={order.style} sub={order.styleCode} monoSub />
                <Field label="Season" value={order.season} sub="Merchandising" />
                <Field label="Fabric" value={order.fabric} sub={`${order.gsm} gsm`} />
                <Field label="Colour" value={order.colour} sub={order.wash} />
                <Field
                  label="Factory / line"
                  value={order.line}
                  sub={order.factory}
                />
                <Field
                  label="Destination"
                  value={order.destination}
                  sub={order.buyerCountry}
                />
                <Field
                  label="PO date"
                  value={formatDate(order.poDate)}
                  sub={order.season}
                />
                <Field
                  label="Incoterm"
                  value={order.shipping.incoterm}
                  sub={order.shipping.mode}
                />
              </dl>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-line bg-raised/50 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    <Factory className="size-3.5 text-muted" />
                    Factory handoff
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-5 text-muted">
                    {formatNumber(order.unitsProduced)} of {formatNumber(order.quantity)} pieces
                    produced on {order.line}. Expected dispatch from {order.shipping.port} in{" "}
                    {order.shipping.container}.
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-raised/50 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    <Ship className="size-3.5 text-muted" />
                    Shipping plan
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-5 text-muted">
                    {order.shipping.mode} · {order.shipping.incoterm} · ETD{" "}
                    {formatDate(order.shipping.etd)}. Final destination {order.destination},{" "}
                    {order.buyerCountry}.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="items" className="p-4">
              <div className="overflow-x-auto rounded-lg border border-line">
                <table className="w-full min-w-[520px] text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-line bg-raised/60 text-[9.5px] uppercase tracking-[0.08em] text-faint">
                      <th className="px-3 py-2 font-medium">Style</th>
                      <th className="px-3 py-2 font-medium">Colour</th>
                      <th className="px-3 py-2 text-right font-medium">Qty</th>
                      <th className="px-3 py-2 text-right font-medium">Unit price</th>
                      <th className="px-3 py-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {order.lines.map((line) => (
                      <tr key={`${line.styleCode}-${line.colour}`}>
                        <td className="px-3 py-2">
                          <span className="block font-medium">{line.style}</span>
                          <span className="font-mono text-[10px] text-faint">{line.styleCode}</span>
                        </td>
                        <td className="px-3 py-2 text-muted">{line.colour}</td>
                        <td className="numeric px-3 py-2 text-right">{formatNumber(line.quantity)}</td>
                        <td className="numeric px-3 py-2 text-right">
                          {formatMoneyFull(line.unitPrice)}
                        </td>
                        <td className="numeric px-3 py-2 text-right font-medium">
                          {formatMoneyFull(line.quantity * line.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-line bg-raised/60 text-[11.5px]">
                      <td className="px-3 py-2 font-medium" colSpan={2}>
                        Total
                      </td>
                      <td className="numeric px-3 py-2 text-right font-medium">
                        {formatNumber(order.quantity)}
                      </td>
                      <td />
                      <td className="numeric px-3 py-2 text-right font-semibold">
                        {formatMoneyFull(order.value)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-end justify-between">
                  <h3 className="text-[12px] font-semibold">Size allocation</h3>
                  <span className="text-[10px] text-faint">
                    {order.sizes.length} sizes · {formatNumber(order.quantity)} pcs
                  </span>
                </div>
                <div className="overflow-hidden rounded-lg border border-line">
                  {order.sizes.map((size) => (
                    <div
                      key={size.size}
                      className="flex items-center gap-3 border-b border-line px-3 py-1.5 last:border-b-0"
                    >
                      <span className="w-10 text-[11px] font-medium">{size.size}</span>
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-sunken">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${(size.quantity / maxSize) * 100}%` }}
                        />
                      </div>
                      <span className="numeric w-14 text-right text-[11px]">
                        {formatNumber(size.quantity)}
                      </span>
                      <span className="numeric w-10 text-right text-[10px] text-faint">
                        {Math.round((size.quantity / order.quantity) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[11px] text-muted">
                  Planned milestones for {order.id} · {order.season} production calendar.
                </p>
                <Badge tone={order.status === "shipped" ? "green" : "neutral"}>
                  {order.status === "shipped" ? "Complete" : `${order.progress}% complete`}
                </Badge>
              </div>
              <ol className="relative ml-1 border-l border-line">
                {order.timeline.map((stage) => (
                  <li key={stage.label} className="relative pb-5 pl-5 last:pb-0">
                    <span
                      className={cn(
                        "absolute -left-[5px] top-1 flex size-2.5 items-center justify-center rounded-full border-2 border-surface",
                        stage.state === "done" && "bg-brand",
                        stage.state === "active" && "bg-warning ring-4 ring-warning/15",
                        stage.state === "pending" && "bg-line-strong",
                      )}
                    />
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <p
                        className={cn(
                          "text-[12px] font-medium",
                          stage.state === "pending" && "text-muted",
                        )}
                      >
                        {stage.label}
                      </p>
                      <span className="text-[10px] text-faint">
                        {stage.date ? formatDate(stage.date) : "Not scheduled"}
                      </span>
                      <span
                        className={cn(
                          "ml-auto inline-flex items-center gap-1 text-[9.5px] font-medium uppercase tracking-[0.06em]",
                          stage.state === "done" && "text-positive",
                          stage.state === "active" && "text-warning",
                          stage.state === "pending" && "text-faint",
                        )}
                      >
                        {stage.state === "done" ? <Check className="size-3" /> : null}
                        {stage.state === "active" ? <span className="size-1.5 rounded-full bg-warning" /> : null}
                        {stage.state === "done" ? "Done" : stage.state === "active" ? "In progress" : "Planned"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted">{stage.detail}</p>
                  </li>
                ))}
              </ol>
            </TabsContent>

            <TabsContent value="notes" className="p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[12px] font-medium">Quality &amp; production notes</p>
                  <p className="text-[10.5px] text-faint">
                    {storedNote
                      ? "Edited in this browser · sanitised HTML"
                      : "Generated demo note · edit to test the lazy editor"}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setNotesOpen(true)}>
                  <Pencil />
                  Edit note
                </Button>
              </div>
              <div
                className="prose-note rounded-lg border border-line bg-raised/40 px-4 py-3"
                dangerouslySetInnerHTML={{ __html: note }}
              />
              <div className="mt-3 flex items-center gap-2 text-[10px] text-faint">
                <ShieldBadge />
                HTML is whitelisted with DOMPurify before it is stored in localStorage.
              </div>
            </TabsContent>
          </Tabs>
        </Card>

          <Card>
            <CardHeader className="pb-2">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Print-ready outputs</CardDescription>
              </div>
              <FileText className="size-4 text-muted" />
            </CardHeader>
            <CardContent className="grid gap-1 pt-0 sm:grid-cols-3">
              <DocumentLink
                href={`/orders/${order.id}/invoice`}
                title="Commercial invoice"
                description="A4 · print stylesheet"
                icon={<Printer className="size-3.5" />}
              />
              <DocumentLink
                href={`/orders/${order.id}/invoice#packing`}
                title="Packing list"
                description="Carton & size breakdown"
                icon={<Package className="size-3.5" />}
              />
              <button
                type="button"
                onClick={exportJson}
                className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-2 text-left transition-colors hover:bg-raised"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-line bg-raised text-muted">
                  <FileJson className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11.5px] font-medium">Order JSON</span>
                  <span className="block text-[10px] text-faint">Full record · download</span>
                </span>
                <Download className="ml-auto size-3.5 text-faint" />
              </button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <div>
                <CardTitle>Shipment</CardTitle>
                <CardDescription>Handover and freight details</CardDescription>
              </div>
              <Ship className="size-4 text-muted" />
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0">
              <InfoRow icon={<Ship className="size-3.5" />} label="Mode" value={order.shipping.mode} />
              <InfoRow
                icon={<FileText className="size-3.5" />}
                label="Incoterm"
                value={order.shipping.incoterm}
              />
              <InfoRow
                icon={<Package className="size-3.5" />}
                label="Container"
                value={order.shipping.container}
              />
              <InfoRow
                icon={<MapPin className="size-3.5" />}
                label="Port"
                value={order.shipping.port}
              />
              <InfoRow
                icon={<CalendarDays className="size-3.5" />}
                label="ETD"
                value={formatDate(order.shipping.etd)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div>
                <CardTitle>Buyer</CardTitle>
                <CardDescription>Merchandising contact</CardDescription>
              </div>
              <UserRound className="size-4 text-muted" />
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0">
              <InfoRow
                icon={<UserRound className="size-3.5" />}
                label="Contact"
                value={order.buyerContact}
              />
              <InfoRow
                icon={<Mail className="size-3.5" />}
                label="Email"
                value={
                  <a href={`mailto:${order.buyerEmail}`} className="text-brand hover:underline">
                    {order.buyerEmail}
                  </a>
                }
              />
              <InfoRow
                icon={<MapPin className="size-3.5" />}
                label="Destination"
                value={`${order.destination}, ${order.buyerCountry}`}
              />
              <InfoRow
                icon={<FileText className="size-3.5" />}
                label="PO received"
                value={formatDate(order.poDate)}
              />
            </CardContent>
          </Card>

        </div>
      </div>

      {notesOpen ? (
        <NotesEditorDialog
          orderId={order.id}
          initialHtml={storedNote ?? order.qcNote}
          open={notesOpen}
          onOpenChange={(next) => {
            setNotesOpen(next);
          }}
        />
      ) : null}
    </>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  sub,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  danger?: boolean;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-1.5 text-[9.5px] font-medium uppercase tracking-[0.08em] text-faint">
        <span className="text-muted [&_svg]:size-3.5">{icon}</span>
        {label}
      </div>
      <p className="numeric mt-1.5 truncate text-[16px] font-semibold tracking-[-0.02em]">{value}</p>
      <p className={cn("mt-0.5 truncate text-[10.5px]", danger ? "text-danger" : "text-muted")}>
        {sub}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  sub,
  monoSub,
}: {
  label: string;
  value: string;
  sub?: string;
  monoSub?: boolean;
}) {
  return (
    <div>
      <dt className="text-[9.5px] font-medium uppercase tracking-[0.08em] text-faint">{label}</dt>
      <dd className="mt-0.5 text-[12px] font-medium text-ink">{value}</dd>
      {sub ? (
        <dd className={cn("text-[10.5px] text-muted", monoSub && "font-mono")}>{sub}</dd>
      ) : null}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-faint [&_svg]:size-3.5">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[9.5px] uppercase tracking-[0.06em] text-faint">{label}</span>
        <span className="block truncate text-[11.5px] text-ink">{value}</span>
      </span>
    </div>
  );
}

function DocumentLink({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      className="group flex items-center gap-2.5 rounded-md px-1.5 py-2 transition-colors hover:bg-raised"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-line bg-raised text-muted">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[11.5px] font-medium">{title}</span>
        <span className="block text-[10px] text-faint">{description}</span>
      </span>
      <ArrowUpRight className="ml-auto size-3.5 text-faint group-hover:text-ink" />
    </Link>
  );
}

function ShieldBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-1.5 py-0.5 text-[9.5px] text-muted">
      <ExternalLink className="size-2.5" />
      sanitised
    </span>
  );
}
