#!/usr/bin/env node
/**
 * Staging/production-safe Stripe payment reconciliation (read + optional apply).
 *
 * Usage:
 *   node scripts/reconcile-stripe-payments.mjs              # report only
 *   node scripts/reconcile-stripe-payments.mjs --apply      # mark paid when Stripe confirms
 *
 * Requires: DATABASE_URL (or POSTGRES_URL), STRIPE_SECRET_KEY
 * Does not call live SMS. Does not invent amounts — uses Stripe + DB totals.
 */
import pg from 'pg';
import Stripe from 'stripe';

const APPLY = process.argv.includes('--apply');
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}
if (!stripeKey) {
  console.error('STRIPE_SECRET_KEY is required');
  process.exit(1);
}

const stripe = new Stripe(stripeKey);
const pool = new pg.Pool({ connectionString, max: 2 });

function fromStripeAmount(amount, currency) {
  const zeroDecimal = new Set(['jpy', 'krw', 'vnd']);
  const c = (currency || 'cad').toLowerCase();
  return zeroDecimal.has(c) ? amount : amount / 100;
}

async function main() {
  const { rows } = await pool.query(`
    SELECT id, order_number, total, currency, payment_status, metadata, created_at
    FROM orders
    WHERE payment_status IS DISTINCT FROM 'paid'
      AND (
        metadata ? 'stripe_payment_intent_id'
        OR created_at > NOW() - INTERVAL '14 days'
      )
    ORDER BY created_at DESC
    LIMIT 100
  `);

  console.log(`Scanning ${rows.length} unpaid/recent orders (apply=${APPLY})`);
  let mismatches = 0;
  let wouldPay = 0;
  let paid = 0;

  for (const order of rows) {
    const piId = order.metadata?.stripe_payment_intent_id;
    if (!piId) {
      console.log(`- ${order.order_number}: no PaymentIntent id (status=${order.payment_status})`);
      continue;
    }

    let intent;
    try {
      intent = await stripe.paymentIntents.retrieve(piId);
    } catch (err) {
      console.log(`- ${order.order_number}: Stripe retrieve failed: ${err.message}`);
      continue;
    }

    const paidAmount = fromStripeAmount(intent.amount_received || intent.amount, intent.currency);
    const expected = Number(order.total);
    const amountOk = Math.abs(paidAmount - expected) <= 0.01;

    if (intent.status === 'succeeded' && amountOk) {
      wouldPay++;
      console.log(`+ ${order.order_number}: Stripe succeeded, amounts match (${paidAmount})`);
      if (APPLY) {
        const { error } = await pool.query(
          `SELECT mark_order_paid($1, $2)`,
          [order.order_number, intent.id]
        ).catch((e) => ({ error: e }));
        if (error) {
          // Fallback direct update if RPC missing
          await pool.query(
            `UPDATE orders
             SET payment_status = 'paid',
                 status = CASE WHEN status = 'pending' THEN 'processing' ELSE status END,
                 metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('stripe_payment_intent_id', $2::text, 'reconciled_at', NOW()::text)
             WHERE id = $1 AND payment_status IS DISTINCT FROM 'paid'`,
            [order.id, intent.id]
          );
        }
        paid++;
        console.log(`  -> applied paid`);
      }
    } else if (intent.status === 'succeeded' && !amountOk) {
      mismatches++;
      console.log(
        `! ${order.order_number}: AMOUNT MISMATCH expected=${expected} got=${paidAmount} ${intent.currency}`
      );
    } else {
      console.log(`- ${order.order_number}: Stripe status=${intent.status}`);
    }
  }

  console.log(`Done. wouldPay=${wouldPay} applied=${paid} mismatches=${mismatches}`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => {});
  process.exit(1);
});
