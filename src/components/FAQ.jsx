import { useState } from "react";

const faqs = [
  { q: "How does the 3-day free trial work?", a: "Start using App7i immediately with full access to all features. Your trial lasts 3 days, after which you'll be charged based on your selected plan. Cancel anytime during the trial and you won't be charged." },
  { q: "How do payments work?", a: "All payments are securely processed through Stripe. We accept all major credit and debit cards. Your payment details are never stored on our servers." },
  { q: "Can I cancel anytime?", a: "Yes. There are no long-term contracts. You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period." },
  { q: "Is my data secure?", a: "Absolutely. We use industry-standard encryption and security practices. Your data is stored securely on UK/EU servers and is never shared with third parties." },
  { q: "Can my students access their progress?", a: "Yes. Each student gets their own portal login where they can view upcoming lessons, track their progress, see messages from you, and manage their bookings." },
  { q: "Can I switch between monthly and yearly billing?", a: "Yes, you can change your billing plan at any time. If you switch to yearly, you'll receive the discounted rate immediately. Switching to monthly takes effect at your next billing date." },
  { q: "What happens to my data if I cancel?", a: "Your data remains available for 30 days after cancellation. You can export all your student records, lesson history, and financial data before your account is fully closed." },
  { q: "Do you offer refunds?", a: "If you're not satisfied within the first 14 days of your paid subscription, contact us for a full refund. After 14 days, we offer prorated refunds for yearly plans." },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="bg-[#FAF8F5] py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#5C7A5C]">FAQ</p>
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-[#2D3B2D] tracking-tight">Frequently asked questions</h2>
          <p className="mt-4 text-lg text-[#5C5347]">Everything you need to know about App7i.</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white border border-[#E8E4DD] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <button onClick={() => setOpenIndex(openIndex === index ? null : index)} className="w-full flex items-center justify-between p-5 text-left">
                <span className="font-medium text-[#2D3B2D]">{faq.q}</span>
                <svg className={`w-5 h-5 text-[#5C5347] shrink-0 transition-transform ${openIndex === index ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && <div className="px-5 pb-5 text-[#5C5347] leading-relaxed">{faq.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
