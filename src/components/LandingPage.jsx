import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

/* ═══════════════════════════════════════════════════════════════════════════
   App7i Landing Page — Apple-Quality Design
   Cinematic, minimal, premium
   ═══════════════════════════════════════════════════════════════════════════ */

const FEATURES = [
  { 
    title: "Instant Tracking", 
    desc: "Every payment recorded the moment it happens." 
  },
  { 
    title: "Smart Insights", 
    desc: "Understand your business at a glance." 
  },
  { 
    title: "Effortless Exporting", 
    desc: "Share reports with one click." 
  },
  { 
    title: "Unified Dashboard", 
    desc: "Cash, card, and bank transfers in one place." 
  },
  { 
    title: "Secure by Design", 
    desc: "Built with modern encryption." 
  },
  { 
    title: "In-App Payments", 
    desc: "Collect payments directly inside App7i. Coming soon." 
  },
];

const FAQ_ITEMS = [
  { q: "Is there a free trial?", a: "Yes. 3 days free, no credit card required." },
  { q: "Can students book their own lessons?", a: "Yes. Share your personal booking link and students can self-schedule around your availability." },
  { q: "How does the referral programme work?", a: "Share your referral link. New instructors pay £99.99 instead of £119.99. You get 20% off your next renewal or one month free." },
  { q: "What payment methods can I track?", a: "Cash, card, and bank transfer. In-app payment collection is coming soon." },
  { q: "Can I export my data?", a: "Yes. Export everything as CSV anytime." },
  { q: "Is my data secure?", a: "Absolutely. We use industry-standard encryption and never share your data with third parties." },
  { q: "Can I cancel anytime?", a: "Yes. No lock-in contracts. Cancel whenever you need to." },
  { q: "Do you offer support?", a: "Yes. Email support is included with all plans. We typically respond within 24 hours." },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="lp">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <header className={`lp-header ${scrolled ? "scrolled" : ""}`}>
        <div className="lp-header-inner">
          <Link to="/" className="lp-logo">App7i</Link>
          <nav className="lp-nav">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="lp-header-cta">
            <Link to="/login" className="lp-link">Log in</Link>
            <Link to="/register-instructor" className="lp-btn lp-btn-sm">Get Started</Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — Cinematic, Minimal
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="lp-hero">
        <div className="lp-hero-content">
          <h1>
            Track payments beautifully.
            <span>Accept them anywhere.</span>
          </h1>
          <p>
            Every cash, card, and bank transfer — organised with elegance.
            <br />
            In-app payment collection is coming soon.
          </p>
          <div className="lp-hero-actions">
            <Link to="/register-instructor" className="lp-btn lp-btn-lg">Get Started</Link>
            <a href="#product" className="lp-link-arrow">
              Explore the Dashboard
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          VALUE SECTION — Two Column
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="lp-value">
        <div className="lp-value-inner">
          <div className="lp-value-text">
            <h2>
              Your business.
              <span>Clearer than ever.</span>
            </h2>
            <p>
              App7i brings every transaction into one calm, beautifully designed 
              space — so you can focus on what matters.
            </p>
          </div>
          <div className="lp-value-visual" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CINEMATIC PRODUCT REVEAL
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="product" className="lp-product">
        <div className="lp-product-wrapper">
          <div className="lp-product-window">
            <div className="lp-window-bar">
              <span /><span /><span />
            </div>
            <div className="lp-window-content">
              <div className="lp-dash-greeting">Good morning, Sarah</div>
              <div className="lp-dash-title">Dashboard</div>
              <div className="lp-dash-stats">
                <div className="lp-dash-stat">
                  <span className="lp-stat-value">4</span>
                  <span className="lp-stat-label">Lessons Today</span>
                </div>
                <div className="lp-dash-stat">
                  <span className="lp-stat-value">12</span>
                  <span className="lp-stat-label">Students</span>
                </div>
                <div className="lp-dash-stat highlight">
                  <span className="lp-stat-value">£840</span>
                  <span className="lp-stat-label">This Month</span>
                </div>
              </div>
              <div className="lp-dash-next">
                <div className="lp-next-label">Next Lesson</div>
                <div className="lp-next-card">
                  <div className="lp-next-time">9:00 AM</div>
                  <div className="lp-next-info">
                    <div className="lp-next-name">James Wilson</div>
                    <div className="lp-next-topic">Roundabouts</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lp-product-reflection" />
          <div className="lp-product-spotlight" />
        </div>
        <p className="lp-product-caption">
          Designed with intention. Built for clarity.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURES — Minimal, Premium
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="features" className="lp-features">
        <div className="lp-section-header">
          <h2>
            Everything you need.
            <span>Nothing you don't.</span>
          </h2>
        </div>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="lp-feature-card">
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS — Clean, 3 Steps
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="lp-steps">
        <div className="lp-section-header">
          <h2>Simple by design.</h2>
        </div>
        <div className="lp-steps-grid">
          <div className="lp-step">
            <span className="lp-step-num">01</span>
            <h3>Record</h3>
            <p>Add cash, card, or bank transfers instantly.</p>
          </div>
          <div className="lp-step">
            <span className="lp-step-num">02</span>
            <h3>Review</h3>
            <p>See your daily, weekly, and monthly totals.</p>
          </div>
          <div className="lp-step">
            <span className="lp-step-num">03</span>
            <h3>Grow</h3>
            <p>Use insights to make smarter decisions.</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PRICING — Elegant, Honest
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="lp-pricing">
        <div className="lp-section-header">
          <h2>Pricing that respects your time.</h2>
        </div>
        <div className="lp-pricing-grid">
          <div className="lp-price-card">
            <div className="lp-price-header">
              <h3>Starter</h3>
              <p>Pay as you go</p>
            </div>
            <div className="lp-price-amount">
              <span className="lp-price">£11.99</span>
              <span className="lp-price-period">/month</span>
            </div>
            <p className="lp-price-desc">Full access to all features. Cancel anytime.</p>
            <Link to="/register-instructor" className="lp-btn lp-btn-outline lp-btn-full">
              Start Free Trial
            </Link>
          </div>
          
          <div className="lp-price-card featured">
            <div className="lp-price-badge">Best Value</div>
            <div className="lp-price-header">
              <h3>Pro</h3>
              <p>For serious instructors</p>
            </div>
            <div className="lp-price-amount">
              <span className="lp-price-original">£145</span>
              <span className="lp-price">£119.99</span>
              <span className="lp-price-period">/year</span>
            </div>
            <p className="lp-price-desc">Save £25. Two months free.</p>
            <Link to="/register-instructor" className="lp-btn lp-btn-full">
              Start Free Trial
            </Link>
          </div>
          
          <div className="lp-price-card">
            <div className="lp-price-header">
              <h3>Referral</h3>
              <p>When referred by a friend</p>
            </div>
            <div className="lp-price-amount">
              <span className="lp-price-original">£119.99</span>
              <span className="lp-price">£99.99</span>
              <span className="lp-price-period">/year</span>
            </div>
            <p className="lp-price-desc">Save £20. Both you and your friend benefit.</p>
            <Link to="/register-instructor" className="lp-btn lp-btn-outline lp-btn-full">
              Get Referral Link
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FAQ — Apple-style Accordions
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="lp-faq">
        <div className="lp-section-header">
          <h2>Questions? Answers.</h2>
        </div>
        <div className="lp-faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div 
              key={i} 
              className={`lp-faq-item ${openFaq === i ? "open" : ""}`}
            >
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{item.q}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className="lp-faq-answer">
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FINAL CTA — Emotional, Clean
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="lp-cta">
        <h2>Ready to simplify your business?</h2>
        <p>Start tracking payments beautifully.</p>
        <Link to="/register-instructor" className="lp-btn lp-btn-lg lp-btn-white">
          Get Started
        </Link>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-logo">App7i</span>
            <p>Built for UK driving instructors.</p>
          </div>
          <nav className="lp-footer-nav">
            <div className="lp-footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="lp-footer-col">
              <h4>Legal</h4>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
            </div>
          </nav>
        </div>
        <div className="lp-footer-bottom">
          <p>© {new Date().getFullYear()} App7i. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
