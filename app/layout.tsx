import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import "./globals.css";

const SITE_NAME = 'FITAURA';
const SITE_TAGLINE_SHORT = 'Confidence In Motion.';
const SITE_TAGLINE = 'Modern lifestyle clothing — gymwear, athleisure and fashion-forward apparel built to empower confidence and comfort. Designed in Calgary, shipping worldwide.';
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://shopfitaura.com';
const OG_IMAGE = `${SITE_URL}/og-image.png`;
const OG_IMAGE_SQUARE = `${SITE_URL}/og-image-square.png`;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FBF7F1' },
    { media: '(prefers-color-scheme: dark)', color: '#26261F' },
  ],
  colorScheme: 'light',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE_SHORT}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  generator: 'Next.js',
  creator: SITE_NAME,
  publisher: SITE_NAME,
  referrer: 'origin-when-cross-origin',
  keywords: [
    'FITAURA',
    'shopfitaura',
    'activewear Canada',
    'gymwear Canada',
    'athleisure Calgary',
    'leggings Canada',
    'sports bra Canada',
    'loungewear Calgary',
    'modern lifestyle clothing',
    'fashion-forward apparel',
    'Canadian clothing brand',
    'sustainable activewear',
    'Calgary fashion brand',
    'sculpting leggings',
    'seamless sports bra',
  ],
  category: 'shopping',
  classification: 'Ecommerce, Apparel, Activewear',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Next.js auto-injects <link rel="icon" href="/favicon.ico"> from
  // app/favicon.ico, so don't list it here (avoids duplicate tags).
  // The `?v=N` query bumps the browser's persistent favicon cache without
  // changing the file path. Increment when /public/favicon-*.png changes.
  icons: {
    icon: [
      { url: '/favicon-16x16.png?v=5', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png?v=5', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png?v=5', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192.png?v=5', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png?v=5', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=5', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon-167.png?v=5', sizes: '167x167', type: 'image/png' },
      { url: '/apple-touch-icon-152.png?v=5', sizes: '152x152', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icon-512.png', color: '#D14F2B' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
    startupImage: ['/apple-touch-icon.png'],
  },
  formatDetection: {
    telephone: true,
    email: false,
    address: false,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    alternateLocale: ['en_US', 'en_GB'],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE_SHORT}`,
    description: SITE_TAGLINE,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — modern lifestyle clothing built to empower confidence and comfort.`,
        type: 'image/png',
      },
      {
        url: OG_IMAGE_SQUARE,
        width: 1200,
        height: 1200,
        alt: SITE_NAME,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@fitaura_ca',
    creator: '@fitaura_ca',
    title: `${SITE_NAME} — ${SITE_TAGLINE_SHORT}`,
    description: SITE_TAGLINE,
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'en-CA': SITE_URL,
      'x-default': SITE_URL,
    },
  },
  // `other` is reserved for tags Next.js doesn't already render from the
  // canonical metadata fields above. Don't duplicate format-detection,
  // apple-mobile-web-app-*, or theme-color here — they're emitted from
  // formatDetection / appleWebApp / viewport respectively.
  other: {
    'msapplication-config': '/browserconfig.xml',
    'msapplication-TileColor': '#26261F',
    'msapplication-TileImage': '/mstile-150.png',
    'mobile-web-app-capable': 'yes',
    'pinterest-rich-pin': 'true',
  },
};

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  legalName: 'FITAURA',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/icon-512.png`,
    width: 512,
    height: 512,
  },
  image: OG_IMAGE,
  description: SITE_TAGLINE,
  foundingDate: '2026',
  founders: [{ '@type': 'Person', name: 'FITAURA Team' }],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Calgary',
    addressRegion: 'AB',
    addressCountry: 'CA',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+1-587-432-6761',
      contactType: 'customer service',
      email: 'hello@shopfitaura.com',
      areaServed: ['CA', 'US'],
      availableLanguage: ['en'],
    },
  ],
  sameAs: ['https://instagram.com/fitaura.ca'],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_TAGLINE,
  publisher: { '@id': `${SITE_URL}/#organization` },
  inLanguage: 'en-CA',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/shop?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const storeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  '@id': `${SITE_URL}/#store`,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_TAGLINE,
  image: OG_IMAGE,
  logo: `${SITE_URL}/icon-512.png`,
  paymentAccepted: ['Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay'],
  currenciesAccepted: 'CAD',
  parentOrganization: { '@id': `${SITE_URL}/#organization` },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Calgary',
    addressRegion: 'AB',
    addressCountry: 'CA',
  },
  areaServed: [{ '@type': 'Country', name: 'Canada' }, { '@type': 'Country', name: 'United States' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA">
      <head>
        {/* theme-color is emitted by the `viewport` export above; do not duplicate here. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
        ) : null}
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />

        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@4.1.0/fonts/remixicon.css"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router: fonts loaded in root layout apply to all pages */}
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />

        {/* Dev-only safety: on localhost, immediately unregister any leftover
            service worker and clear all caches. This runs synchronously before
            React hydration so stale SW-cached HTML can't cause mismatches. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var h=location.hostname;if(h==='localhost'||h==='127.0.0.1'||h==='0.0.0.0'){if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});});}if(typeof caches!=='undefined'){caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k);});});}if(!sessionStorage.getItem('__fitaura_dev_sw_cleared__')){sessionStorage.setItem('__fitaura_dev_sw_cleared__','1');setTimeout(function(){location.reload();},150);}}}catch(e){}})();`,
          }}
        />

        {/* Site-wide JSON-LD: Organization, WebSite (with sitelinks search), OnlineStore */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
        />
      </head>

      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {RECAPTCHA_SITE_KEY && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
          strategy="afterInteractive"
        />
      )}

      <body className="antialiased font-sans bg-cream-50 text-ink-700 overflow-x-hidden pwa-body">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[10000] focus:px-6 focus:py-3 focus:bg-sienna-500 focus:text-white focus:rounded-lg focus:font-semibold focus:shadow-lg"
        >
          Skip to main content
        </a>
        <CartProvider>
          <WishlistProvider>
            <div id="main-content">
              {children}
            </div>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
