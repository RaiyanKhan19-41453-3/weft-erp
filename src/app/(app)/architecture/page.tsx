import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Check,
  CircleAlert,
  Code2,
  Database,
  FileText,
  Gauge,
  GitBranch,
  Layers3,
  MonitorSmartphone,
  Printer,
  Server,
  ShieldCheck,
  Sparkles,
  Table2,
  Workflow,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/misc";
import { BrowserVitals } from "@/components/performance-vitals";

export const metadata: Metadata = {
  title: "Architecture & tradeoffs",
  description:
    "An engineering case study of Weft: RSC boundaries, cache components, a 5,000-row virtualized table, typed forms, bundle measurements and print output.",
};

const SECTIONS = [
  { id: "brief", label: "Brief & constraints" },
  { id: "architecture", label: "Architecture" },
  { id: "data", label: "Data layer" },
  { id: "grid", label: "The order grid" },
  { id: "forms", label: "Forms & state" },
  { id: "bundle", label: "Bundle budget" },
  { id: "print", label: "Print output" },
  { id: "quality", label: "Accessibility" },
  { id: "tradeoffs", label: "Tradeoffs" },
] as const;

const BUNDLE_ROWS = [
  { route: "/", label: "Operations overview", total: "268.0", delta: "2.3" },
  { route: "/analytics", label: "Analytics", total: "268.4", delta: "2.8" },
  { route: "/architecture", label: "Architecture case study", total: "269.9", delta: "4.2" },
  { route: "/materials", label: "Materials", total: "272.5", delta: "6.8" },
  { route: "/orders/[id]/invoice", label: "Invoice", total: "275.7", delta: "10.0" },
  { route: "/orders/[id]", label: "Order detail", total: "292.8", delta: "27.2" },
  { route: "/orders", label: "Purchase orders", total: "313.2", delta: "47.5" },
  { route: "/orders/new", label: "New purchase order", total: "347.6", delta: "81.9" },
] as const;

const BOUNDARIES = [
  {
    layer: "Server Components",
    detail:
      "Dashboard, orders shell, order detail, invoice, materials, analytics and this page. Data is read close to the cache; no client state needed for layout or formatting.",
    icon: <Server className="size-4" />,
  },
  {
    layer: "Client islands",
    detail:
      "Orders explorer, charts, command palette, theme toggle, form, notes editor and print toolbar. Each island exists because it needs browser state, input or a charting canvas.",
    icon: <MonitorSmartphone className="size-4" />,
  },
  {
    layer: "Browser-local state",
    detail:
      "Zustand stores for table density, PO drafts, local POs and edited notes. Persist middleware with skipHydration avoids SSR/localStorage mismatches.",
    icon: <Database className="size-4" />,
  },
] as const;

