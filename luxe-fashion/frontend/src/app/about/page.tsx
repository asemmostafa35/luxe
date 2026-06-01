import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'About Us — Luxe Fashion' };

export default function AboutPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-16">
      <div className="max-w-3xl mx-auto">
        <p className="label-small text-brand-500 mb-3">Our Story</p>
        <h1 className="font-serif text-5xl md:text-6xl font-light text-brand-900 dark:text-white mb-8 leading-tight">About Luxe Fashion</h1>

        <div className="prose prose-brand max-w-none space-y-6 text-brand-700 dark:text-brand-300 text-[16px] leading-relaxed">
          <p>Founded in 2018, Luxe Fashion was born from a simple conviction: that premium clothing should be accessible, enduring, and made with integrity. We set out to create a brand where every piece is worth owning for a lifetime.</p>
          <p>We work with independent mills and artisan manufacturers across Europe and Asia, selecting fabrics and production partners based on quality, sustainability, and fair labour practices. Every collection is designed in-house, with a focus on versatile silhouettes that transcend seasonal trends.</p>
          <p>Our design philosophy is one of restraint — of choosing the right fabric, the right cut, and the right detail rather than the loudest. The result is a wardrobe of considered pieces that work together and age gracefully.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {[
            { num: '2018', label: 'Founded' },
            { num: '50+', label: 'Countries Served' },
            { num: '100%', label: 'Ethically Produced' },
          ].map(({ num, label }) => (
            <div key={label} className="text-center border border-brand-100 dark:border-brand-800 p-8">
              <p className="font-serif text-5xl font-light text-brand-900 dark:text-white mb-2">{num}</p>
              <p className="label-small text-brand-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link href="/contact" className="btn-outline inline-flex items-center gap-2">Get in Touch</Link>
        </div>
      </div>
    </div>
  );
}
