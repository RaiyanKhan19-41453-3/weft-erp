# Weft API reference

The machine-readable spec is served at `/api/openapi`. All endpoints are scoped to the active organization from the session or an `x-api-key`.

## Authentication

- Browser sessions use Better Auth cookies.
- Machine clients can create a key with `POST /api/settings/api-keys` (owner/admin only). The plaintext token is returned once.
- Send it as `x-api-key: wk_live_...`.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/orders` | Cached order list for the active tenant |
| POST | `/api/orders` | Create a PO; accepts `Idempotency-Key` |
| GET | `/api/orders/query` | Paged, sorted, filtered, full-text query; requires session or API key |
| POST | `/api/orders/{id}/status` | Governed transition; 202 means approval requested |
| POST | `/api/orders/{id}/invoices` | Create immutable invoice version |
| GET | `/api/orders/{id}/pdf` | Two-page invoice + packing list PDF |
| POST | `/api/orders/import` | CSV validation preview |
| POST | `/api/materials/{sku}/receipts` | Goods receipt; recalculates coverage |
| GET/POST | `/api/settings/api-keys` | List/create machine keys |
| POST | `/api/settings/webhooks` | Register HMAC-signed webhook |
| POST | `/api/errors` | Client error report |

## Webhooks

Events: `order.created`, `order.status_changed`. Each request includes:

- `X-Weft-Event`
- `X-Weft-Signature: sha256=<hmac-sha256(body, secret)>`

Verify the signature before trusting the payload.

## Idempotency

Send the same `Idempotency-Key` on retried `POST /api/orders` calls. The original response is replayed from `idempotency_keys`.

## Rate limits

Shared counters live in `rate_limit_events`. Defaults: query 120/min, import 30/min, client errors 20/min per IP.
