import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Terms & Conditions — Luxe Fashion' };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-16">
      <h1 className="font-serif text-4xl font-light text-brand-900 dark:text-white mb-2">Terms & Conditions</h1>
      <p className="text-brand-500 text-sm mb-10">Last updated: January 2026</p>
      <div className="prose prose-sm max-w-none space-y-8 text-brand-700 dark:text-brand-300 leading-relaxed">
        {[
          { h: '1. Acceptance of Terms', p: 'By accessing and using the Luxe Fashion website and services, you accept and agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.' },
          { h: '2. Account Registration', p: 'You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your password and for all activities that occur under your account.' },
          { h: '3. Orders and Payments', p: 'All orders are subject to availability and acceptance. Prices are in USD and subject to change. We reserve the right to refuse or cancel orders at our discretion. Payment is charged at the time of order placement.' },
          { h: '4. Shipping and Delivery', p: 'Delivery times are estimates only and not guaranteed. Risk of loss transfers to you upon delivery to the carrier. We are not responsible for delays caused by customs, weather, or carrier issues.' },
          { h: '5. Returns and Refunds', p: 'Items may be returned within 30 days of delivery in original, unworn condition. Refunds are processed within 5–10 business days to the original payment method. Shipping costs are non-refundable unless the return is due to our error.' },
          { h: '6. Intellectual Property', p: 'All content on this website, including images, text, logos, and designs, is owned by Luxe Fashion and protected by copyright law. You may not reproduce or use our content without written permission.' },
          { h: '7. Limitation of Liability', p: 'To the maximum extent permitted by law, Luxe Fashion shall not be liable for any indirect, incidental, or consequential damages arising from your use of our services.' },
          { h: '8. Governing Law', p: 'These terms are governed by the laws of the State of New York, USA. Disputes shall be resolved through binding arbitration in New York City.' },
        ].map(({ h, p }) => (
          <div key={h}>
            <h2 className="font-serif text-xl font-light text-brand-900 dark:text-white mb-2">{h}</h2>
            <p>{p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
