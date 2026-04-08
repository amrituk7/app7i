import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const FEATURES = [
  { 
    title: "Instant scheduling", 
    desc: "Book and manage lessons with a calendar that understands your workflow." 
  },
  { 
    title: "Student progress", 
    desc: "Track every lesson, note, and milestone. Know exactly where each student stands." 
  },
  { 
    title: "Payment tracking", 
    desc: "Record every transaction. See who owes what at a glance." 
  },
  { 
    title: "Beautiful reports", 
    desc: "Weekly earnings, monthly summaries. Understand your business instantly." 
  },
  { 
    title: "Student portal", 
    desc: "Your students book lessons and track progress through their own link." 
  },
  { 
    title: "Smart reminders", 
    desc: "Automated notifications for you and your students. Never miss a lesson." 
  },
];

const FAQ_ITEMS = [
  { q: "Is there a free trial?", a: "Yes. 3 days free, no credit card required." },
  { q: "Can students book their own lessons?", a: "Yes. Share your personal booking link and students can self-schedule around your availability." },
  { q: "How does the referral work?", a: "Share your link. They pay £99.99 instead of £119.99. You get 20% off your next renewal." },
  { q: "What payments can I track?", a: "Cash, card, and bank transfer. In-app collection coming soon." },
  { q: "Can I export my data?", a: "Yes. Export everything as CSV anytime." },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="lp">
      {/* HEADER */}
      <header className={`lp-header ${scrolled ? "scrolled" : ""}`}>
        <div className="lp-header-inner">
          <Link to="/" className="lp-logo">App7i</Link>
          <nav className="lp-nav">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href}>{link.label}</a>
            ))}
          </nav>
          <div className="lp-header-actions">
            <Link to="/login" className="lp-link">Log in</Link>
            <Link to="/register-instructor" className="lp-btn">Get Started</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <h1>
            Run your lessons.<br />
            <span>Not your paperwork.</span>
          </h1>
          <p>
            The complete toolkit for UK driving instructors.<br />
            Schedule, track, and grow — beautifully.
          </p>
          <div className="lp-hero-actions">
            <Link to="/register-instructor" className="lp-btn lp-btn-lg">Start Free Trial</Link>
            <span className="lp-hero-note">3 days free. No card required.</span>
          </div>
        </div>
      </section>

      {/* PRODUCT */}
      <section className="lp-product">
        <div className="lp-product-window">
          <div className="lp-window-bar">
            <span /><span /><span />
          </div>
          <div className="lp-window-content">
            <div className="lp-dash-header">
              <p>Good morning, Sarah</p>
              <h2>Dashboard</h2>
            </div>
            <div className="lp-dash-stats">
              <div className="lp-dash-stat">
                <span className="lp-stat-num">4</span>
                <span className="lp-stat-label">Lessons Today</span>
              </div>
              <div className="lp-dash-stat">
                <span className="lp-stat-num">12</span>
                <span className="lp-stat-label">Students</span>
              </div>
              <div className="lp-dash-stat accent">
                <span className="lp-stat-num">£840</span>
                <span className="lp-stat-label">This Month</span>
              </div>
            </div>
            <div className="lp-dash-next">
              <span>Next Lesson</span>
              <div className="lp-next-card">
                <strong>9:00 AM</strong>
                <div>
                  <p>James Wilson</p>
                  <small>Roundabouts</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lp-product-glow" />
      </section>

      {/* VALUE */}
      <section className="lp-value">
        <p>Trusted by driving instructors across the UK</p>
      </section>

      {/* FEATURES */}
      <section id="features" className="lp-features">
        <div className="lp-section-intro">
          <h2>Everything you need.</h2>
          <p>Replace the spreadsheets, WhatsApp groups, and paper diaries.</p>
        </div>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="lp-feature">
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="lp-pricing">
        <div className="lp-section-intro">
          <h2>Simple pricing.</h2>
          <p>No hidden fees. Cancel anytime.</p>
        </div>
        <div className="lp-pricing-grid">
          <div className="lp-price-card">
            <h3>Monthly</h3>
            <div className="lp-price-amount">
              <span className="lp-price">£11.99</span>
              <span>/month</span>
            </div>
            <p>Pay as you go. Full access to all features.</p>
            <Link to="/register-instructor" className="lp-btn lp-btn-outline">Start Trial</Link>
          </div>
          <div className="lp-price-card featured">
            <span className="lp-price-badge">Best Value</span>
            <h3>Yearly</h3>
            <div className="lp-price-amount">
              <span className="lp-price-was">£145</span>
              <span className="lp-price">£119.99</span>
              <span>/year</span>
            </div>
            <p>Save £25. Two months free.</p>
            <Link to="/register-instructor" className="lp-btn">Start Trial</Link>
          </div>
          <div className="lp-price-card">
            <h3>Referral</h3>
            <div className="lp-price-amount">
              <span className="lp-price-was">£119.99</span>
              <span className="lp-price">£99.99</span>
              <span>/year</span>
            </div>
            <p>When referred by a friend. Save £20.</p>
            <Link to="/register-instructor" className="lp-btn lp-btn-outline">Get Link</Link>
          </div>
        </div>
      </section>

      {/* REFERRAL */}
      <section className="lp-referral">
        <div className="lp-referral-card">
          <h3>Invite a friend. Both save.</h3>
          <p>They get £20 off. You get 20% off your next renewal or a free month.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="lp-faq">
        <div className="lp-section-intro">
          <h2>Questions?</h2>
        </div>
        <div className="lp-faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className={`lp-faq-item ${openFaq === i ? "open" : ""}`}>
              <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                <span>{item.q}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className="lp-faq-answer"><p>{item.a}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <h2>Ready to simplify your business?</h2>
        <p>Join the next generation of UK driving instructors.</p>
        <Link to="/register-instructor" className="lp-btn lp-btn-lg lp-btn-white">Start Free Trial</Link>
        <span className="lp-cta-note">3 days free. No card required.</span>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <span className="lp-footer-logo">App7i</span>
          <nav>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </nav>
          <p>© {new Date().getFullYear()} App7i</p>
        </div>
      </footer>
    </div>
  );
}
