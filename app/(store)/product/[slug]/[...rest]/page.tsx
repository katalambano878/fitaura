import { permanentRedirect } from 'next/navigation';
import { slugify, safeDecode } from '@/lib/slug';

// Legacy product URLs whose slug contained "/" (e.g. /product/flare-sculpt-onesie/jumpsuit)
// are folded into one clean slug and redirected to the real product page.
export default async function LegacyProductPath({
  params,
}: {
  params: Promise<{ slug: string; rest: string[] }>;
}) {
  const { slug, rest } = await params;
  const joined = [slug, ...(rest ?? [])].map(safeDecode).join('-');
  permanentRedirect(`/product/${slugify(joined)}`);
}
