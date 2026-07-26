'use client';

import { money } from '@/lib/format-money';
import { useState } from 'react';
import Link from 'next/link';
import LazyImage from './LazyImage';
import { useCart } from '@/context/CartContext';
import { useCMS } from '@/context/CMSContext';

// Map common color names to hex values for swatches
const COLOR_MAP: Record<string, string> = {
  black: '#000000', white: '#FFFFFF', red: '#EF4444', blue: '#3B82F6',
  navy: '#1E3A5F', green: '#22C55E', yellow: '#EAB308', orange: '#F97316',
  pink: '#EC4899', purple: '#A855F7', brown: '#92400E', beige: '#D4C5A9',
  grey: '#6B7280', gray: '#6B7280', cream: '#FFFDD0', teal: '#14B8A6',
  maroon: '#800000', coral: '#FF7F50', burgundy: '#800020', olive: '#808000',
  tan: '#D2B48C', khaki: '#C3B091', charcoal: '#36454F', ivory: '#FFFFF0',
  gold: '#FFD700', silver: '#C0C0C0', rose: '#FF007F', lavender: '#E6E6FA',
  mint: '#98FB98', peach: '#FFDAB9', wine: '#722F37', denim: '#1560BD',
  nude: '#E3BC9A', camel: '#C19A6B', sage: '#BCB88A', rust: '#B7410E',
  mustard: '#FFDB58', plum: '#8E4585', lilac: '#C8A2C8', stone: '#928E85',
  sand: '#C2B280', taupe: '#483C32', mauve: '#E0B0FF', sky: '#87CEEB',
  forest: '#228B22', cobalt: '#0047AB', emerald: '#50C878', scarlet: '#FF2400',
  aqua: '#00FFFF', turquoise: '#40E0D0', indigo: '#4B0082', crimson: '#DC143C',
  magenta: '#FF00FF', cyan: '#00FFFF', chocolate: '#7B3F00', coffee: '#6F4E37',
  sienna: '#D14F2B',
};

export function getColorHex(colorName: string): string | null {
  const lower = colorName.toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

export interface ColorVariant {
  name: string;
  hex: string;
}

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  inStock?: boolean;
  maxStock?: number;
  moq?: number;
  hasVariants?: boolean;
  minVariantPrice?: number;
  colorVariants?: ColorVariant[];
}

