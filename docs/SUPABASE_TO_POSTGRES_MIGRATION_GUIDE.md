# FITAURA — Supabase → plain Postgres cutover

**Shape:** A — shimmed `@supabase/supabase-js` → app `/rest/v1`, `/auth/v1`, `/storage/v1` + `DATABASE_URL`  
**Repo:** `katalambano878/fitaura`  
**Branch:** `staging/plain-postgres`  
**Coolify staging:** `fitaura-staging` (`s13ck4gvlrdleb1eyj4ebpth`)  
**Staging URL:** https://fitaura-staging.169-58-8-203.sslip.io  
**DB:** `fleet-postgres` / **`fitaura_staging`** (existing; not `store_*`)

See also: `FULL_SYSTEM_AUDIT.md`, `SUPABASE_TO_POSTGRES_MIGRATION_REPORT.md`, store hardening playbook on big-vps.

## Env cutover trio (set together in Coolify)

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `postgresql://…@fleet-postgres:5432/fitaura_staging` |
| `NEXT_PUBLIC_USE_PLAIN_PG` | `true` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fitaura-staging.169-58-8-203.sslip.io` (app origin, not `*.supabase.co`) |

Also required: `AUTH_JWT_SECRET`, `NEXT_PUBLIC_APP_URL`, `STORAGE_ROOT` / `STORAGE_PUBLIC_URL` / `STORAGE_SIGNING_SECRET`, `CRON_SECRET`, Resend + Stripe keys, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## Hardening notes (Jul 2026)

- [x] Phase A: `sw-v2.5-fitaura`, `lib/format-money.ts`, `app/error.tsx`, `app/admin/error.tsx`
- [x] Phase B: `images.unoptimized: true`; drop `*.supabase.co` / `via.placeholder.com` remotePatterns
- [x] Money paths → `money()` / `asNumber()` where prices display or export
- [x] Cron payment reminders → `supabaseAdmin`; **CRON_SECRET required**
- [x] Order history: Track / Reorder / Invoice / Help
- [x] REST ACL + storage write gates (`lib/db/rest-auth.ts`, `rest-acl.ts`)
- [x] Guest order lookup API (`/api/storefront/orders/lookup`)
- [x] Middleware admin fall-through closed
- [x] Stripe webhook paid-protection + metadata merge

## Verify (staging)

```bash
BASE=https://fitaura-staging.169-58-8-203.sslip.io
ssh big-vps "sudo docker ps --format '{{.Image}} {{.Status}}' | grep s13ck4g"
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/"
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/shop"
# After ACL deploy, orders must NOT be publicly listable:
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/rest/v1/orders?select=id&limit=1"
# expect 403
curl -s "$BASE/service-worker.js" | head -n 3
# expect sw-v2.5-fitaura in SW output
```
