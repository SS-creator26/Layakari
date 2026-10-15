# Layakari web app

The new Layakari site: a Next.js app that replaces the single `index.html` at the root of this repository.
It uses the same Supabase project for accounts, with normalised tables in place of the per-user JSON blobs.

Nothing here is live yet. `index.html` keeps serving layakari.ca until the cutover at the end of this file.

## What's inside

| Path | What it is |
| --- | --- |
| `app/` | Pages (App Router). Public: `/`, `/compositions`, `/compositions/[slug]`, `/taals/[taal]`, `/artists`, `/academies`, `/licensing`. Signed in: `/library`, `/academy`, `/studio`, `/profile`. |
| `components/` | UI pieces, each with its own CSS Module. `components/theka` is the player. |
| `lib/data` | Reads from Supabase (`public.ts` for anyone, `private.ts` for the signed-in person). |
| `lib/actions` | Server actions for every write: profile, compositions, choreographies, licences, academies. |
| `lib/theka` | The theka engine and its tests. |
| `supabase/migrations` | The schema, access rules and the importer that copies the old blobs into the new tables. |
| `supabase/tests` | SQL tests for the access rules and the importer. |
| `e2e` | Playwright tests for the main journeys. |

## Run it locally

Needs Node 20.9+ and PostgreSQL 16 (`apt install postgresql-16` or Homebrew `postgresql@16`).

```sh
cd web
npm install
npm run db:up                        # a private local Supabase on :54321, with seed data
npm run db:up | grep NEXT_PUBLIC_ > .env.local
echo NEXT_PUBLIC_SITE_URL=http://localhost:3000 >> .env.local
npm run dev
```

`db:up` downloads GoTrue and PostgREST once, starts them with Postgres behind a gateway that answers like a hosted
project, applies every migration and loads `supabase/seed.sql`. Sign in as any seed person with password
`layakari-demo`: `meera@`, `arjun@`, `nalini@`, `kabir@` or `asha@example.com`. `npm run db:reset` starts from scratch.

## Checks

```sh
npm run lint
npm run typecheck
npm test            # unit tests: licence ranks, revenue splits, theka timing
npm run test:db     # access rules and importer, against the local database
npm run db:reset && npm run build && npm run test:e2e
```

CI runs all of these on every pull request that touches `web/` (`.github/workflows/web.yml`).

## Environment variables

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | The Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The project's publishable (anon) key. Safe in the browser: access is enforced by the database rules. |
| `NEXT_PUBLIC_SITE_URL` | The public address, e.g. `https://layakari.ca`. Used for canonical links, the sitemap and email links. |

No service-role key is needed by the app.

## Setting up staging (owner)

These steps need accounts and credentials, so they are left for the owner.

1. **Staging database.** Create a second Supabase project (or a branch of the live one). Copy the live data into it,
   then apply the migrations in order with the SQL editor or `supabase db push`. Run the importer:
   `select public.layakari_import_legacy();` and compare the counts it returns with the old blobs.
   Re-running it is safe. The migration `20261015000000_legacy_blob_tables.sql` only creates the old tables if they
   are missing, so it does nothing to a copy of the live data.
2. **Auth settings.** In the staging project's Auth settings, add `https://<preview-domain>/auth/callback` to the
   redirect allow list, and set the Site URL.
3. **Vercel.** Import the repository, set the root directory to `web`, and add the three environment variables
   pointing at staging. Every pull request then gets a preview link.

## Cutover checklist (owner, not done yet)

1. Find out how layakari.ca is served today and who controls its DNS.
2. Put the old app into read-only mode for the switch, so nothing is written to the blobs mid-copy.
3. Apply the migrations to the live project and run `select public.layakari_import_legacy();`. Check the counts.
4. Add `https://layakari.ca/auth/callback` to the live project's redirect allow list.
5. Point the Vercel production environment at the live project and layakari.ca at Vercel.
6. Sign in with a few real accounts, check their licences, academies and compositions.
7. Keep `index.html` on a hidden address for a week as a fallback, then remove write access to the blob tables.

## Payments

Checkout is a demo: licences are recorded with `is_demo = true` and earnings update, but no money moves.
Real payments (Stripe) are a separate piece of work and will write into `licences.payment_ref`.
