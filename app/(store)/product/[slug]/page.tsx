import { money } from '@/lib/format-money';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';
import {
  StructuredData,
  generateProductSchema,
  generateBreadcrumbSchema,
} from '@/components/SEOHead';
import { supabaseAdmin } from '@/lib/supabase-admin';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://shopfitaura.com';

interface ProductSEO {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  short_description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  category_name: string | null;
  images: { url: string; alt_text: string | null }[];
  in_stock: boolean;
  rating: number | null;
  review_count: number | null;
  tags: string[] | null;
}

async function getProductForSEO(slug: string): Promise<ProductSEO | null> {
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    let query = supabaseAdmin
      .from('products')
      .select(`
        id, slug, name, description, short_description, seo_title, seo_description,
        price, compare_at_price, sku, status, created_at, updated_at,
        rating_avg, review_count, quantity, tags,
        categories(name),
        product_images(url, alt_text, position)
      `);
    query = isUUID ? query.or(`id.eq.${slug},slug.eq.${slug}`) : query.eq('slug', slug);

    const { data, error } = await query.maybeSingle();
    if (error) {
      console.error('[product page] SEO fetch error:', error);
      return null;
    }
    if (!data) return null;

    const row = data as any;
    const images = (row.product_images || [])
      .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
      .map((img: any) => ({
        url: img.url?.startsWith('http') ? img.url : `${SITE_URL}${img.url}`,
        alt_text: img.alt_text || row.name,
      }));

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      short_description: row.short_description,
      seo_title: row.seo_title,
      seo_description: row.seo_description,
      price: Number(row.price ?? 0),
      compare_at_price: row.compare_at_price ? Number(row.compare_at_price) : null,
      sku: row.sku,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      category_name: row.categories?.name ?? null,
      images,
      in_stock: row.status === 'active' && Number(row.quantity ?? 0) > 0,
      rating: row.rating_avg ? Number(row.rating_avg) : null,
      review_count: row.review_count ? Number(row.review_count) : null,
      tags: row.tags ?? null,
    };
  } catch (err) {
    console.error('[product page] SEO fetch failed:', err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductForSEO(slug);

  if (!product) {
    return {
      title: 'Product not found',
      description: 'The product you are looking for is no longer available.',
      robots: { index: false, follow: true },
    };
  }

  const url = `${SITE_URL}/product/${product.slug}`;
  const shortDesc = product.seo_description
    || product.short_description
    || (product.description ? product.description.slice(0, 155).replace(/\s+\S*$/, '') + '…' : 'Modern lifestyle clothing built for confidence and comfort.');
  const description = `${shortDesc}${product.category_name ? ` | ${product.category_name}` : ''} | Free returns in Canada.`;
  const ogImage = product.images[0]?.url || `${SITE_URL}/og-image.png`;
  const titleSuffix = product.category_name ? ` — ${product.category_name}` : '';
  const rawTitle = product.seo_title || `${product.name}${titleSuffix}`;
  // If the SEO title already includes the brand suffix, bypass the root
  // template (`%s | FITAURA`) using `title.absolute` so we don't double-print.
  const title = /\bFITAURA\b/i.test(rawTitle)
    ? { absolute: rawTitle }
    : rawTitle;

  return {
    title,
    description: description.slice(0, 160),
    keywords: [
      product.name,
      product.category_name || 'activewear',
      ...(product.tags ?? []),
      'FITAURA',
      'shop FITAURA',
      'buy online',
      'Canada',
    ].filter(Boolean) as string[],
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: `${product.name} | FITAURA`,
      description: description.slice(0, 200),
      url,
      siteName: 'FITAURA',
      locale: 'en_CA',
      images: product.images.length > 0
        ? product.images.slice(0, 4).map((img) => ({
            url: img.url,
            alt: img.alt_text || product.name,
            width: 1200,
            height: 1200,
          }))
        : [{ url: `${SITE_URL}/og-image.png`, alt: product.name, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | FITAURA`,
      description: description.slice(0, 200),
      images: [ogImage],
      site: '@fitaura_ca',
    },
    other: {
      'product:price:amount': money(product.price),
      'product:price:currency': 'CAD',
      'product:availability': product.in_stock ? 'in stock' : 'out of stock',
      'product:brand': 'FITAURA',
      'product:condition': 'new',
      ...(product.category_name ? { 'product:category': product.category_name } : {}),
    },
    robots: product.status === 'active'
      ? { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } }
      : { index: false, follow: true },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductForSEO(slug);

  // Product JSON-LD + Breadcrumb JSON-LD. The interactive client renders below.
  let productSchema: unknown = null;
  let breadcrumbSchema: unknown = null;

  if (product) {
    const productUrl = `${SITE_URL}/product/${product.slug}`;
    productSchema = generateProductSchema({
      name: product.name,
      description: product.description || product.short_description || product.name,
      image: product.images.length > 0 ? product.images.map((i) => i.url) : [`${SITE_URL}/og-image.png`],
      url: productUrl,
      price: product.price,
      currency: 'CAD',
      sku: product.sku || product.id,
      brand: 'FITAURA',
      category: product.category_name || undefined,
      availability: product.in_stock ? 'in_stock' : 'out_of_stock',
      rating: product.rating || undefined,
      reviewCount: product.review_count || undefined,
    });
    breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: SITE_URL },
      { name: 'Shop', url: `${SITE_URL}/shop` },
      ...(product.category_name
        ? [{ name: product.category_name, url: `${SITE_URL}/shop?category=${encodeURIComponent(product.category_name.toLowerCase())}` }]
        : []),
      { name: product.name, url: productUrl },
    ]);
  } else {
    // We don't 404 here because the client still has retry/loading logic and
    // can present its own empty state. If you want a hard 404, swap to:
    //   notFound();
  }

  return (
    <>
      {productSchema ? <StructuredData data={productSchema} /> : null}
      {breadcrumbSchema ? <StructuredData data={breadcrumbSchema} /> : null}
      <ProductDetailClient slug={slug} />
    </>
  );
}

// Guard against `notFound` being unused TypeScript warning if we toggle behavior above
void notFound;
