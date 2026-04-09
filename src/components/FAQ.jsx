import { useState } from "react";

const faqs = [
  {
    q: "What is included in the early-access price?",
    a: "The public offer covers the main instructor workflow: student management, lesson organisation, communication, and the App7i student portal experience.",
  },
  {
    q: "What happens after the 3-day trial?",
    a: "After the trial ends, billing starts on the plan you selected. The public pricing shown on the landing page remains the basis of the offer you joined under.",
  },
  {
    q: "How does the referral reward actually work?",
    a: "A successful referral improves the value of your own plan. Yearly users receive GBP 20 credit toward the next yearly renewal. Monthly users unlock a yearly switch offer at GBP 99.99.",
  },
  {
    q: "What does the referred instructor get?",
    a: "They join through your referral link and access the GBP 119.99 early-access yearly rate instead of the standard yearly price.",
  },
  {
    q: "Can I cancel later?",
    a: "Yes. The pricing message should feel clear and low-pressure. The product has to earn the longer-term subscription through value, not lock-in confusion.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="app7i-section">
      <div className="app7i-shell">
        <div className="app7i-faq-grid">
          <div className="app7i-faq-side">
            <div className="app7i-kicker-light app7i-kicker">FAQ</div>
            <h2 className="app7i-title" style={{ marginTop: 18 }}>The commercial model should stay understandable.</h2>
            <p className="app7i-copy" style={{ marginTop: 18 }}>
              The landing page should explain enough to build confidence without dumping every edge case into the first impression.
            </p>
          </div>

          <div className="app7i-faq-list">
            {faqs.map((faq, index) => {
              const isOpen = index === openIndex;
              return (
                <article key={faq.q} className="app7i-faq-item">
                  <button
                    type="button"
                    className="app7i-faq-button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  >
                    <span>{faq.q}</span>
                    <span>⌄</span>
                  </button>
                  {isOpen && <div className="app7i-faq-answer">{faq.a}</div>}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
