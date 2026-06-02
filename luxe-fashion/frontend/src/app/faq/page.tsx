import type { Metadata } from "next";
export const metadata: Metadata = { title: "FAQ — ZANE" };

const FAQS = [
  {
    q: "What is your return policy?",
    a: "We offer free returns within 30 days of delivery. Items must be unworn, unwashed, and in original condition with all tags attached. Sale items are final.",
  },
  {
    q: "How long does shipping take?",
    a: "Standard shipping takes 3–5 business days within the US. Express shipping (1–2 days) is available at checkout. Free standard shipping on orders over $100.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes, we ship to over 50 countries. International delivery takes 7–14 business days. Duties and taxes may apply depending on your location.",
  },
  {
    q: "How do I care for my garments?",
    a: "Care instructions are printed on each garment label. As a general guide: wash cold, gentle cycle; lay flat to dry delicates; store knitwear folded, never on a hanger.",
  },
  {
    q: "How does sizing work?",
    a: "We size true to standard. Our size guide on each product page includes measurements. If you're between sizes, we recommend sizing up for a relaxed fit or down for a closer fit.",
  },
  {
    q: "Can I change or cancel my order?",
    a: "Orders can be modified or cancelled within 1 hour of placement. After that, the order enters processing. Contact us immediately at hello@zanefashion.com.",
  },
  {
    q: "Are your products ethically made?",
    a: "Yes. All ZANE pieces are produced in certified facilities that meet our strict standards for fair wages, safe working conditions, and environmental responsibility.",
  },
  {
    q: "How do I track my order?",
    a: "You'll receive a tracking number by email once your order ships. You can also track your order on our Order Tracking page using your order number and email.",
  },
  {
    q: "Do you offer gift wrapping?",
    a: "Yes. Gift wrapping is available as an add-on at checkout. We use FSC-certified paper and plant-based inks. A personalised message can be included.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards, PayPal, and offer cash on delivery for eligible locations. All transactions are secured with SSL encryption.",
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-16">
      <div className="text-center mb-12">
        <p className="label-small text-brand-500 mb-3">Support</p>
        <h1 className="font-serif text-4xl md:text-5xl font-light text-brand-900 dark:text-white">
          Frequently Asked Questions
        </h1>
      </div>
      <div className="space-y-0">
        {FAQS.map(({ q, a }, i) => (
          <details
            key={i}
            className="group border-t border-brand-100 dark:border-brand-800 py-5 open:pb-5"
          >
            <summary className="flex items-center justify-between cursor-pointer list-none gap-4">
              <span className="font-medium text-brand-900 dark:text-white text-sm leading-relaxed">
                {q}
              </span>
              <span className="text-brand-400 group-open:rotate-45 transition-transform duration-200 text-xl leading-none flex-shrink-0">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-brand-600 dark:text-brand-400 leading-relaxed">
              {a}
            </p>
          </details>
        ))}
        <div className="border-t border-brand-100 dark:border-brand-800" />
      </div>
      <div className="mt-12 text-center bg-brand-50 dark:bg-brand-900 p-8">
        <p className="text-brand-600 dark:text-brand-400 mb-4 text-sm">
          Still have questions?
        </p>
        <a href="/contact" className="btn-primary text-xs inline-block">
          Contact Support
        </a>
      </div>
    </div>
  );
}
