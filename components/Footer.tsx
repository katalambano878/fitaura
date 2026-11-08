"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useCMS } from '@/context/CMSContext';

const SHOP_LINKS = [
  { label: 'New Arrivals', href: '/shop?sort=newest' },
  { label: 'Lounge / Lifestyle', href: '/shop?category=loungewear' },
  { label: 'Accessories', href: '/shop?category=accessories' },
  { label: 'Collections', href: '/categories' },
  { label: 'Activewear', href: '/shop?category=activewear' },
  { label: 'Best Sellers', href: '/shop?sort=bestsellers' },
];

const COMPANY_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Our Story', href: '/about' },
  { label: 'Sustainability', href: '/sustainability' },
  { label: 'Size Guide', href: '/size-guide' },
  { label: 'Care Guide', href: '/care-guide' },
  { label: 'Contact Us', href: '/contact' },
];

const HELP_LINKS = [
  { label: 'Shipping & Delivery', href: '/shipping' },
  { label: 'Returns & Exchanges', href: '/returns' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'Track Your Order', href: '/order-tracking' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

export default function Footer() {
  const { getSetting } = useCMS();
  const siteName = getSetting('site_name') || 'FITAURA';
  const tagline = getSetting('site_tagline') || 'Modern lifestyle clothing — gymwear, athleisure and fashion-forward apparel built to empower confidence and comfort.';
  const socialInstagram = getSetting('social_instagram') || 'https://instagram.com/fitaura.ca';
  const socialTiktok = getSetting('social_tiktok') || '#';
  const socialFacebook = getSetting('social_facebook') || '';
  const socialYoutube = getSetting('social_youtube') || '';
  const contactEmail = getSetting('contact_email') || 'hello@shopfitaura.com';
  const contactPhone = getSetting('contact_phone') || '+1 (587) 432-6761';
  const contactAddress = getSetting('contact_address') || 'Calgary, Alberta, Canada';

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setStatus('idle');
    try {
      await new Promise((r) => setTimeout(r, 800));
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-ink-900 text-cream-50 mt-16 lg:mt-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-12 lg:pt-14 pb-8">

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">

          {/* Brand column */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-2 max-w-sm">
            <Link href="/" className="inline-block mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- intentional <img> for crisp scaling of brand mark with transparency */}
              <img
                src="/fitaura-logo.png"
                alt={siteName}
                className="h-12 lg:h-14 w-auto object-contain select-none"
                draggable={false}
              />
            </Link>
            <p className="text-cream-100/60 leading-relaxed text-[13.5px]">
              {tagline}
            </p>

            <ul className="mt-5 space-y-1.5 text-cream-100/60 text-[13px]">
              <li className="flex items-start gap-3">
                <i className="ri-map-pin-2-line text-sienna-500 text-base shrink-0 mt-0.5" aria-hidden></i>
                <span>{contactAddress}</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="ri-phone-line text-sienna-500 text-base shrink-0 mt-0.5" aria-hidden></i>
                <a href={`tel:${contactPhone.replace(/[^0-9+]/g, '')}`} className="hover:text-cream-50 transition-colors">
                  {contactPhone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <i className="ri-mail-line text-sienna-500 text-base shrink-0 mt-0.5" aria-hidden></i>
                <a href={`mailto:${contactEmail}`} className="hover:text-cream-50 transition-colors">
                  {contactEmail}
                </a>
              </li>
            </ul>

            <div className="mt-5 flex gap-3">
              {[
                { link: socialInstagram, icon: 'ri-instagram-line', label: 'Instagram' },
                { link: socialTiktok, icon: 'ri-tiktok-fill', label: 'TikTok' },
                { link: 'https://pinterest.com', icon: 'ri-pinterest-line', label: 'Pinterest' },
                { link: contactEmail ? `mailto:${contactEmail}` : '', icon: 'ri-mail-line', label: 'Email' },
                ...(socialYoutube ? [{ link: socialYoutube, icon: 'ri-youtube-fill', label: 'YouTube' }] : []),
                ...(socialFacebook ? [{ link: socialFacebook, icon: 'ri-facebook-fill', label: 'Facebook' }] : []),
              ]
                .filter((s) => s.link)
                .map((s) => (
                  <a
                    key={s.label}
                    href={s.link}
                    target={s.link.startsWith('mailto:') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-9 h-9 rounded-full border border-cream-100/15 hover:border-sienna-500 text-cream-50 hover:text-sienna-500 flex items-center justify-center transition-colors"
                  >
                    <i className={`${s.icon} text-base`}></i>
                  </a>
                ))}
            </div>
          </div>

          {/* Shop */}
          <FooterColumn title="Shop">
            {SHOP_LINKS.map((l) => (
              <FooterLink key={l.href + l.label} href={l.href}>{l.label}</FooterLink>
            ))}
          </FooterColumn>

          {/* Company */}
          <FooterColumn title="Company">
            {COMPANY_LINKS.map((l) => (
              <FooterLink key={l.href + l.label} href={l.href}>{l.label}</FooterLink>
            ))}
          </FooterColumn>

          {/* Help */}
          <FooterColumn title="Help">
            {HELP_LINKS.map((l) => (
              <FooterLink key={l.href + l.label} href={l.href}>{l.label}</FooterLink>
            ))}
          </FooterColumn>
        </div>

        {/* Newsletter row */}
        <div className="mt-10 lg:mt-12 grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 pt-8 border-t border-cream-100/10">
          <div className="lg:col-span-2 max-w-sm">
            <h4 className="text-[11px] tracking-[0.22em] font-semibold uppercase text-cream-50 mb-3">Newsletter</h4>
            <p className="text-cream-100/60 text-[14px] leading-relaxed">
              Join our community and get 10% off your first order.
            </p>
          </div>
          <div className="lg:col-span-3 max-w-xl">
            <form onSubmit={handleSubmit} className="flex items-center border-b border-cream-100/20 focus-within:border-sienna-500 transition-colors">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 bg-transparent border-0 focus:ring-0 px-0 py-3 text-cream-50 placeholder:text-cream-100/40 text-[15px]"
                aria-label="Email address"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-2 -mr-2 w-10 h-10 flex items-center justify-center text-cream-50 hover:text-sienna-500 transition-colors disabled:opacity-50"
                aria-label="Subscribe to newsletter"
              >
                {submitting ? (
                  <i className="ri-loader-4-line animate-spin text-lg"></i>
                ) : (
                  <i className="ri-arrow-right-line text-xl"></i>
                )}
              </button>
            </form>
            {status === 'success' && (
              <p className="mt-3 text-[12px] tracking-[0.18em] uppercase text-sienna-500">
                Welcome to FITAURA — check your inbox.
              </p>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-cream-100/10 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] tracking-[0.2em] uppercase text-cream-100/40">
          <p>
            &copy; {new Date().getFullYear()} {siteName}. All rights reserved. &middot; Powered by{' '}
            <a href="https://doctorbarns.com" target="_blank" rel="noopener" className="hover:text-cream-50 hover:underline transition-colors">Doctor Barns Tech</a>
          </p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-cream-50 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-cream-50 transition-colors">Terms</Link>
            <Link href="/sitemap.xml" className="hover:text-cream-50 transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="lg:col-span-1">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between sm:cursor-default sm:pointer-events-none"
        aria-expanded={isOpen}
      >
        <h4 className="text-[11px] tracking-[0.22em] font-semibold uppercase text-cream-50">{title}</h4>
        <i className={`ri-arrow-down-s-line text-cream-100/40 text-lg sm:hidden transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>
      <ul
        className={`mt-4 space-y-2.5 text-[13.5px] text-cream-100/60 overflow-hidden transition-[max-height,opacity] duration-300 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        } sm:max-h-none sm:opacity-100`}
      >
        {children}
      </ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="hover:text-cream-50 transition-colors">
        {children}
      </Link>
    </li>
  );
}
