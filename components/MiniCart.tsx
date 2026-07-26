'use client';

import { money } from '@/lib/format-money';
import Link from 'next/link';
import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const { cart, removeFromCart, updateQuantity, subtotal } = useCart();

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      ></div>

      {/* `h-[100dvh]` uses dynamic viewport units so the drawer fills the
          full screen even when the mobile browser UI is showing/hiding.
          `flex flex-col` + min-h-0 on the scroller is what lets the product
          list take ALL leftover space without being collapsed by the footer. */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col h-[100dvh] slide-in-right">
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">
            Shopping Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})
          </h2>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-2xl text-gray-700"></i>
          </button>
        </header>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-full mb-4">
              <i className="ri-shopping-cart-line text-5xl text-gray-400"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">Add items to get started</p>
            <Link
              href="/shop"
              onClick={onClose}
              className="px-6 py-3 bg-sienna-500 text-white rounded-lg font-semibold hover:bg-sienna-600 transition-colors whitespace-nowrap cursor-pointer"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* `min-h-0` is critical — without it, flex children refuse to
                shrink below their content height and the scroll container
                collapses behind the footer instead of scrolling. */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5">
              <ul className="space-y-3.5">
                {cart.map((item) => (
                  <li
                    key={`${item.id}-${item.variant}`}
                    className="flex gap-3.5 bg-gray-50 rounded-xl p-3.5"
                  >
                    <div className="w-[88px] h-[110px] bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element -- runtime cart thumb */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 text-[15px]">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => removeFromCart(item.id, item.variant)}
                          aria-label={`Remove ${item.name} from cart`}
                          className="w-7 h-7 -mr-1 -mt-1 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                        >
                          <i className="ri-close-line text-lg"></i>
                        </button>
                      </div>

                      {item.variant && (
                        <p className="text-xs text-gray-500 mt-0.5 mb-auto pb-2">
                          {item.variant}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-1">
                        <div className="flex items-center border border-gray-300 rounded-full bg-white h-8">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.variant)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-l-full transition-colors cursor-pointer"
                            aria-label={item.quantity <= (item.moq || 1) ? 'Remove item' : 'Decrease quantity'}
                          >
                            {item.quantity <= (item.moq || 1) ? (
                              <i className="ri-delete-bin-line text-red-500 text-sm"></i>
                            ) : (
                              <i className="ri-subtract-line text-gray-700 text-sm"></i>
                            )}
                          </button>
                          <span className="w-7 text-center font-semibold text-gray-900 text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-r-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={item.quantity >= item.maxStock}
                            aria-label="Increase quantity"
                          >
                            <i className="ri-add-line text-gray-700 text-sm"></i>
                          </button>
                        </div>

                        <span className="text-base font-bold text-sienna-500">
                          ${money(item.price * item.quantity)}
                        </span>
                      </div>
                      {item.quantity >= item.maxStock && (
                        <p className="text-[11px] text-amber-600 mt-1">Max stock reached</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* `pb-[calc(env(safe-area-inset-bottom)+1.25rem)]` reserves space for
                the iOS home indicator / Android gesture bar / mobile browser
                chrome so the "View full cart" link is never clipped. */}
            <footer
              className="flex-shrink-0 border-t border-gray-200 px-5 pt-4 bg-white"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-700 font-medium text-sm">Subtotal</span>
                <span className="text-xl font-bold text-gray-900">${money(subtotal)}</span>
              </div>

              <p className="text-xs text-gray-500 mb-3">
                Shipping & taxes calculated at checkout
              </p>

              <Link
                href="/checkout"
                onClick={onClose}
                className="block w-full py-3.5 bg-sienna-500 text-white text-center rounded-lg font-semibold hover:bg-sienna-600 transition-colors whitespace-nowrap cursor-pointer"
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className="block w-full mt-2 py-2 text-gray-700 text-center text-sm font-medium hover:text-gray-900 underline underline-offset-4 decoration-gray-300 hover:decoration-gray-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                View full cart
              </Link>
            </footer>
          </>
        )}
      </div>
    </>
  );
}
