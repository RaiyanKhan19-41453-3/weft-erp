# ADR 0001 — Self-hosted Better Auth in the app

**Status:** accepted · 2026-11-17

## Context

Weft needs authentication, organizations and roles so the demo can show tenant boundaries. We evaluated hosted identity providers and a self-hosted library.

## Decision

Use Better Auth with its Drizzle adapter against the same Neon Postgres database.

## Consequences

- User, session, account, organization and member tables live beside ERP data.
- No extra vendor credentials or marketplace integration are required.
- The app owns session cookie configuration, cookie cache and role definitions.
- Rate limiting is disabled at the auth layer; app-level shared rate limits live in `rate_limit_events`.
- Enterprise SSO and SCIM are not implemented.

## Alternatives

Clerk/Auth0 would reduce auth maintenance but add a vendor and external configuration that obscures the tenant model this project is meant to demonstrate.
