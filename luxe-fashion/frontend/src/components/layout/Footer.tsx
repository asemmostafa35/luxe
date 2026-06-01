'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Instagram, Facebook, Twitter, Youtube, ArrowRight } from 'lucide-react';
import { newsletterApi } from '@/lib/api';
import toast from 'react-hot-toast';

const links = {
  shop: [
    { label: 'New Arrivals', href: '/new-arrivals' },
    { label: 'Best Sellers', href: '/best-sellers' },
    { label: 'All Products', href: '/shop' },
    { label: 'Categories', href: '/category' },
  ],
  help: [
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Order Tracking', href: '/order-tracking' },
    { label: 'About Us', href: '/about' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await newsletterApi.subscribe(email);
      toast.success('Subscribed successfully!');
      setEmail('');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-brand-950 text-brand-300 mt-24">
      {/* Newsletter */}
      <div className="border-b border-brand-800">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <p className="label-small text-brand-500 mb-3">Stay Connected</p>
            <h3 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
              Join the Inner Circle
            </h3>
            <p className="text-brand-400 mb-8 text-sm">
              Be the first to discover new collections, exclusive offers, and style inspiration.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-0 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 bg-transparent border-b border-brand-600 pb-3 text-white placeholder:text-brand-600 focus:outline-none focus:border-white transition-colors text-sm"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="pb-3 pl-4 text-white hover:text-brand-300 transition-colors disabled:opacity-50"
              >
                <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <Link href="/" className="font-serif text-3xl font-light tracking-[0.2em] uppercase text-white block mb-6">
              Luxe
            </Link>
            <p className="text-brand-500 text-sm leading-relaxed mb-8 max-w-xs">
              Premium contemporary fashion for the modern individual. Crafted with intention, worn with confidence.
            </p>
            <div className="flex gap-5">
              {[
                { Icon: Instagram, href: '#', label: 'Instagram' },
                { Icon: Facebook, href: '#', label: 'Facebook' },
                { Icon: Twitter, href: '#', label: 'Twitter' },
                { Icon: Youtube, href: '#', label: 'YouTube' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-brand-600 hover:text-white transition-colors"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs tracking-widest uppercase text-brand-500 mb-5 font-medium">Shop</p>
            <ul className="space-y-3">
              {links.shop.map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-brand-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs tracking-widest uppercase text-brand-500 mb-5 font-medium">Help</p>
            <ul className="space-y-3">
              {links.help.map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-brand-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs tracking-widest uppercase text-brand-500 mb-5 font-medium">Legal</p>
            <ul className="space-y-3">
              {links.legal.map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-brand-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-brand-800 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-brand-600 text-xs">
            © {new Date().getFullYear()} Luxe Fashion. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-brand-600 text-xs">
            <span>Free shipping over $100</span>
            <span>·</span>
            <span>30-day returns</span>
            <span>·</span>
            <span>Secure checkout</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
