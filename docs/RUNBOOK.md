# Weft Runbook

## Production URLs

- App: https://weft-erp.vercel.app
- OpenAPI: https://weft-erp.vercel.app/api/openapi
- Neon project: `aged-wave-27893698` (Singapore)

## Health checks

`/.github/workflows/uptime.yml` checks `/`, `/orders`, `/api/openapi` and `/api/auth/ok` every 30 minutes. For manual checks:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://weft-erp.vercel.app/api/auth/ok
```

## Common symptoms

| Symptom | First checks |
| --- | --- |
| 401 on mutations | Session expired or API key missing/revoked; sign in again. |
| 403 on mutations | Role lacks permission; check `member.role` in Neon. |
| 503 from DB routes | `DATABASE_URL` missing or Neon compute unreachable; check Vercel env vars and Neon status. |
| 422 on status change | Illegal transition; see `src/lib/workflow.ts`. |
| 202 on shipment | Approval required; owner/admin decides in Timeline tab. |
| Stale material numbers | Revalidate tag `materials-<orgId>`; check `getMaterials` cache. |
| 429 | Shared rate limit exceeded; inspect `rate_limit_events`. |

## Deploy

Push to `main`. Vercel builds and deploys automatically. CI runs typecheck, lint, unit tests, build, bundle budgets, dependency audit and E2E.

## Database migrations

```bash
npm run db:generate
npm run db:push
npm run db:seed   # idempotent
```

Never commit `.env.local`. Secrets live in Vercel environment variables.

## Scheduled job

`api/order-reminders.ts` runs daily via Vercel Schedules. It logs at-risk orders in production with structured JSON. Use `vercel schedules invoke order-reminders` to run it manually.
