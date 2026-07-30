# FITAURA — Supabase → Postgres Migration Report

**Shape:** A (shimmed supabase-js → app routes + `DATABASE_URL`)  
**Date:** 2026-07-30

## Feature matrix

| Supabase feature | Replacement | Status |
|------------------|-------------|--------|
| Postgres (hosted) | `fleet-postgres` / `fitaura_staging` via `pg` pool | Working on staging |
| PostgREST | `lib/db/supabase-compat.ts` + `/rest/v1` | Working; **ACL added** |
| Auth (GoTrue) | `lib/db/auth.ts` + `/auth/v1` (bcrypt + jose JWT) | Working |
| Storage | `lib/db/storage.ts` + `/storage/v1` local disk | Working; writes staff-gated |
| RLS | Application ACL (`rest-acl.ts`) + ownership `forceEq` | **Repaired** |
| Realtime | Not used in storefront | N/A |
| Edge functions | Next.js API routes | Migrated |
| RPC | `/rest/v1/rpc` → SQL functions / compat | Working; staff RPC gated |
| Service role | `supabaseAdmin` in-process when `DATABASE_URL` set | Working (lazy init) |

## Remaining Supabase references (intentional)

- `@supabase/supabase-js` browser client pointing at app origin
- `NEXT_PUBLIC_SUPABASE_*` env names kept for API compatibility
- `supabase/migrations/*.sql` as schema source
- Docs/scripts mentioning hosted Supabase for optional non-cutover mode

## Schema notes

Source: `supabase/migrations/20260209000000_complete_schema.sql` (+ later seeds).  
Staging DB name: **`fitaura_staging`** (guide previously said `store_fitaura` — corrected).

## Auth changes

- JWT secret via `AUTH_JWT_SECRET` / `JWT_SECRET` / `SUPABASE_JWT_SECRET`
- Roles in `profiles.role` mirrored into `app_metadata.role` on token issue
- Admin middleware verifies JWT in plain-PG mode

## Storage changes

- Files under `STORAGE_ROOT`
- Public URLs via `STORAGE_PUBLIC_URL` / app origin
- HMAC signed URLs for private objects

## Data integrity

- Staging REST previously exposed orders publicly — fixed in code (deploy required)
- Guest order access moved to `/api/storefront/orders/lookup` with email verification for track mode
