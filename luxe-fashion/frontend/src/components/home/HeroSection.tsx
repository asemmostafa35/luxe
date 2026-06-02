'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const slides = [
  {
    headline: 'The New Season',
    sub: 'Spring / Summer 2026',
    body: 'Effortless silhouettes, considered fabrics, and timeless cuts for the contemporary wardrobe.',
    cta: 'Shop New Arrivals',
    href: '/new-arrivals',
  },
  {
    headline: 'Best Sellers',
    sub: 'Wardrobe Essentials',
    body: 'The pieces our community reaches for, season after season.',
    cta: 'Shop Best Sellers',
    href: '/best-sellers',
  },
];

export default function HeroSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, []);

  const s = slides[active];

  return (
    <section className="relative min-h-[85vh] flex items-center bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-800 dark:to-brand-900 transition-all duration-700 overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 w-full">
        <div className="max-w-2xl py-24">
          <p key={`sub-${active}`} className="label-small text-brand-500 dark:text-brand-400 mb-4 animate-fade-up">
            {s.sub}
          </p>
          <h1 key={`h-${active}`} className="section-title mb-6 animate-fade-up">
            {s.headline}
          </h1>
          <p key={`body-${active}`} className="text-brand-600 dark:text-brand-300 text-lg leading-relaxed mb-10 max-w-md animate-fade-up">
            {s.body}
          </p>
          <div className="flex items-center gap-6">
            <Link href={s.href} className="btn-primary flex items-center gap-3">
              {s.cta} <ArrowRight size={16} />
            </Link>
            <Link href="/shop" className="nav-link text-brand-700 dark:text-brand-300">
              Explore All
            </Link>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={`h-0.5 transition-all duration-500 ${i === active ? 'w-8 bg-brand-900 dark:bg-white' : 'w-4 bg-brand-400 dark:bg-brand-600'}`}
            aria-label={`Slide ${i + 1}`} />
        ))}
      </div>

      {/* Decorative panel */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:flex items-center justify-center bg-gradient-to-br from-brand-200 to-brand-300 dark:from-brand-700 dark:to-brand-800">
        <div
          className="text-[160px] font-serif font-light text-brand-300/40 dark:text-brand-600/30 select-none leading-none"
          aria-hidden="true"
        >
          Z
        </div>
      </div>
    </section>
  );
}
