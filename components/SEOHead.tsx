import { money } from '@/lib/format-money';
import { Metadata } from 'next';

const SITE_NAME = 'FITAURA';
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://shopfitaura.com';
const DEFAULT_OG = `${SITE_URL}/og-image.png`;

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  url?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noindex?: boolean;
}

/**
 * Build per-page Next.js Metadata. Page-level metadata wins over the root
 * layout's defaults — keep titles concise (~60 chars) and descriptions under
 * 160 chars for the best SERP behavior.
 */
export function generateMetadata({
  title,
  description = 'Modern lifestyle clothing — gymwear, athleisure and fashion-forward apparel built to empower confidence and comfort.',
  keywords = [],
  ogImage,
  ogType = 'website',
  url,
  publishedTime,
  modifiedTime,
  author,
  noindex = false,
}: SEOProps): Metadata {
  const fullTitle = title
    ? (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`)
    : `${SITE_NAME} — Confidence In Motion.`;
  const canonical = url || SITE_URL;
  const resolvedOg = ogImage || DEFAULT_OG;

  const defaultKeywords = [
    'FITAURA',
    'activewear',
    'gymwear',
    'athleisure',
    'modern lifestyle clothing',
    'fashion-forward apparel',
    'Canadian clothing brand',
    'Calgary fashion',
  ];

  const meta: Metadata = {
    title: fullTitle,
    description,
    keywords: [...new Set([...keywords, ...defaultKeywords])].join(', '),
    authors: author ? [{ name: author }] : undefined,
    alternates: { canonical },
    openGraph: {
      type: ogType === 'product' ? 'website' : ogType,
      title: fullTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: 'en_CA',
      alternateLocale: ['en_US'],
      images: [{ url: resolvedOg, width: 1200, height: 630, alt: title || SITE_NAME }],
      ...(ogType === 'article' && publishedTime ? { publishedTime, modifiedTime, authors: author ? [author] : undefined } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [resolvedOg],
      site: '@fitaura_ca',
      creator: '@fitaura_ca',
    },
    robots: noindex
      ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
  };

  return meta;
}

/**
 * Schema.org Product JSON-LD. Pass the absolute product page URL — never read
 * `window.location` (it causes hydration mismatches and is undefined on the
 * server).
 */
export function generateProductSchema(product: {
  name: string;
  description: string;
  image: string | string[];
  url: string;
  price: number;
  currency?: string;
  sku: string;
  mpn?: string;
  gtin?: string;
  rating?: number;
  reviewCount?: number;
  availability?: 'in_stock' | 'out_of_stock' | 'preorder';
  brand?: string;
  category?: string;
  color?: string;
  size?: string;
  material?: string;
  priceValidUntil?: string;
}) {
  const images = Array.isArray(product.image) ? product.image : [product.image];
  const availabilityMap = {
    in_stock: 'https://schema.org/InStock',
    out_of_stock: 'https://schema.org/OutOfStock',
    preorder: 'https://schema.org/PreOrder',
  } as const;
  const priceValidUntil = product.priceValidUntil
    || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: images,
    url: product.url,
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand || SITE_NAME },
    offers: {
      '@type': 'Offer',
      url: product.url,
      price: money(product.price),
      priceCurrency: product.currency || 'CAD',
      availability: availabilityMap[product.availability || 'in_stock'],
      priceValidUntil,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'CA',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'CAD' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'CA' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 7, unitCode: 'DAY' },
        },
      },
    },
  };

  if (product.mpn) schema.mpn = product.mpn;
  if (product.gtin) schema.gtin = product.gtin;
  if (product.category) schema.category = product.category;
  if (product.color) schema.color = product.color;
  if (product.size) schema.size = product.size;
  if (product.material) schema.material = product.material;

  if (product.rating && product.reviewCount && product.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    image: `${SITE_URL}/og-image.png`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Calgary',
      addressRegion: 'AB',
      addressCountry: 'CA',
    },
    sameAs: ['https://instagram.com/fitaura.ca'],
  };
}

export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/shop?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateBlogPostingSchema(post: {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedTime: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.image || `${SITE_URL}/og-image.png`,
    url: post.url,
    datePublished: post.publishedTime,
    dateModified: post.modifiedTime || post.publishedTime,
    author: { '@type': 'Person', name: post.author || `${SITE_NAME} Editorial` },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon-512.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': post.url },
    keywords: post.tags?.join(', '),
  };
}

export function generateFAQSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function generateCollectionPageSchema(collection: {
  name: string;
  description: string;
  url: string;
  numberOfItems: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.name,
    description: collection.description,
    url: collection.url,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: collection.numberOfItems,
    },
  };
}

export function StructuredData({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
