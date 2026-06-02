import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy Policy — ZANE" };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-16">
      <h1 className="font-serif text-4xl font-light text-brand-900 dark:text-white mb-2">
        Privacy Policy
      </h1>
      <p className="text-brand-500 text-sm mb-10">Last updated: January 2026</p>
      <div className="prose prose-sm max-w-none space-y-8 text-brand-700 dark:text-brand-300 leading-relaxed">
        {[
          {
            h: "1. Information We Collect",
            p: "We collect information you provide directly to us, such as when you create an account, place an order, or contact us. This includes name, email address, postal address, phone number, and payment information. We also collect usage data automatically through cookies and similar technologies.",
          },
          {
            h: "2. How We Use Your Information",
            p: "We use your information to process orders and payments, communicate with you about your account and orders, send promotional communications (with your consent), improve our services, and comply with legal obligations.",
          },
          {
            h: "3. Information Sharing",
            p: "We do not sell your personal information. We share information with service providers who assist our operations (payment processors, shipping carriers, email services) under strict data processing agreements. We may disclose information when required by law.",
          },
          {
            h: "4. Data Security",
            p: "We implement industry-standard security measures including SSL encryption, secure payment processing via Stripe, and regular security audits. However, no method of transmission over the internet is 100% secure.",
          },
          {
            h: "5. Cookies",
            p: "We use cookies to maintain your session, remember preferences, and analyse site usage. You can control cookies through your browser settings. Some features may not function properly if cookies are disabled.",
          },
          {
            h: "6. Your Rights",
            p: "Depending on your location, you may have rights to access, correct, or delete your personal data; restrict or object to processing; and data portability. Contact us at hello@zanefashion.com to exercise these rights.",
          },
          {
            h: "7. Data Retention",
            p: "We retain your data for as long as your account is active or as needed to provide services. Order records are retained for 7 years for legal and tax purposes. You may request deletion of your account at any time.",
          },
          {
            h: "8. Contact Us",
            p: "For privacy-related questions, contact our team at hello@zanefashion.com or write to: ZANE, 123 Fashion Avenue, New York, NY 10001.",
          },
        ].map(({ h, p }) => (
          <div key={h}>
            <h2 className="font-serif text-xl font-light text-brand-900 dark:text-white mb-2">
              {h}
            </h2>
            <p>{p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
