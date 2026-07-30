# FITAURA — Full System Audit & Repair Report

**Date:** 2026-07-30  
**Branch:** `staging/plain-postgres`  
**Staging:** https://fitaura-staging.169-58-8-203.sslip.io  
**Database:** `fitaura_staging` on `fleet-postgres` (not `store_fitaura`)

---

## Baseline (before repairs)

| Check | Result |
|-------|--------|
| Git branch | `staging/plain-postgres` (up to date with origin) |
| Coolify app | `fitaura-staging` running:healthy |
| Homepage | HTTP 200 (~1.8s) |
| Shop | HTTP 200 (~0.7s) |
| Storefront APIs | `/api/storefront/products` + `categories` 200 |
| Auth health | `/auth/v1/health` 200 |
| Admin unauthenticated | 307 → `/admin/login` |
| **Critical:** `/rest/v1/orders` | **200 with order rows (open CRUD, no RLS)** |
| **Critical:** `/rest/v1/profiles` | **200 (PII exposure risk)** |
| Payment gateways in code | **Stripe only** (not Moolre/Hubtel/Paystack payments) |
| SMS | Moolre SMS only |
| Architecture | Shape A: `@supabase/supabase-js` → app `/rest|/auth|/storage` + `pg` pool |

---

## Architecture summary

```
Browser / Admin UI
  └── @supabase/supabase-js (lib/supabase.ts)
        └── NEXT_PUBLIC_SUPABASE_URL = app origin
              ├── /auth/v1/*     → lib/db/auth.ts
              ├── /rest/v1/*     → lib/db/supabase-compat.ts + REST ACL
              └── /storage/v1/*  → lib/db/storage.ts (local disk)

Server APIs / SSR
  └── lib/supabase-admin.ts → in-process pg compat when DATABASE_URL set

Payments: Stripe (create-intent → Elements → webhook + verify fallback)
SMS: Moolre API
Email: Resend
```

---

## Route inventory

### Public storefront (~30 pages)
`/`, `/shop`, `/categories`, `/product/[slug]`, `/cart`, `/checkout`, `/pay/[orderId]`, `/order-success`, `/order-tracking`, `/wishlist`, `/auth/*`, `/account*`, `/blog*`, `/about`, `/contact`, `/faqs`, `/help*`, `/terms`, `/privacy`, `/shipping`, `/returns*`, `/size-guide`, `/care-guide`, `/sustainability`, `/support/*`, `/pwa-settings`, `/offline`, `/maintenance`

**Baseline status:** All returned 200 on staging. Guest order pages previously read orders via open REST (security defect).

### Admin (~20 pages)
`/admin`, `/admin/login`, `/admin/orders*`, `/admin/products*`, `/admin/pos`, `/admin/customers*`, `/admin/categories`, `/admin/coupons`, `/admin/inventory`, `/admin/analytics`, `/admin/customer-insights`, `/admin/reviews`, `/admin/banners`, `/admin/blog`, `/admin/content`, `/admin/settings`, `/admin/modules`, `/admin/notifications`, `/admin/test-sms`

**Baseline status:** Unauthenticated access correctly redirected (307). Middleware fall-through risk repaired for hosted-Supabase path.

### API / shim routes
| Route | Purpose | Auth |
|-------|---------|------|
| `/api/storefront/products` | Cached catalog | Public |
| `/api/storefront/categories` | Cached categories | Public |
| `/api/storefront/orders/lookup` | Guest track/pay/success | Rate-limited + email for track |
| `/api/payment/stripe/*` | Intent / webhook / verify | Webhook signature; verify rate-limited |
| `/api/notifications` | Email/SMS dispatch | Server |
| `/api/cron/payment-reminders` | Unpaid reminders | **CRON_SECRET required** |
| `/api/recaptcha/verify` | Captcha | Public POST |
| `/api/admin/products/import*` | CSV/ZIP import | Admin |
| `/rest/v1/[table]` | PostgREST shim | **REST ACL (new)** |
| `/rest/v1/rpc/[fn]` | RPC shim | **RPC ACL (new)** |
| `/auth/v1/*` | GoTrue shim | Public auth flows |
| `/storage/v1/*` | Local storage | **Writes staff-only (new)** |

---

## Root causes of migration breakage / risk

1. **RLS not enforced** — Postgres pool user bypasses Supabase RLS; `/rest/v1` had no application ACL.
2. **Open order/profile reads** — anyone could list orders and profiles over HTTP.
3. **Middleware admin fall-through** — missing service key or thrown errors could allow admin HTML through.
4. **Optional CRON_SECRET** — reminders endpoint was open when unset.
5. **Dev JWT/storage defaults** — forgeable tokens if secrets omitted in production.
6. **Docs/env drift** — guide referenced `store_fitaura`; actual DB is `fitaura_staging`. Prompt assumed Moolre/Hubtel/Paystack payments; app uses **Stripe**.
7. **Server paths using browser client** — notifications and SEO/sitemap created fragile HTTP round-trips.

---

## Fixes applied (this session)

- REST auth + ACL (`lib/db/rest-auth.ts`, `lib/db/rest-acl.ts`) with ownership `forceEq`
- Storage write authorization + 15MB limit
- Guest order lookup API + storefront pages updated (track / pay / success)
- Middleware always redirects unauthenticated admin
- Cron requires `CRON_SECRET`
- Production fail-fast for JWT + storage signing secrets
- Pool idle-error handler + connection timeout
- Notifications → `supabaseAdmin`; SMS 15s timeout; senderid `FITAURA`
- Stripe webhook: no failed overwrite of paid; metadata merge on fail/refund
- Product SEO + sitemap → `supabaseAdmin`
- Removed hardcoded Supabase project preconnect
- Updated `.env.example`
- Added `scripts/reconcile-stripe-payments.mjs`

---

## Remaining risks

1. **Deploy required** — ACL is not live on staging until push/redeploy.
2. Shape A still depends on `@supabase/supabase-js` in the browser; long-term prefer direct server APIs for private data.
3. Guest `/pay/[orderId]` remains knowledge-of-link based (order number/UUID).
4. `/account` is client-gated only (page shell loads without server redirect).
5. In-memory rate limits do not share across Coolify replicas.
6. No Hubtel/Paystack code exists — do not configure those gateways without new implementation.

---

## Production readiness

**Ready after listed manual actions** (deploy ACL, confirm Coolify env trio + secrets, register Stripe webhook, set `CRON_SECRET`).
