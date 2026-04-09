import { useState } from "react";
import { Link } from "react-router-dom";

const planContent = {
  monthly: {
    price: "GBP 11.99",
    cadence: "/month",
    normal: "Normally GBP 19.99/month during standard pricing.",
    summary: "A low-friction way to start using App7i immediately with the full instructor workflow.",
  },
  yearly: {
    price: "GBP 119.99",
    cadence: "/year",
    normal: "Normally GBP 150/year. Referred instructors still access the early-access yearly rate.",
    summary: "The stronger value option for instructors who already know they want the cleaner long-term setup.",
  },
};

const included = [
  "Instructor dashboard and student portal",
  "Lesson and progress management",
  "Messaging and cleaner student follow-up",
  "Professional billing direction with room to grow",
  "Referral reward logic built into the offer story",
];

export default function Pricing() {
  const [plan, setPlan] = useState("yearly");

  return (
    <section id="pricing" className="app7i-section">
      <div className="app7i-shell">
        <div className="app7i-section-header centered">
          <div className="app7i-kicker-light app7i-kicker">Pricing</div>
          <h2 className="app7i-title">Simple public pricing. Strong referral upside.</h2>
          <p className="app7i-copy">
            The main offer stays easy to understand. The referral benefit adds extra motivation without turning the pricing table into a mess.
          </p>
        </div>

        <div className="app7i-pricing-grid">
          <article className="app7i-pricing-card">
            <div className="app7i-plan-switch" role="tablist" aria-label="Pricing plan toggle">
              <button type="button" className={plan === "monthly" ? "is-active" : ""} onClick={() => setPlan("monthly")}>Monthly</button>
              <button type="button" className={plan === "yearly" ? "is-active" : ""} onClick={() => setPlan("yearly")}>Yearly</button>
            </div>

            <div className="app7i-price-row">
              <div className="app7i-price">{planContent[plan].price}</div>
              <div className="app7i-price-caption">{planContent[plan].cadence}</div>
            </div>

            <div className="app7i-inline-badge" style={{ marginTop: 16 }}>Early-access pricing</div>
            <p className="app7i-price-note">{planContent[plan].summary}</p>
            <p className="app7i-price-note">{planContent[plan].normal}</p>

            <div className="app7i-benefits">
              <div className="app7i-benefit">
                <span className="app7i-list-bullet is-good">✓</span>
                <span><strong>3-day free trial</strong> before the first charge.</span>
              </div>
              <div className="app7i-benefit">
                <span className="app7i-list-bullet is-good">✓</span>
                <span><strong>Referred instructors</strong> still get the GBP 119.99 early-access yearly rate.</span>
              </div>
              <div className="app7i-benefit">
                <span className="app7i-list-bullet is-good">✓</span>
                <span><strong>Clear upgrade logic</strong> for monthly users who unlock the GBP 99.99 yearly offer.</span>
              </div>
            </div>

            <ul className="app7i-pricing-list">
              {included.map((item) => (
                <li key={item}>
                  <span>✓</span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="app7i-actions-row">
              <Link to="/register-instructor" className="app7i-button app7i-button-primary">Start Early Access</Link>
            </div>
          </article>

          <article className="app7i-pricing-card dark">
            <div className="app7i-kicker">Referral reward</div>
            <div className="app7i-price-row">
              <div className="app7i-price dark">GBP 99.99</div>
              <div className="app7i-price-caption dark">best yearly outcome after a successful referral</div>
            </div>
            <p className="app7i-price-note dark">
              Referral pricing should feel like a meaningful benefit, not a confusing refund story.
            </p>

            <div className="app7i-referral-card">
              <h3>How it works</h3>
              <div className="app7i-referral-points">
                <div className="app7i-referral-point">
                  <strong>If you already paid yearly at GBP 119.99:</strong> one successful referral applies GBP 20 credit to your next renewal, making the next yearly bill effectively GBP 99.99.
                </div>
                <div className="app7i-referral-point">
                  <strong>If you are on monthly:</strong> one successful referral unlocks a yearly switch offer at GBP 99.99.
                </div>
                <div className="app7i-referral-point">
                  <strong>If your referred instructor joins:</strong> they get the GBP 119.99 early-access yearly rate through your link.
                </div>
              </div>
            </div>

            <p className="app7i-price-note dark">
              This is the kind of reward message we can reinforce later in email: “You have 1 successful referral. Your next renewal will be GBP 99.99.”
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
