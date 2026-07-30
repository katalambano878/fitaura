import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendOrderConfirmation } from '@/lib/notifications';
import { getStripe, fromStripeAmount } from '@/lib/stripe';

/**
 * POST /api/payment/stripe/webhook
 *
 * Stripe → FITAURA webhook receiver.
 *
 * Configure this URL in your Stripe Dashboard:
 *   https://shopfitaura.com/api/payment/stripe/webhook
 *
 * Events handled:
 *   - payment_intent.succeeded → mark order paid + reduce stock + send notifs
 *   - payment_intent.payment_failed → mark order's payment_status = 'failed'
 *   - charge.refunded → mark order refunded/partially refunded
 *
 * Security: the raw body is verified against the STRIPE_WEBHOOK_SECRET.
 * Any request without a valid signature is rejected.
 *
 * Next.js note: we read `await req.text()` to get the raw payload so the
 * signature check stays byte-accurate.
 */
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ received: false, message: 'Webhook secret not configured' }, { status: 500 });
  }

  if (!sig) {
    return NextResponse.json({ received: false, message: 'Missing stripe-signature header' }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err?.message);
    return NextResponse.json({ received: false, message: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(intent);
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(intent);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }
      default:
        // No-op for events we don't care about. Returning 200 prevents
        // Stripe from retrying.
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`[Stripe Webhook] Handler error for ${event.type}:`, err?.message ?? err);
    // Return 500 so Stripe retries — handlers are idempotent.
    return NextResponse.json({ received: false, message: 'Handler error' }, { status: 500 });
  }
}

async function handlePaymentSucceeded(intent: Stripe.PaymentIntent) {
  const orderNumber =
    (intent.metadata?.order_number as string | undefined) ?? null;
  const orderId = (intent.metadata?.order_id as string | undefined) ?? null;

  if (!orderNumber && !orderId) {
    console.error('[Stripe Webhook] payment_intent.succeeded missing order metadata');
    return;
  }

  // Lookup the order so we can validate the amount before trusting it.
  let query = supabaseAdmin.from('orders').select('id, order_number, payment_status, total, currency');
  query = orderNumber ? query.eq('order_number', orderNumber) : query.eq('id', orderId!);
  const { data: order, error } = await query.single();

  if (error || !order) {
    console.error('[Stripe Webhook] Order not found:', orderNumber || orderId);
    return;
  }

  if (order.payment_status === 'paid') {
    console.log(`[Stripe Webhook] Order ${order.order_number} already paid — idempotent skip`);
    return;
  }

  const paidAmount = fromStripeAmount(intent.amount_received || intent.amount, intent.currency);
  if (Math.abs(paidAmount - Number(order.total)) > 0.01) {
    console.error(
      `[Stripe Webhook] AMOUNT MISMATCH on ${order.order_number}: expected ${order.total} ${order.currency}, got ${paidAmount} ${intent.currency}`,
    );
    return; // Refuse to mark as paid if the amounts don't reconcile.
  }

  const { data: orderJson, error: rpcError } = await supabaseAdmin.rpc('mark_order_paid', {
    order_ref: order.order_number,
    moolre_ref: intent.id, // backward-compat: stored as moolre_reference in metadata
  });

  if (rpcError) {
    console.error('[Stripe Webhook] mark_order_paid failed:', rpcError.message);
    throw rpcError;
  }

  // Update customer stats + send notifications (best-effort).
  if (orderJson?.email) {
    try {
      await supabaseAdmin.rpc('update_customer_stats', {
        p_customer_email: orderJson.email,
        p_order_total: orderJson.total,
      });
    } catch (e: any) {
      console.error('[Stripe Webhook] customer stats failed:', e?.message);
    }
  }

  try {
    if (orderJson) await sendOrderConfirmation(orderJson);
  } catch (e: any) {
    console.error('[Stripe Webhook] notification failed:', e?.message);
  }
}

async function handlePaymentFailed(intent: Stripe.PaymentIntent) {
  const orderNumber = (intent.metadata?.order_number as string | undefined) ?? null;
  if (!orderNumber) return;

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, payment_status, metadata')
    .eq('order_number', orderNumber)
    .single();

  // Never overwrite a successful payment with a delayed failure event.
  if (!order || order.payment_status === 'paid') return;

  await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'failed',
      metadata: {
        ...(order.metadata || {}),
        stripe_payment_intent_id: intent.id,
        failure_reason: intent.last_payment_error?.message ?? 'Payment failed',
      },
    })
    .eq('id', order.id)
    .neq('payment_status', 'paid');
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const orderNumber =
    (charge.metadata?.order_number as string | undefined) ??
    (typeof charge.payment_intent === 'string'
      ? null // we don't have the intent metadata expanded; look up below
      : (charge.payment_intent?.metadata?.order_number as string | undefined));

  // If we don't know the order number from the metadata, try to expand the PI.
  let lookupOrderNumber = orderNumber ?? null;
  if (!lookupOrderNumber && typeof charge.payment_intent === 'string') {
    try {
      const stripe = getStripe();
      const pi = await stripe.paymentIntents.retrieve(charge.payment_intent);
      lookupOrderNumber = (pi.metadata?.order_number as string | undefined) ?? null;
    } catch {
      /* swallow */
    }
  }

  if (!lookupOrderNumber) return;

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, metadata')
    .eq('order_number', lookupOrderNumber)
    .single();
  if (!order) return;

  const fullyRefunded = charge.amount_refunded >= charge.amount;
  await supabaseAdmin
    .from('orders')
    .update({
      payment_status: fullyRefunded ? 'refunded' : 'partially_refunded',
      metadata: {
        ...(order.metadata || {}),
        stripe_refund_amount: fromStripeAmount(charge.amount_refunded, charge.currency),
        stripe_last_refund_at: new Date().toISOString(),
      },
    })
    .eq('id', order.id);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Stripe webhook endpoint. POST signed events here.',
  });
}
