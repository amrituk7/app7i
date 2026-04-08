import { useState } from "react";

const items = [
  {
    question: "How does 3-day trial work?",
    answer: "Start with full access for 3 days. Stripe collects payment details securely, and billing begins only after the trial ends unless you cancel first.",
  },
  {
    question: "How do payments work?",
    answer: "Payments run through Stripe. You manage billing from your account and receive a clear subscription flow before any charge is taken.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. There are no long-term contracts. Cancel from your account settings and access remains until the end of the billing period.",
  },
  {
    question: "How do students connect?",
    answer: "Students scan your QR code or use your instructor link, then connect to your profile without a long setup process.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes. App7i uses authenticated access, protected infrastructure, and standard security controls for instructor and student data.",
  },
  {
    question: "Can students access progress?",
    answer: "Yes. The student side can view progress, updates, and relevant lesson information tied to the instructor account.",
  },
  {
    question: "Can I switch plans?",
    answer: "Yes. You can move between monthly and yearly options as billing support becomes available for your account.",
  },
  {
    question: "Refund policy?",
    answer: "If you need billing support, contact App7i support and the request can be reviewed based on your subscription timing and plan.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="bg-cream py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-moss">FAQ</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-forest sm:text-5xl">
            Common questions, answered clearly
          </h2>
          <p className="mt-4 text-lg text-body">Everything an instructor needs before getting started.</p>
        </div>

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-line bg-paper">
          {items.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <article key={item.question} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-soft"
                >
                  <span className="text-base font-semibold text-forest">{item.question}</span>
                  <span className="text-body">
                    <svg viewBox="0 0 24 24" className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm leading-7 text-body">{item.answer}</div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

