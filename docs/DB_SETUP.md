# Database setup (free tier)

Weft runs with or without a database. Without `DATABASE_URL`, it uses the deterministic generator and browser-local POs exactly as before. With `DATABASE_URL`, it reads 5,000 seeded orders from Postgres and persists newly created POs there.

## 1. Create a free Neon project

1. Sign up at https://neon.tech (free, no credit card).
2. Create a project, e.g. `weft-erp`.
3. Copy the **pooled** Postgres connection string from the dashboard. It looks like:

```text
postgresql://user:password@ep-xxx.region.aws.neon.tech/weft?sslmode=require
```

The free plan includes 1 GB storage and 100 compute-hours per month. Idle compute scales to zero after five minutes and wakes on the next query; projects are not deleted for inactivity.

## 2. Give the URL to the app locally

**Do not paste the URL into chat or commit it.** Create a file named `.env.local` in the project root:

```bash
# .env.local in the project root
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/weft?sslmode=require
```

`.env.local` is already ignored by Git.

## 3. Create tables and seed

```bash
npm run db:push
npm run db:seed
```

- `db:push` applies `src/lib/db/schema.ts` directly to Neon.
- `db:seed` inserts the same 5,000 generated POs, their details and 12 materials.
- The seed is idempotent: rerunning it will not duplicate rows.

Expected output ends with:

```text
Done. purchase_orders now has 5000 rows.
```

## 4. Verify locally

```bash
npm run dev
```

Create a purchase order. The detail page should now say it was saved to the database, and the API response should contain `meta.persisted: true`.

You can also check directly:

```bash
curl http://localhost:3000/api/orders | head -c 200
```

## 5. Deploy to Vercel

In Vercel, go to **Project → Settings → Environment Variables** and add:

```text
DATABASE_URL = postgresql://user:password@ep-xxx.region.aws.neon.tech/weft?sslmode=require
```

Apply it to **Production** (and Preview if you want preview deployments to use the DB), then redeploy.

Vercel rebuilds from source. It never uploads your local `.env.local` or `.next` folder.

## Behavior matrix

| `DATABASE_URL` | Reads | New POs |
| --- | --- | --- |
| Not set | Deterministic generator | Stored in `localStorage`, `persisted: false` |
| Set, DB reachable | Postgres via cached repository functions | Inserted into Postgres, `persisted: true` |
| Set, DB temporarily unreachable | Falls back to generator so the site stays up | API returns a clear `503` rather than pretending it saved |

## Changing the schema

After editing `src/lib/db/schema.ts`:

```bash
npm run db:generate
npm run db:push
```

Generated SQL migrations live in `drizzle/`.

## Troubleshooting

If Neon rejects the connection string as an invalid URL **only on Vercel**, it was probably stored with literal quote characters. Re-add the dotenv-parsed value:

```bash
node -e "require('dotenv').config({path:'.env.local'});process.stdout.write(process.env.DATABASE_URL)" \
  | vercel env add DATABASE_URL --environment production,preview,development --force --sensitive
```

`dotenv` strips surrounding quotes from `.env.local`; piping the raw line does not.

## Do not commit

Never commit:

- `.env.local`
- `.env`
- any file containing a connection string

The repository only contains the schema and migration SQL, never credentials.
