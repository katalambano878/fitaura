# FITAURA — Repair Changelog (2026-07-30)

## Files added

- `lib/db/rest-auth.ts` — JWT/service/anon actor resolution
- `lib/db/rest-acl.ts` — table/RPC/storage ACL replacing RLS
- `app/api/storefront/orders/lookup/route.ts` — guest-safe order lookup
- `scripts/reconcile-stripe-payments.mjs` — Stripe reconciliation CLI
- `FULL_SYSTEM_AUDIT.md`
- `SUPABASE_TO_POSTGRES_MIGRATION_REPORT.md`
- `PAYMENT_AND_CALLBACK_AUDIT.md`
- `PERFORMANCE_REPORT.md`
- `REPAIR_CHANGELOG.md`

## Files modified

- `app/rest/v1/[table]/route.ts` — ACL + forceEq + privilege stripping
- `app/rest/v1/rpc/[fn]/route.ts` — RPC ACL + user_id spoof prevention
- `app/storage/v1/object/[bucket]/[...path]/route.ts` — staff-only writes, 15MB
- `middleware.ts` — no admin auth fall-through
- `lib/db/pool.ts` — pool error handler, connect timeout
- `lib/db/mode.ts` — production JWT secret required
- `lib/db/storage.ts` — production signing secret required
- `lib/supabase.ts` / `lib/supabase-admin.ts` — lazy clients for build safety
- `lib/notifications.ts` — supabaseAdmin, SMS timeout, FITAURA sender
- `app/api/cron/payment-reminders/route.ts` — CRON_SECRET required
- `app/api/payment/stripe/webhook/route.ts` — paid protection, metadata merge
- `app/(store)/order-tracking/page.tsx` — lookup API
- `app/(store)/pay/[orderId]/page.tsx` — lookup API
- `app/(store)/order-success/page.tsx` — lookup API
- `app/(store)/product/[slug]/page.tsx` — supabaseAdmin SEO fetch
- `app/sitemap.ts` — supabaseAdmin
- `app/layout.tsx` — remove hardcoded Supabase preconnect
- `.env.example` — plain-Postgres vars
- `docs/SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md` — DB name + hardening notes

## Bugs fixed

- Unauthenticated `/rest/v1` CRUD (orders/profiles leaked)
- Admin middleware could fall through without auth
- Cron open when `CRON_SECRET` unset
- Stripe failed webhook could overwrite paid / wipe metadata
- Server notifications queried via browser supabase client
- Build-time crash from eager admin client init
- Hardcoded legacy Supabase hostname in layout

## Packages

- None added/removed (`@supabase/supabase-js` retained for Shape A)

## Manual actions required

1. Commit + push `staging/plain-postgres` and redeploy Coolify `fitaura-staging`
2. Confirm Coolify env: `DATABASE_URL`, `NEXT_PUBLIC_USE_PLAIN_PG=true`, `NEXT_PUBLIC_SUPABASE_URL=<app origin>`
3. Set `AUTH_JWT_SECRET`, `STORAGE_SIGNING_SECRET`, `CRON_SECRET`
4. Confirm Stripe webhook endpoint + `STRIPE_WEBHOOK_SECRET`
5. After deploy: verify `/rest/v1/orders` returns 403 without staff JWT
6. Optional: `node scripts/reconcile-stripe-payments.mjs` (report) then `--apply`