export default function ProductCard({
  id,
  slug,
  name,
  price,
  originalPrice,
  image,
  badge,
  inStock = true,
  maxStock = 50,
  moq = 1,
  hasVariants = false,
  minVariantPrice,
  colorVariants = [],
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { getSetting } = useCMS();
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState(false);

  const displayPrice = hasVariants && minVariantPrice ? minVariantPrice : price;
  const discount = originalPrice ? Math.round((1 - displayPrice / originalPrice) * 100) : 0;
  const MAX_SWATCHES = 5;
  const symbol = getSetting('currency_symbol') || '$';
  const formatPrice = (val: number) => `${symbol}${money(val)}`;

  const onWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setWishlisted((w) => !w);
    try {
      const list = JSON.parse(localStorage.getItem('wishlist') || '[]') as string[];
      const idx = list.indexOf(id);
      if (idx === -1) list.push(id); else list.splice(idx, 1);
      localStorage.setItem('wishlist', JSON.stringify(list));
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch { /* ignore */ }
  };

  return (
    <article className="group flex flex-col h-full">
      <Link
        href={`/product/${slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-cream-100"
      >
        <LazyImage
          src={image}
          alt={name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Top-left badges */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 sm:gap-1.5">
          {badge && (
            <span className="bg-ink-900 text-cream-50 text-[8px] sm:text-[9px] tracking-[0.18em] sm:tracking-[0.2em] uppercase font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1">
              {badge}
            </span>
          )}
          {discount > 0 && (
            <span className="bg-sienna-500 text-cream-50 text-[8px] sm:text-[9px] tracking-[0.18em] sm:tracking-[0.2em] uppercase font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1">
              -{discount}%
            </span>
          )}
        </div>

        {/* Top-right: wishlist */}
        <button
          type="button"
          onClick={onWishlistClick}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-cream-50/95 hover:bg-cream-50 text-ink-700 hover:text-sienna-500 flex items-center justify-center transition-colors shadow-soft"
        >
          <i className={`${wishlisted ? 'ri-heart-fill text-sienna-500' : 'ri-heart-line'} text-xs sm:text-sm`}></i>
        </button>

        {/* Out of stock state */}
        {!inStock && (
          <div className="absolute inset-0 bg-cream-50/70 backdrop-blur-[1.5px] flex items-center justify-center">
            <span className="bg-ink-900 text-cream-50 px-3 py-1.5 sm:px-4 sm:py-2 text-[9px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.2em] uppercase font-semibold">
              Sold Out
            </span>
          </div>
        )}

        {/* Hover quick add (desktop only) */}
        {inStock && (
          <div className="hidden lg:block absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            {hasVariants ? (
              <span className="block w-full text-center bg-cream-50 hover:bg-ink-900 hover:text-cream-50 text-ink-900 py-3 text-[11px] tracking-[0.22em] uppercase font-semibold transition-colors">
                Select Options
              </span>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  addToCart({ id, name, price, image, quantity: moq, slug, maxStock, moq });
                }}
                className="w-full bg-cream-50 hover:bg-ink-900 hover:text-cream-50 text-ink-900 py-3 text-[11px] tracking-[0.22em] uppercase font-semibold transition-colors"
              >
                {moq > 1 ? `Add ${moq} to Bag` : 'Quick Add'}
              </button>
            )}
          </div>
        )}
      </Link>

      <div className="mt-3 sm:mt-4 px-0.5 sm:px-1 flex flex-col flex-grow">
        <Link href={`/product/${slug}`} className="block">
          <h3 className="text-[13px] sm:text-[15px] leading-snug text-ink-900 font-medium hover:text-sienna-500 transition-colors line-clamp-2">
            {name}
          </h3>
        </Link>

        <div className="mt-1 sm:mt-1.5 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
          <span className="text-[12px] sm:text-[14px] text-ink-700">
            {hasVariants && minVariantPrice ? `From ${formatPrice(minVariantPrice)}` : formatPrice(price)}
          </span>
          {originalPrice && originalPrice > displayPrice && (
            <span className="text-[11px] sm:text-[12px] text-ink-300 line-through">{formatPrice(originalPrice)}</span>
          )}
        </div>

        {colorVariants.length > 0 && (
          <div className="flex items-center gap-1 sm:gap-1.5 mt-2 sm:mt-3">
            {colorVariants.slice(0, MAX_SWATCHES).map((color) => (
              <button
                key={color.name}
                title={color.name}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveColor(activeColor === color.name ? null : color.name);
                }}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border transition-all duration-200 flex-shrink-0 ${
                  activeColor === color.name
                    ? 'ring-2 ring-offset-1 ring-sienna-500 scale-110'
                    : 'hover:scale-110'
                } ${color.hex === '#FFFFFF' ? 'border-ink-200' : 'border-ink-200/40'}`}
                style={{ backgroundColor: color.hex }}
                aria-label={`Color: ${color.name}`}
              />
            ))}
            {colorVariants.length > MAX_SWATCHES && (
              <span className="text-[10px] sm:text-[11px] text-ink-300 ml-0.5">+{colorVariants.length - MAX_SWATCHES}</span>
            )}
          </div>
        )}

        {/* Mobile add-to-bag */}
        <div className="mt-3 sm:mt-4 pt-0.5 sm:pt-1 lg:hidden">
          {hasVariants ? (
            <Link
              href={`/product/${slug}`}
              className="w-full inline-flex items-center justify-center border border-ink-200 hover:border-ink-900 text-ink-900 py-2 sm:py-2.5 text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.22em] uppercase font-semibold transition-colors"
            >
              Select Options
            </Link>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                addToCart({ id, name, price, image, quantity: moq, slug, maxStock, moq });
              }}
              disabled={!inStock}
              className="w-full border border-ink-200 hover:border-ink-900 text-ink-900 py-2 sm:py-2.5 text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.22em] uppercase font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {moq > 1 ? `Add ${moq} to Bag` : 'Add to Bag'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
