import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import { getStripe, toStripeAmount } from '@/lib/stripe';


/**
 * An order id or number as typed by the visitor, safe to put inside a
 * PostgREST or() filter: only letters, digits, "-" and "_" (so a value like
 * "x,email.ilike.someone@example.com" cannot add its own conditions).
 * Anything else matches no order.
 */
function safeOrderRef(v: unknown): string {
  const s = String(v ?? "").trim();
  return /^[A-Za-z0-9_-]{1,80}$/.test(s) ? s : "00000000-0000-0000-0000-000000000000";
}

/**
 * POST /api/payment/stripe/create-intent
 *
 * Creates (or retrieves) a Stripe PaymentIntent for the given order.
 * - The amount is ALWAYS taken from the database — never from the client.
 * - If a PaymentIntent already exists on the order's metadata and is still
 *   usable, we return the existing client_secret instead of creating a new
 *   intent (idempotency + cheaper).
 */
export async function POST(req: Request) {
  try {
    const clientId = getClientIdentifier(req);
    const rl = checkRateLimit(`stripe-intent:${clientId}`, RATE_LIMITS.payment);
    if (!rl.success) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'X-RateLimit-Reset': rl.resetIn.toString() } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { orderId } = body as { orderId?: string };

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid orderId' },
        { status: 400 },
      );
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, total, currency, email, payment_status, metadata')
      .or(`id.eq.${safeOrderRef(orderId)},order_number.eq.${safeOrderRef(orderId)}`)
      .single();

    if (error || !order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ success: false, message: 'Order is already paid' }, { status: 400 });
    }

    const amount = Number(order.total);
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid order amount' }, { status: 400 });
    }

    const currency = (order.currency || 'CAD').toLowerCase();
    const stripe = getStripe();

    // Re-use the existing PaymentIntent when possible. If the amount has
    // changed we update it (Stripe permits PI updates while status is
    // `requires_payment_method` or `requires_confirmation`).
    const existingId: string | undefined = order.metadata?.stripe_payment_intent_id;
    if (existingId) {
      try {
        const existing = await stripe.paymentIntents.retrieve(existingId);
        if (existing.status === 'requires_payment_method' || existing.status === 'requires_confirmation') {
          const stripeAmount = toStripeAmount(amount, currency);
          if (existing.amount !== stripeAmount || existing.currency !== currency) {
            const updated = await stripe.paymentIntents.update(existingId, {
              amount: stripeAmount,
              currency,
            });
            return NextResponse.json({
              success: true,
              clientSecret: updated.client_secret,
              paymentIntentId: updated.id,
            });
          }
          return NextResponse.json({
            success: true,
            clientSecret: existing.client_secret,
            paymentIntentId: existing.id,
          });
        }
      } catch {
        // Fall through to creating a new intent.
      }
    }

    const intent = await stripe.paymentIntents.create({
      amount: toStripeAmount(amount, currency),
      currency,
      receipt_email: order.email || undefined,
      automatic_payment_methods: { enabled: true },
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        source: 'fitaura-storefront',
      },
      description: `FITAURA order ${order.order_number}`,
    });

    // Persist the intent id so the webhook can find the order quickly
    // and so a retry returns the same intent rather than minting a new one.
    await supabaseAdmin
      .from('orders')
      .update({
        payment_method: 'stripe',
        payment_provider: 'stripe',
        metadata: {
          ...(order.metadata || {}),
          stripe_payment_intent_id: intent.id,
        },
      })
      .eq('id', order.id);

    return NextResponse.json({
      success: true,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    });
  } catch (err: any) {
    console.error('[Stripe] create-intent error:', err?.message ?? err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}
