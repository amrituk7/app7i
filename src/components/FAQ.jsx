import { useState } from "react";

const FAQS = [
  {
    q: "How does the 3-day trial work?",
    a: "Start using App7i immediately with full access to all features. No credit card required. After 3 days, choose your plan to continue.",
  },
  {
    q: "How do payments work?",
    a: "Currently you can track cash, card, and bank transfer payments manually. In-app payment collection via Stripe is coming soon.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel your subscription at any time from your account settings. Your access continues until the end of your billing period.",
  },
  {
    q: "How do students connect with me?",
    a: "Share your unique QR code or invite link. Students scan or click to connect with you and start booking lessons.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted and stored securely. We follow GDPR guidelines and never share your data with third parties.",
  },
  {
    q: "Can students see their progress?",
    a: "Yes. Students can view their lesson history, skill progress, and upcoming bookings through their own dashboard.",
  },
  {
    q: "Can I switch plans?",
    a: "Absolutely. Upgrade or downgrade at any time. Changes take effect on your next billing cycle.",
  },
  {
    q: "What is your refund policy?",
    a: "If you're not satisfied within the first 14 days of a paid subscription, contact us for a full refund.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="bg-white py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <div className="mt-12 space-y-4">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <span className="text-base font-medium text-slate-900 dark:text-white">{faq.q}</span>
                <svg
                  className={`h-5 w-5 flex-shrink-0 text-slate-500 transition-transform ${openIndex === i ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {openIndex === i && (
                <div className="border-t border-slate-200 px-5 pb-5 pt-4 dark:border-slate-700">
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
