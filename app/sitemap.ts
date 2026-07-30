import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://shopfitaura.com';

type SitemapEntry = MetadataRoute.Sitemap[number];

const STATIC_PAGES: SitemapEntry[] = [
  { url: SITE_URL,                       lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
  { url: `${SITE_URL}/shop`,             lastModified: new Date(), changeFrequency: 'daily',   priority: 0.95 },
  { url: `${SITE_URL}/categories`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.85 },
  { url: `${SITE_URL}/about`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${SITE_URL}/contact`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.65 },
  { url: `${SITE_URL}/blog`,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
  { url: `${SITE_URL}/faqs`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${SITE_URL}/shipping`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${SITE_URL}/returns`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.45 },
  { url: `${SITE_URL}/sustainability`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: `${SITE_URL}/size-guide`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.55 },
  { url: `${SITE_URL}/care-guide`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${SITE_URL}/privacy`,          lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  { url: `${SITE_URL}/terms`,            lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamic: SitemapEntry[] = [];

  try {
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('slug, updated_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (products) {
      for (const p of products) {
        dynamic.push({
          url: `${SITE_URL}/product/${p.slug}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }

    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('slug, updated_at')
      .eq('status', 'active')
      .order('position', { ascending: true });

    if (categories) {
      for (const c of categories) {
        dynamic.push({
          url: `${SITE_URL}/shop?category=${encodeURIComponent(c.slug)}`,
          lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.75,
        });
      }
    }

    const { data: posts } = await supabaseAdmin
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1000);

    if (posts) {
      for (const post of posts) {
        dynamic.push({
          url: `${SITE_URL}/blog/${post.slug}`,
          lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      }
    }
  } catch (error) {
    console.error('[sitemap] Error fetching dynamic entries:', error);
  }

  return [...STATIC_PAGES, ...dynamic];
}