export default function ArchitecturePage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <span>Engineering notes</span>
            <span className="text-line-strong">/</span>
            <span className="normal-case tracking-normal text-faint">
              Synthetic portfolio project
            </span>
          </>
        }
        title="Architecture & tradeoffs"
        description="A case study of the decisions behind Weft: deterministic data, server components with Cache Components, a 5,000-row virtualized grid, typed forms, measured JavaScript, and a print pipeline that produces a real A4 document."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/orders/PO-26-4001/invoice" target="_blank">
                <Printer />
                Sample invoice
              </Link>
            </Button>
            <Button asChild variant="primary">
              <Link href="/orders">
                Open order book
                <ArrowRight />
              </Link>
            </Button>
          </>
        }
        meta={
          <>
            <Badge tone="neutral" size="sm">
              Next.js 16.4.6
            </Badge>
            <Badge tone="neutral" size="sm">
              React 19.3
            </Badge>
            <Badge tone="neutral" size="sm">
              TypeScript
            </Badge>
            <Badge tone="neutral" size="sm">
              Tailwind v4
            </Badge>
            <Badge tone="brand" size="sm">
              Production build green
            </Badge>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[188px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <nav aria-label="Case study contents" className="sticky top-[72px]">
            <p className="mb-2 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-faint">
              Contents
            </p>
            <ol className="space-y-0.5 border-l border-line">
              {SECTIONS.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="group flex items-baseline gap-2 border-l-2 border-transparent py-1 pl-3 text-[11px] text-muted transition-colors hover:border-brand/40 hover:text-ink"
                  >
                    <span className="numeric text-[9px] text-faint">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {section.label}
                  </a>
                </li>
              ))}
            </ol>
            <div className="mt-5 rounded-lg border border-line bg-raised/50 p-3">
              <p className="text-[10px] font-medium">Measured, not claimed</p>
              <p className="mt-1 text-[9.5px] leading-4 text-muted">
                Bundle numbers come from the production build output and gzip -9 over the route
                chunk graph. Lighthouse scores come from local desktop-preset runs of that build.
              </p>
            </div>
          </nav>
        </aside>

        <div className="min-w-0 max-w-4xl">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat value="5,000" label="synthetic POs" />
            <Stat value="~40" label="rows mounted at once" />
            <Stat value="266 KB" label="shared JS, gzip" />
            <Stat value="2 pages" label="A4 print output" />
          </div>

          <Section
            id="brief"
            number="01"
            title="The brief, and what I optimised for"
            kicker="Context"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-[12.5px] leading-6 text-muted">
                  The brief was a data-dense ERP interface built with Next.js App Router, React
                  19, TanStack Table and Virtual, React Hook Form, Zod, Zustand, SWR, Axios, Radix
                  and Tailwind. The portfolio needed to show those tools doing real work, not a
                  landing page with the logos listed.
                </p>
                <p className="mt-3 text-[12.5px] leading-6 text-muted">
                  I chose apparel manufacturing because the domain has useful constraints:
                  purchase orders, style/colour/size matrices, production stages, material coverage,
                  buyer scorecards and shipping documents. That gave every screen a reason to exist.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-raised/50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
                  Build constraints
                </p>
                <ul className="mt-2 space-y-2 text-[11.5px] leading-5 text-muted">
                  <li className="flex gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-positive" />
                    No paid services — free Postgres is optional, everything runs on Vercel&apos;s free tier.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-positive" />
                    Deterministic data so screenshots, caches and reviews are reproducible.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-positive" />
                    Every control should do something honest; no dead nav or fake AI panels.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-positive" />
                    A production build, typecheck and print output that actually work.
                  </li>
                </ul>
              </div>
            </div>
            <Callout tone="neutral" icon={<Sparkles className="size-4" />}>
              <strong className="font-semibold text-ink">Design point:</strong> the interface is
              deliberately dense — 10–13px labels, tabular numerals, status dots and compact rows.
              ERP users compare columns, not hero sections. The visual system is a warm paper canvas
              with a single green brand accent so warnings and risk states stand out.
            </Callout>
          </Section>

          <Section
            id="architecture"
            number="02"
            title="Architecture at a glance"
            kicker="Rendering model"
          >
            <div className="rounded-card border border-line bg-surface p-4">
              <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
                <FlowNode
                  icon={<MonitorSmartphone className="size-4" />}
                  title="Browser request"
                  detail="Route, search params, or client fetch"
                />
                <FlowArrow />
                <FlowNode
                  icon={<Server className="size-4" />}
                  title="Server Components"
                  detail="Render layout and data on the server"
                  tone="brand"
                />
                <FlowArrow />
                <FlowNode
                  icon={<Layers3 className="size-4" />}
                  title="Cache layer"
                  detail="use cache · cacheLife · cacheTag"
                  tone="brand"
                />
              </div>
              <div className="my-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-line" />
                <span className="text-[9px] uppercase tracking-[0.12em] text-faint">
                  deterministic data source
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <FlowNode
                  icon={<Database className="size-4" />}
                  title="Seeded generator"
                  detail="5,000 POs · fixed 16 Nov 2026 anchor"
                />
                <FlowNode
                  icon={<Table2 className="size-4" />}
                  title="Client islands"
                  detail="Table, charts, editor, form"
                />
                <FlowNode
                  icon={<GitBranch className="size-4" />}
                  title="API route"
                  detail="GET JSON cache · POST Zod validation"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {BOUNDARIES.map((item) => (
                <div key={item.layer} className="rounded-lg border border-line bg-surface p-3.5">
                  <div className="flex items-center gap-2 text-[11.5px] font-semibold">
                    <span className="text-brand">{item.icon}</span>
                    {item.layer}
                  </div>
                  <p className="mt-1.5 text-[10.5px] leading-4 text-muted">{item.detail}</p>
                </div>
              ))}
            </div>

            <h3 className="mt-6 text-[13px] font-semibold">Where the server/client line sits</h3>
            <div className="mt-2 overflow-hidden rounded-lg border border-line">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-line bg-raised/60 text-[9px] uppercase tracking-[0.08em] text-faint">
                    <th className="px-3 py-2 font-medium">Surface</th>
                    <th className="px-3 py-2 font-medium">Rendered on</th>
                    <th className="px-3 py-2 font-medium">Why</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[
                    ["Dashboard KPIs, risk strip, buyer list", "Server", "No interaction; cached data and HTML."],
                    ["Orders toolbar + table", "Client", "Sorting, filtering, selection and virtualization."],
                    ["Charts", "Client, lazy", "Recharts needs DOM APIs; loaded after the shell."],
                    ["PO form", "Client island", "RHF state, localStorage draft and permission-checked API submit."],
                    ["Notes editor", "Client, on demand", "Tiptap is heavy and only needed when opened."],
                    ["Invoice", "Server + tiny client button", "Print document is static once data is fetched."],
                    ["Command palette", "Client", "Keyboard state and Radix dialog."],
                  ].map(([surface, side, why]) => (
                    <tr key={surface}>
                      <td className="px-3 py-2 font-medium">{surface}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-sunken px-1.5 py-0.5 text-[9.5px] text-muted">
                          {side}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted">{why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section
            id="data"
            number="03"
            title="Deterministic data, explicit caching"
            kicker="Data layer"
          >
            <p className="text-[12.5px] leading-6 text-muted">
              The data layer has two modes. With <Code>DATABASE_URL</Code>, Drizzle reads 5,000
              seeded rows from Neon Postgres. Without it, <Code>generateOrders()</Code> produces
              the identical deterministic book from a fixed anchor date and a mulberry32 PRNG.
              Both paths flow through the same cached functions, so the dashboard, explorer, detail
              pages and analytics cannot disagree with each other.
            </p>
            <CodeBlock
              title="src/lib/data/server.ts"
              code={`export async function getOrders() {
  "use cache";
  cacheLife("days");
  cacheTag("orders");
  return (await readDbOrders()) ?? generateOrders();
}

export async function getOrderDetail(id: string) {
  "use cache";
  cacheLife("days");
  cacheTag("orders", \`order-\${id}\`);
  const stored = await readDbDetail(id);
  if (stored) return stored;

  const order = (await getOrders()).find((item) => item.id === id);
  return order ? buildOrderDetail(order) : null;
}`}
            />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-line bg-raised/40 p-3.5">
                <p className="flex items-center gap-1.5 text-[11.5px] font-semibold">
                  <Workflow className="size-3.5 text-brand" />
                  What the cache buys
                </p>
                <ul className="mt-1.5 space-y-1.5 text-[10.5px] leading-4 text-muted">
                  <li>Dashboard refreshes hourly; the order book and detail records daily.</li>
                  <li>Partial prerendering ships a static shell while cached data streams in.</li>
                  <li>The POST route revalidates <Code>orders</Code> and the affected order tag after a write.</li>
                  <li>The JSON endpoint is cacheable too: <Code>/api/orders</Code> gets a one-day s-maxage.</li>
                </ul>
              </div>
              <div className="rounded-lg border border-line bg-raised/40 p-3.5">
                <p className="flex items-center gap-1.5 text-[11.5px] font-semibold">
                  <ShieldCheck className="size-3.5 text-brand" />
                  Why deterministic
                </p>
                <ul className="mt-1.5 space-y-1.5 text-[10.5px] leading-4 text-muted">
                  <li>No hydration drift between server HTML and client table rows.</li>
                  <li>Screenshots and reviewer feedback stay comparable over time.</li>
                  <li>The dataset is reproducible without shipping a 2 MB JSON fixture.</li>
                  <li>The same read interface serves Postgres rows scoped by active organization.</li>
                </ul>
              </div>
            </div>
            <Callout tone="warning" icon={<CircleAlert className="size-4" />}>
              <strong className="font-semibold text-ink">Honest boundary:</strong> with a database
              configured, created POs are real rows and the API returns{" "}
              <Code>persisted: true</Code>. Without <Code>DATABASE_URL</Code>, the same validated
              payload falls back to <Code>localStorage</Code> and returns{" "}
              <Code>persisted: false</Code>. Status changes are governed transitions with approvals
              and a before/after audit diff; auth with organization roles scopes every read and
              write. Concurrency control and enterprise SSO are still out of scope.
            </Callout>
          </Section>

          <Section
            id="grid"
            number="04"
            title="Five thousand rows, one window"
            kicker="The centrepiece"
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MiniStat value="5,000" label="rows in dataset" />
              <MiniStat value="~40" label="rows in DOM" />
              <MiniStat value="48 KB" label="gzip incremental JS" />
              <MiniStat value="0" label="per-filter round trips" />
            </div>
            <p className="mt-4 text-[12.5px] leading-6 text-muted">
              The order book fetches the full synthetic dataset once with SWR, then lets TanStack
              Table handle sorting, global filtering, row selection and column visibility. TanStack
              Virtual mounts only the visible window plus 12 rows of overscan. The result is a table
              that scrolls smoothly at 5,000 rows without giving up instant filtering.
            </p>
            <CodeBlock
              title="src/components/orders/explorer.tsx (abridged)"
              badge="client"
              code={`const deferredSearch = useDeferredValue(search);

const table = useReactTable({
  data: baseFiltered,
  columns: orderColumns,
  state: { sorting, rowSelection, columnVisibility, globalFilter: deferredSearch },
  getRowId: (row) => row.id,
  globalFilterFn: globalFilter,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
});

const virtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => rowHeight,
  overscan: 12,
});`}
            />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <BulletList
                title="Performance choices"
                items={[
                  "One fetch, then client filtering — no network waterfall per keystroke.",
                  "useDeferredValue keeps the input responsive while the 5k-row filter catches up.",
                  "Memoised base filters run before TanStack's row model; columns are module-level.",
                  "Sticky header, fixed row heights and skeleton states prevent layout shift.",
                  "Density preference persists through Zustand with skipHydration.",
                  "Filters are URL-addressable; a copied view link restores the queue.",
                ]}
              />
              <BulletList
                title="What this would need next"
                items={[
                  "Server-side pagination and indexed search beyond roughly 50k rows.",
                  "Server-side sort/filter for multi-tenant data and permissions.",
                  "Concurrency control and object-storage-backed attachments around the existing governed workflow.",
                  "Keyboard grid navigation and a proper column-resize model.",
                  "Automated performance budget checks in CI, not just one measured build.",
                ]}
              />
            </div>
            <Callout tone="neutral" icon={<Gauge className="size-4" />}>
              The 48 KB gzip delta is the measured page-specific JavaScript for{" "}
              <Code>/orders</Code> over the shared shell. That includes TanStack Table, TanStack
              Virtual, SWR and the explorer toolbar. The full route is 313 KB gzip; the shared
              baseline is 266 KB.
            </Callout>
          </Section>

          <Section
            id="forms"
            number="05"
            title="Forms that survive a refresh"
            kicker="Input & state"
          >
            <p className="text-[12.5px] leading-6 text-muted">
              The new-PO flow is a three-step form: buyer and terms, style lines, then review. One
              Zod schema validates each step in the browser and the same schema validates the POST
              body on the server. React Hook Form owns field state; Zustand persist owns the draft
              that has not been submitted yet.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-line bg-raised/40 p-3.5">
                <p className="flex items-center gap-1.5 text-[11.5px] font-semibold">
                  <Code2 className="size-3.5 text-brand" />
                  Shared schema
                </p>
                <p className="mt-1.5 text-[10.5px] leading-4 text-muted">
                  Quantity limits, price bounds, due-date rules and line counts are declared once.
                  The API returns 422 with field issues if a client bypasses the form.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-raised/40 p-3.5">
                <p className="flex items-center gap-1.5 text-[11.5px] font-semibold">
                  <Boxes className="size-3.5 text-brand" />
                  Recoverable drafts
                </p>
                <p className="mt-1.5 text-[10.5px] leading-4 text-muted">
                  Every change is debounced into a versioned Zustand store. Returning to the page
                  restores the draft after persistence hydrates — without overwriting it during SSR.
                </p>
              </div>
            </div>
            <Callout tone="brand" icon={<Sparkles className="size-4" />}>
              <strong className="font-semibold text-ink">
                A Cache Components edge case worth calling out:
              </strong>{" "}
              React Hook Form&apos;s <Code>useFieldArray</Code> calls{" "}
              <Code>crypto.randomUUID()</Code> during render. With Cache Components enabled, that
              is an unstable value in the prerendered shell and fails the build. Instead of
              disabling SSR for the entire form, the field array lives in a step component that only
              mounts after interaction. The page keeps its static shell; the random IDs are created
              on the client.
            </Callout>
            <div className="mt-4 rounded-lg border border-line bg-surface p-3.5">
              <p className="text-[11.5px] font-semibold">State ownership</p>
              <div className="mt-2 grid gap-2 text-[10.5px] sm:grid-cols-3">
                <StateCard
                  title="SWR / Axios"
                  text="SWR reads cached order JSON once; Axios posts validated PO mutations."
                />
                <StateCard
                  title="Zustand"
                  text="Drafts, local POs, notes, table density. Persisted with skipHydration."
                />
                <StateCard
                  title="URL"
                  text="Explorer filters are query params, so a filtered queue is shareable."
                />
              </div>
            </div>
          </Section>

          <Section
            id="bundle"
            number="06"
            title="Bundle budget, measured"
            kicker="JavaScript"
          >
            <p className="text-[12.5px] leading-6 text-muted">
              These numbers come from the production build HTML and its script graph, summed and
              gzipped at maximum compression. They are initial JS for each route — not a Lighthouse
              score and not a claim about field performance on low-end devices.
            </p>
            <div className="mt-3 overflow-hidden rounded-lg border border-line">
              <table className="w-full min-w-[520px] text-left text-[11px]">
                <thead>
                  <tr className="border-b border-line bg-raised/60 text-[9px] uppercase tracking-[0.08em] text-faint">
                    <th className="px-3 py-2 font-medium">Route</th>
                    <th className="px-3 py-2 text-right font-medium">Initial JS, gzip</th>
                    <th className="px-3 py-2 text-right font-medium">Over shared shell</th>
                    <th className="px-3 py-2 font-medium">Largest added dependency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {BUNDLE_ROWS.map((row) => (
                    <tr key={row.route}>
                      <td className="px-3 py-2">
                        <span className="block font-medium">{row.label}</span>
                        <span className="font-mono text-[9px] text-faint">{row.route}</span>
                      </td>
                      <td className="numeric px-3 py-2 text-right">{row.total} KB</td>
                      <td className="numeric px-3 py-2 text-right text-muted">+{row.delta} KB</td>
                      <td className="px-3 py-2 text-muted">{routeDependency(row.route)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-line bg-raised/40 p-3.5">
                <p className="text-[11.5px] font-semibold">Lazy chunks kept off the first load</p>
                <ul className="mt-1.5 space-y-1 text-[10.5px] leading-4 text-muted">
                  <li className="flex justify-between gap-2">
                    <span>Recharts (dashboard + analytics)</span>
                    <span className="numeric">~131 KB gzip</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Tiptap rich-text editor</span>
                    <span className="numeric">~134 KB gzip</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>DOMPurify, loaded with the editor</span>
                    <span className="numeric">~14 KB gzip</span>
                  </li>
                </ul>
                <p className="mt-2 text-[9.5px] leading-4 text-faint">
                  Recharts has three chunks in the build; the figure is the combined gzip size.
                  Tiptap is a single on-demand chunk.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-raised/40 p-3.5">
                <p className="text-[11.5px] font-semibold">Why the shared baseline is 266 KB</p>
                <p className="mt-1.5 text-[10.5px] leading-4 text-muted">
                  React 19, the App Router runtime, the persistent shell (sidebar, topbar, command
                  palette, toasts, theme provider, Better Auth session client) and Radix primitives are shared across routes.
                  The shell is interactive on every page, so it is a deliberate cost. Hiding it
                  behind a client-only boundary would trade a smaller first load for a visible
                  layout flash on every navigation.
                </p>
              </div>
            </div>
            <Callout tone="neutral" icon={<Gauge className="size-4" />}>
              The dashboard route adds only <strong className="text-ink">2.3 KB gzip</strong> beyond
              the shell because the KPI grid, risk table and buyer list are all Server Components.
              Its charts are lazy. That is the RSC boundary doing its job.
            </Callout>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <BrowserVitals />
              <div className="rounded-lg border border-line bg-raised/40 p-3.5">
                <p className="text-[11.5px] font-semibold">Why this panel exists</p>
                <p className="mt-1.5 text-[10.5px] leading-4 text-muted">
                  Lighthouse gives a repeatable lab run. <Code>web-vitals</Code> measures the browser
                  actually rendering this page. INP needs real interactions, so the panel records
                  it locally rather than inventing a field score. Targets: LCP 2.5 s, INP 200 ms,
                  CLS 0.1.
                </p>
              </div>
            </div>
          </Section>

          <Section
            id="print"
            number="07"
            title="A document, not a screenshot"
            kicker="Print output"
          >
            <p className="text-[12.5px] leading-6 text-muted">
              The invoice route renders a two-page A4 commercial invoice and packing list. Print
              styles hide the app shell, reset the content width, set 12 mm page margins and force a
              page break before the packing list. Colours are preserved with{" "}
              <Code>print-color-adjust: exact</Code>; the barcode, totals, amount in words and size
              allocation are computed from the same order record as the detail page.
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <PrintCard
                title="Commercial invoice"
                detail="Buyer, consignee, incoterm, line items, totals and declaration on page one."
              />
              <PrintCard
                title="Packing list"
                detail="Size/carton breakdown, weights, shipping marks and carton barcode on page two."
              />
              <PrintCard
                title="Browser print"
                detail="No PDF service or serverless chromium. Cmd/Ctrl+P produces the document."
              />
            </div>
            <Callout tone="warning" icon={<CircleAlert className="size-4" />}>
              The Code 39 SVG is generated server-side by <Code>bwip-js</Code> and is scannable. It
              is not a GS1/GTIN shipping label — a compliant label would still need GS1 validation
              and fixed symbology rules.
              The invoice is explicitly marked as synthetic and is not a negotiable document.
            </Callout>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/orders/PO-26-4001/invoice" target="_blank">
                  <FileText />
                  Open sample invoice
                </Link>
              </Button>
              <span className="text-[10px] text-faint">
                Use the packing-list link or scroll to page two.
              </span>
            </div>
          </Section>

          <Section
            id="quality"
            number="08"
            title="Interaction quality and accessibility"
            kicker="Details"
          >
            <div className="grid gap-2.5 sm:grid-cols-2">
              {[
                ["Skip link and landmarks", "A skip-to-content link, labelled navigation, main and footer regions."],
                ["Keyboard first", "Command palette on Cmd/Ctrl+K, visible focus rings, Radix dialogs and menus."],
                ["Semantic data grid", "role=table, aria-rowcount, aria-rowindex and aria-selected on virtualized rows."],
                ["Status not by colour alone", "Badges pair a dot with a label; risk rows also use text and priority."],
                ["Reduced motion", "Global prefers-reduced-motion rule collapses animation and smooth scrolling."],
                ["Empty and error states", "Every async surface has a loading skeleton, retry path and clear-filter action."],
                ["Hydration-safe local state", "Persist stores use skipHydration and explicit rehydration flags."],
                ["Honest demo actions", "Bulk actions and requisitions say they are demo-only; no fake success claims."],
                ["Automated flows", "Playwright checks the grid, form, print, prefill, auth and tenant flows."],
                ["Tenant boundaries", "Every read and write is scoped by organization_id and checked against a role."],
                ["Governed workflow", "Status transitions are validated, approval-gated and recorded with a diff."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-lg border border-line bg-surface px-3.5 py-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold">
                    <Check className="size-3.5 text-positive" />
                    {title}
                  </p>
                  <p className="mt-1 text-[10.5px] leading-4 text-muted">{body}</p>
                </div>
              ))}
            </div>
            <Callout tone="brand" icon={<Gauge className="size-4" />}>
              A local Lighthouse desktop run scored <strong className="text-ink">100</strong> for
              accessibility, best practices and SEO on all eight routes, and 95–100 for performance
              after tenant-aware server reads.
              Dashboard LCP is 0.28 s with CLS 0.005; the orders route is 0.26 s with CLS 0.012.
              Total Blocking Time was 50 ms and 70 ms respectively — an INP proxy, not a field INP
              measurement. The panel above records real browser metrics locally instead of claiming
              an aggregate.
            </Callout>
            <Callout tone="neutral" icon={<CircleAlert className="size-4" />}>
              This is a desktop-first ERP interface. Compact controls are 28–32px tall, which suits
              mouse and keyboard work but is below the 44px touch target recommended for phone-first
              products. Mobile gets a slide-over nav and horizontal table scrolling, but a real
              mobile operator app would need larger controls and a different information hierarchy.
            </Callout>
          </Section>

          <Section
            id="tradeoffs"
            number="09"
            title="Tradeoffs and what comes next"
            kicker="Judgement"
          >
            <div className="overflow-hidden rounded-lg border border-line">
              <table className="w-full min-w-[560px] text-left text-[11px]">
                <thead>
                  <tr className="border-b border-line bg-raised/60 text-[9px] uppercase tracking-[0.08em] text-faint">
                    <th className="px-3 py-2 font-medium">Decision</th>
                    <th className="px-3 py-2 font-medium">Payoff</th>
                    <th className="px-3 py-2 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[
                    [
                      "Seeded Postgres, generator fallback",
                      "Free Neon persistence with reproducible builds and no committed secrets.",
                      "Auth, roles and tenant scoping exist; concurrency control and SSO do not.",
                    ],
                    [
                      "Fetch-all then client filter",
                      "Instant filters and a small API surface.",
                      "Not appropriate for very large or permissioned datasets.",
                    ],
                    [
                      "Browser-local fallback",
                      "The create flow still works with no DATABASE_URL at all.",
                      "In fallback mode, clearing storage loses data.",
                    ],
                    [
                      "Localized React Compiler disables",
                      "TanStack Table and Virtual use mutable refs the compiler cannot prove safe.",
                      "Two intentional suppressions instead of rewriting library internals.",
                    ],
                    [
                      "Unit tests, no browser E2E yet",
                      "Vitest covers data builders, schema rules and invoice wording.",
                      "Playwright covers core flows; visual regression and CI budgets are still missing.",
                    ],
                  ].map(([decision, payoff, cost]) => (
                    <tr key={decision}>
                      <td className="px-3 py-2.5 font-medium">{decision}</td>
                      <td className="px-3 py-2.5 text-muted">{payoff}</td>
                      <td className="px-3 py-2.5 text-muted">{cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <BulletList
                title="If this became a real product"
                items={[
                  "Auth and environment branches around the Drizzle repository already in place.",
                  "Auth and role boundaries for merchandiser, factory and buyer views.",
                  "Concurrency control and object-storage-backed attachments for the governed workflow.",
                  "Server-side pagination, indexed search and permission-scoped queries.",
                  "Add visual regression and real-user INP collection beside the existing Playwright suite.",
                ]}
              />
              <BulletList
                title="What I deliberately left out"
                items={[
                  "An AI assistant panel that does not need to exist.",
                  "Fake login screens and fake integration logos.",
                  "A second design system or theme switcher beyond light/dark.",
                  "Charts on every page just to fill space.",
                  "Claims about field INP, user counts or synthetic benchmarks I cannot measure.",
                ]}
              />
            </div>

            <div className="mt-4 rounded-card border border-brand/20 bg-brand-soft/50 p-4 dark:bg-brand/[0.06]">
              <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-ink dark:text-brand">
                <ShieldCheck className="size-4" />
                Demo boundaries
              </p>
              <p className="mt-1.5 text-[10.5px] leading-5 text-muted">
                Weft is a portfolio project built to demonstrate front-end engineering. The
                manufacturer, buyers, suppliers, purchase orders, invoices and performance figures
                in the UI are synthetic, and nothing here is a real commercial document. All data
                shown in the workspace is generated from a fixed seed; browser-created records stay
                in this browser.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted">
                <span className="flex items-center gap-1">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                  command palette
                </span>
                <span className="flex items-center gap-1">
                  <Code>npm run build</Code>
                  verified
                </span>
                <span className="flex items-center gap-1">
                  <Code>npx tsc --noEmit</Code>
                  clean
                </span>
              </div>
            </div>
          </Section>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-[10.5px] text-faint">
            <span>Built as a front-end portfolio project · Next.js 16 · React 19 · TypeScript</span>
            <div className="flex items-center gap-3">
              <Link href="/orders" className="text-brand hover:underline">
                Explore the order book
              </Link>
              <Link href="/analytics" className="text-brand hover:underline">
                See analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({
  id,
  number,
  title,
  kicker,
  children,
}: {
  id: string;
  number: string;
  title: string;
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-line py-7 first:border-t-0 first:pt-5">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="font-mono text-[10px] text-faint">{number}</span>
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-brand">{kicker}</p>
          <h2 className="mt-0.5 text-[18px] font-semibold tracking-[-0.025em] md:text-[20px]">
            {title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-card border border-line bg-surface px-3 py-3">
      <p className="numeric text-[19px] font-semibold leading-none tracking-[-0.03em]">{value}</p>
      <p className="mt-1.5 text-[9.5px] uppercase tracking-[0.06em] text-faint">{label}</p>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-raised/40 px-3 py-2.5">
      <p className="numeric text-[16px] font-semibold leading-none">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.06em] text-faint">{label}</p>
    </div>
  );
}

function FlowNode({
  icon,
  title,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  tone?: "brand";
}) {
  return (
    <div
      className={
        tone === "brand"
          ? "rounded-lg border border-brand/25 bg-brand-soft/40 px-3 py-2.5 dark:bg-brand/[0.06]"
          : "rounded-lg border border-line bg-raised/40 px-3 py-2.5"
      }
    >
      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold">
        <span className="text-brand">{icon}</span>
        {title}
      </div>
      <p className="mt-0.5 text-[9.5px] leading-4 text-muted">{detail}</p>
    </div>
  );
}

function FlowArrow() {
  return (
    <div aria-hidden className="hidden items-center justify-center md:flex">
      <ArrowRight className="size-3.5 text-line-strong" />
    </div>
  );
}

function Callout({
  children,
  icon,
  tone,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  tone: "neutral" | "brand" | "warning";
}) {
  return (
    <div
      className={
        tone === "brand"
          ? "mt-4 flex items-start gap-2.5 rounded-lg border border-brand/20 bg-brand-soft/40 px-3.5 py-3 text-[10.5px] leading-5 text-muted dark:bg-brand/[0.06]"
          : tone === "warning"
            ? "mt-4 flex items-start gap-2.5 rounded-lg border border-amber-300/60 bg-amber-50/60 px-3.5 py-3 text-[10.5px] leading-5 text-muted dark:border-amber-500/20 dark:bg-amber-500/[0.06]"
            : "mt-4 flex items-start gap-2.5 rounded-lg border border-line bg-raised/40 px-3.5 py-3 text-[10.5px] leading-5 text-muted"
      }
    >
      <span className="mt-0.5 shrink-0 text-muted">{icon}</span>
      <div>{children}</div>
    </div>
  );
}

function CodeBlock({
  title,
  code,
  badge = "server",
}: {
  title: string;
  code: string;
  badge?: "server" | "client";
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-[#252d26] bg-[#101511]">
      <div className="flex items-center justify-between border-b border-[#252d26] px-3 py-1.5">
        <span className="font-mono text-[9px] text-[#8d988f]">{title}</span>
        <span className="text-[8.5px] uppercase tracking-[0.12em] text-[#8d988f]">{badge}</span>
      </div>
      <pre className="overflow-x-auto px-3.5 py-3 text-[10.5px] leading-5 text-[#dfe7df]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3.5">
      <p className="text-[11.5px] font-semibold">{title}</p>
      <ul className="mt-2 space-y-1.5 text-[10.5px] leading-4 text-muted">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-[7px] size-1 shrink-0 rounded-full bg-brand/60" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StateCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-line bg-raised/50 px-2.5 py-2">
      <p className="font-mono text-[9.5px] font-medium text-brand">{title}</p>
      <p className="mt-0.5 text-[9.5px] leading-4 text-muted">{text}</p>
    </div>
  );
}

function PrintCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold">
        <Printer className="size-3.5 text-brand" />
        {title}
      </div>
      <p className="mt-1 text-[10.5px] leading-4 text-muted">{detail}</p>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-sunken px-1 py-0.5 font-mono text-[9.5px] text-ink">
      {children}
    </code>
  );
}

function routeDependency(route: string) {
  switch (route) {
    case "/orders":
      return "TanStack Table + Virtual, SWR";
    case "/orders/new":
      return "React Hook Form, Zod, Radix Select";
    case "/orders/[id]":
      return "Tabs, dialogs, local stores";
    case "/orders/[id]/invoice":
      return "Client print button only";
    case "/materials":
      return "Filter table, Radix Checkbox";
    case "/analytics":
      return "Analytics shell; charts lazy";
    case "/architecture":
      return "Web Vitals panel";
    default:
      return "Server-rendered content";
  }
}
