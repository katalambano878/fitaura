# FITAURA — Payment & Callback Audit

**Payment gateway in production code: Stripe only.**  
Moolre is used for **SMS**, not payments. Hubtel and Paystack are **not implemented**.

---

## Stripe flow

1. Checkout creates order (`payment_status=pending`, amount server-side later).
2. `POST /api/payment/stripe/create-intent` loads order from DB, amount from `orders.total` only.
3. Stripe Elements confirms PaymentIntent in browser.
4. Redirect → `/order-success?order=…&payment_success=true`.
5. Stripe webhook `POST /api/payment/stripe/webhook` (signature required).
6. Handler verifies amount vs DB; calls `mark_order_paid` (idempotent).
7. Fallback: `POST /api/payment/stripe/verify` re-checks PaymentIntent with Stripe API.

| Control | Status |
|---------|--------|
| Initiation | OK — server amount |
| Redirect alone confirms payment | **No** — webhook/verify required |
| Callback / webhook | `/api/payment/stripe/webhook` |
| Signature verification | `stripe.webhooks.constructEvent` |
| Amount validation | ±0.01 vs `orders.total` |
| Duplicate protection | Skip if already `paid` |
| Failed after paid | Blocked (webhook update) |
| Metadata merge on fail/refund | OK |
| Reconciliation | `scripts/reconcile-stripe-payments.mjs` |

### Env

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Register webhook URL: `https://YOUR_DOMAIN/api/payment/stripe/webhook`  
Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

---

## Moolre payment

**Not present.** Legacy docs (`SETUP.md`, `SMS_INTEGRATION_STATUS.md`) mention removed `/api/payment/moolre/*` routes. Do not configure Moolre payment callbacks.

---

## Hubtel

**Not present.** No routes, adapters, or env usage.

---

## Paystack

**Not present.** No routes, adapters, or env usage.

---

## Guest order pages (post-ACL)

| Page | Lookup |
|------|--------|
| `/order-tracking` | `POST /api/storefront/orders/lookup` mode=`track` (order + email) |
| `/pay/[orderId]` | mode=`pay` |
| `/order-success` | mode=`success` (+ Stripe verify fallback) |
