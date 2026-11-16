# Weft — Enterprise Readiness Roadmap

This file tracks the work from a portfolio demo toward an enterprise-grade multi-tenant ERP. Tick a box only when the item is implemented, verified and deployed. Add a date and commit/PR reference beside completed items so the history is auditable.

**Status legend:** `[x]` done · `[~]` in progress · `[ ]` not started

---

## Foundation — complete (2026-11-16, `fc35733`)

- [x] Next.js 16 App Router, React 19, TypeScript, Tailwind v4
- [x] Deterministic 5,000-row order book with seeded fallback
- [x] RSC boundaries, Cache Components, tags and revalidation
- [x] Virtualized TanStack Table/Virtual explorer
- [x] RHF + Zod multi-step form with draft recovery
- [x] Zustand, SWR and Axios integration
- [x] Radix/shadcn-style accessible primitives
- [x] Lazy Tiptap and Recharts bundles
- [x] Two-page A4 invoice with generated Code 39 barcode
- [x] Neon Postgres persistence with Drizzle, seed script and migrations
- [x] Optimistic status mutation with audit trail
- [x] Browser-measured Web Vitals panel
- [x] Vitest unit suite and Playwright E2E suite in CI
- [x] GitHub → Vercel production/preview deploys
- [x] Lighthouse 100/100/100/100 on all reviewed routes

---

## Milestone 1 — Identity, tenancy and permissions `[x]` — `10999c0`

**Goal:** a user signs in, belongs to one or more organizations, and can only see and mutate data allowed by their role.

- [x] Install Better Auth with Drizzle adapter against Neon
- [x] Email/password sign-up and sign-in, plus sign-out
- [x] Session cookie config with cookie cache and route protection
- [x] Organization/tenant table and membership model
- [x] Roles: `owner`, `admin`, `merchandiser`, `factory`, `viewer`
- [x] Server-side permission helper (`getViewer`, `hasPermission`)
- [x] Scope all order/detail/material/analytics reads by `organizationId`
- [x] Scope all writes (PO create, status change) by tenant and role
- [x] Sign-in/sign-up UI and session-aware topbar
- [x] Seed a demo organization and demo user (`demo@weft.local` / `demo1234`)
- [x] E2E test: unauthenticated denial, sign-in, new-tenant isolation
- [x] Deploy with `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` configured

---

## Milestone 2 — Real workflow state machine `[~]`

**Goal:** replace the free status dropdown with a governed, auditable lifecycle.

- [x] Define allowed transitions and guards
- [x] Reject illegal transitions server-side
- [x] Approval records with approver, timestamp and comment
- [x] Immutable audit events with before/after diff
- [x] Notifications on transition (in-app toasts)
- [ ] Attachments via Neon Object Storage or Vercel Blob — needs object-storage credentials
- [x] UI for pending approvals and rejection reasons
- [x] E2E test for legal and illegal transitions

---

## Milestone 3 — Server-driven data at scale `[ ]`

**Goal:** make the explorer work on millions of rows, not just 5,000.

- [ ] Cursor pagination and server-side sorting/filtering
- [ ] Postgres indexes on tenant, status, buyer, factory and due date
- [ ] Full-text search (Postgres FTS or dedicated index)
- [ ] TanStack Table manual mode; keep virtualization
- [ ] Move CSV export to a background job
- [ ] Load-test 1M seeded rows
- [ ] Bundle and INP budgets in CI

---

## Milestone 4 — Inventory and MRP depth `[ ]`

**Goal:** make the ERP domain behave coherently across pages.

- [ ] Bill of materials per style
- [ ] Material reservations per PO
- [ ] Goods-in receipts that update stock
- [ ] Coverage recomputed from real orders and receipts
- [ ] Shortage detection linked to open POs
- [ ] Supplier lead times and reorder policies
- [ ] Landed cost: unit price + freight + duty
- [ ] E2E: creating/advancing a PO changes material coverage

---

## Milestone 5 — Documents and integrations `[ ]`

**Goal:** let other systems exchange data with Weft.

- [ ] GS1/GTIN validation and compliant SSCC labels
- [ ] Immutable invoice versions with history
- [ ] Purchase order and packing list PDFs
- [ ] OpenAPI spec for the REST API
- [ ] API keys or OAuth for machine clients
- [ ] Webhooks: `order.created`, `order.status_changed`, `material.low_stock`
- [ ] CSV/XLSX import with validation preview
- [ ] Idempotency keys and replay protection

---

## Milestone 6 — Operational excellence `[ ]`

**Goal:** debug and operate the app without guessing.

- [ ] Structured logs with request and tenant IDs
- [ ] OpenTelemetry/Vercel Tracing
- [ ] Error tracking and custom metrics
- [ ] Uptime checks and synthetic journeys
- [ ] Rate limiting and shared Redis storage
- [ ] CSP, CSRF and dependency scanning in CI
- [ ] Scheduled reminders for stale/at-risk orders
- [ ] Runbooks, ADRs and API reference
- [ ] Accessibility audit against WCAG 2.2 AA

---

## Milestone 7 — Commercial layer `[ ]`

**Goal:** a second organization can onboard and pay without manual intervention.

- [ ] Stripe subscriptions, seats and usage quotas
- [ ] Self-serve tenant onboarding
- [ ] Per-tenant branding and feature flags
- [ ] Admin console for support and impersonation
- [ ] Status page, terms and privacy policy
- [ ] Support flow and escalation runbook
- [ ] Customer-facing changelog

---

## Rules for updating this file

1. A milestone is only complete when every box under it is ticked.
2. Tick only after code, tests and deployment are verified.
3. Add the commit hash or PR next to completed milestones.
4. Do not add claimed customers, uptime, Lighthouse field data or revenue numbers.
5. Keep the portfolio story honest: this is engineering evidence, not fabricated business history.
