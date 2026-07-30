'use client';

import { money } from '@/lib/format-money';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePageTitle } from '@/hooks/usePageTitle';
import StripePaymentForm from '@/components/StripePaymentForm';

/**
 * /pay/[orderId]
 *
 * Standalone payment page used in two cases:
 *   1. The customer received a payment-link reminder (SMS/email) for an
 *      unpaid order and clicked through.
 *   2. The previous payment attempt failed and they want to retry.
 *
 * `[orderId]` accepts either the UUID `id` or the human `order_number`.
 */
export default function PaymentPage() {
  usePageTitle('Complete Payment');
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch('/api/storefront/orders/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'pay', orderId }),
        });
        const result = await res.json().catch(() => ({}));

        if (!res.ok || !result.success || !result.order) {
          setError(result.message || 'Order not found. Please check your link and try again.');
          setLoading(false);
          return;
        }

        const data = result.order;
        if (data.payment_status === 'paid') {
          router.push(`/order-success?order=${data.order_number}`);
          return;
        }

        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details.');
      } finally {
        setLoading(false);
      }
    }

    if (orderId) fetchOrder();
  }, [orderId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sienna-100 border-t-sienna-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ink-500">Loading order details…</p>
        </div>
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
            <i className="ri-error-warning-line text-4xl text-red-500" aria-hidden></i>
          </div>
          <h1 className="text-2xl font-bold text-ink-900 mb-3">Order Not Found</h1>
          <p className="text-ink-500 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-sienna-500 hover:bg-sienna-600 text-cream-50 rounded-lg font-semibold transition-colors"
          >
            <i className="ri-home-line mr-2" aria-hidden></i>
            Go to Homepage
          </Link>
        </div>
      </main>
    );
  }

  const shippingAddress = order?.shipping_address || {};
  const customerName = order?.metadata?.first_name || shippingAddress.firstName || 'Customer';
  const currency = (order?.currency || 'CAD').toUpperCase();

  return (
    <main className="min-h-screen bg-cream-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-display tracking-wide text-sienna-500">FITAURA</span>
          </Link>
          <span className="eyebrow mb-2 block">Complete Your Purchase</span>
          <h1 className="font-display text-3xl sm:text-4xl text-ink-900 tracking-tight">
            Hi {customerName} — let&rsquo;s wrap this up.
          </h1>
        </div>

        <div className="bg-white border border-cream-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-cream-200">
            <span className="text-sm text-ink-500">Order Number</span>
            <span className="font-mono font-semibold text-ink-900">{order?.order_number}</span>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Subtotal</span>
              <span className="text-ink-900">{currency} {money(order?.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Shipping</span>
              <span className="text-ink-900">{currency} {money(order?.shipping_total)}</span>
            </div>
            {order?.discount_total > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Discount</span>
                <span className="text-green-600">−{currency} {money(order?.discount_total)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-cream-200">
            <span className="text-lg font-semibold text-ink-900">Total</span>
            <span className="text-2xl font-bold text-sienna-500">{currency} {money(order?.total)}</span>
          </div>
        </div>

        {order?.payment_status === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <i className="ri-error-warning-line text-xl text-red-600 mt-0.5" aria-hidden></i>
              <div>
                <p className="text-sm font-semibold text-red-800">Previous attempt failed</p>
                <p className="text-sm text-red-700 mt-1">
                  Your last payment didn&rsquo;t go through. Try again below — your card was not charged.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-cream-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-ink-900 mb-4">Payment</h2>
          <StripePaymentForm
            orderNumber={order.order_number}
            total={Number(order.total)}
            currency={order.currency || 'CAD'}
            returnUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/order-success?order=${order.order_number}&payment_success=true`}
          />
        </div>

        <div className="text-center">
          <p className="text-sm text-ink-500">
            Having issues?{' '}
            <Link href="/contact" className="text-sienna-500 hover:underline font-medium">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
