# FITAURA — Performance Report

**Measured:** 2026-07-30 against staging `https://fitaura-staging.169-58-8-203.sslip.io`

## Baseline timings

| Page | TTFB-ish full response | Notes |
|------|------------------------|-------|
| `/` | ~1808 ms | Heavy CMS + product sections |
| `/shop` | ~701 ms | Acceptable |

## Confirmed issues

### Freezing / UX
- Guest pages previously depended on open REST; after ACL, private reads must use lookup API (avoids hung/failed silent queries once ACL deploys).
- Order-success waited 3s for webhook before verify — intentional, not a freeze; button states otherwise OK.
- SMS `fetch` had no timeout — could block notification handlers; **15s AbortController added**.

### Database
- Shared `pg` pool (`PG_POOL_MAX` default 10) with idle error handler + 10s connect timeout.
- Storefront products/categories use dedicated cached API routes (good).
- Admin analytics still loads large order sets client-side — paginate before large catalogs grow.

### Rendering / bundles
- Production build succeeds (74 routes).
- Middleware ~64.5 kB (jose + supabase-js path) — acceptable; plain-PG path avoids remote getUser.
- `images.unoptimized: true` for Coolify (documented hardening).
- Homepage first-load JS ~169 kB shared + page chunks.

### API
- Notifications used browser supabase client on server (extra HTTP hop) → switched to `supabaseAdmin` (in-process).
- Product SEO + sitemap → `supabaseAdmin` (no public HTTP round-trip during SSR).

## Recommendations

1. Add composite indexes on `orders(payment_status, created_at)` and `orders(order_number)` if not present (check staging with `\d orders`).
2. Paginate admin order/product lists (limit + cursor).
3. Consider CDN in front of Coolify for static assets.
4. Replace remaining browser REST private reads with server APIs over time (reduce Shape A surface).
