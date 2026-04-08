import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const FEATURES = [
  { 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    title: "Smart Scheduling", 
    desc: "Book, reschedule, and track lessons with a calendar built for driving instructors." 
  },
  { 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: "Student Management", 
    desc: "Track progress, add notes, monitor test readiness. Everything in one place." 
  },
  { 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    title: "Payment Tracking", 
    desc: "Record cash, card, and bank transfers. See who owes what at a glance." 
  },
  { 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
    title: "Earnings Dashboard", 
    desc: "Weekly and monthly income reports. Know exactly where you stand." 
  },
  { 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
    title: "Student Portal", 
    desc: "Students book lessons and view their progress through their own link." 
  },
  { 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
    title: "Reminders", 
    desc: "Automated lesson reminders for you and your students. Never miss a lesson." 
  },
];

const PRICING_FEATURES = [
  "Unlimited students",
  "Smart scheduling",
  "Payment tracking",
  "Progress reports",
  "Student portal",
  "Priority support",
];

const FAQ_ITEMS = [
  { q: "Is there a free trial?", a: "Yes. 3 days free, no credit card required. Cancel anytime." },
  { q: "Can students book their own lessons?", a: "Yes. Share your personal booking link and students can self-schedule." },
  { q: "How does the referral discount work?", a: "Share your link. New users pay £99.99/year (£20 off). You get 20% off your next renewal or a free month." },
  { q: "What payment methods can I track?", a: "Cash, card, and bank transfer. In-app payment collection is coming soon." },
  { q: "Can I export my data?", a: "Yes. Export students, lessons, and earnings anytime as CSV." },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="lp">
      {/* ══════════════════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════════════════ */}
      <header className={`lp-header ${scrolled ? "scrolled" : ""}`}>
        <div className="lp-header-inner">
          <Link to="/" className="lp-logo">
            <span className="lp-logo-mark">7i</span>
            <span className="lp-logo-text">App7i</span>
          </Link>

          <nav className="lp-nav">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="lp-nav-link">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="lp-header-actions">
            <Link to="/login" className="lp-btn-ghost">Log In</Link>
            <Link to="/register-instructor" className="lp-btn-primary">Get Started</Link>
          </div>

          <button
            className="lp-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lp-mobile-menu">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </a>
            ))}
            <div className="lp-mobile-actions">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
              <Link to="/register-instructor" className="lp-btn-primary" onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="lp-hero">
        <div className="lp-hero-content">
          <h1>
            The complete platform<br />
            <span className="lp-hero-accent">for driving instructors.</span>
          </h1>
          <p className="lp-hero-sub">
            Schedule lessons, track progress, manage payments, and grow your business.
            Everything you need in one beautiful app.
          </p>
          <div className="lp-hero-actions">
            <Link to="/register-instructor" className="lp-btn-primary lp-btn-xl">
              Start Free Trial
            </Link>
            <a href="#features" className="lp-btn-secondary lp-btn-xl">
              See Features
            </a>
          </div>
          <p className="lp-hero-note">3-day free trial. No credit card required.</p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          DASHBOARD PREVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="lp-preview">
        <div className="lp-preview-wrapper">
          <div className="lp-preview-card">
            <div className="lp-preview-header">
              <div className="lp-preview-dots">
                <span /><span /><span />
              </div>
            </div>
            <div className="lp-preview-content">
              <div className="lp-preview-greeting">
                <p className="lp-preview-hello">Good morning, Sarah</p>
                <h3>Dashboard</h3>
              </div>
              <div className="lp-preview-stats">
                <div className="lp-preview-stat">
                  <span className="lp-preview-stat-value">4</span>
                  <span className="lp-preview-stat-label">Lessons Today</span>
                </div>
                <div className="lp-preview-stat">
                  <span className="lp-preview-stat-value">12</span>
                  <span className="lp-preview-stat-label">Students</span>
                </div>
                <div className="lp-preview-stat highlight">
                  <span className="lp-preview-stat-value">£840</span>
                  <span className="lp-preview-stat-label">This Month</span>
                </div>
              </div>
              <div className="lp-preview-next">
                <span className="lp-preview-next-label">Next Lesson</span>
                <div className="lp-preview-next-card">
                  <div className="lp-preview-next-time">9:00 AM</div>
                  <div className="lp-preview-next-info">
                    <span className="lp-preview-next-name">James Wilson</span>
                    <span className="lp-preview-next-topic">Lesson 8 - Roundabouts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SOCIAL PROOF
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="lp-proof">
        <p>Trusted by driving instructors across the UK</p>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="lp-features">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2>Everything you need.<br />Nothing you don&apos;t.</h2>
            <p>Replace spreadsheets, WhatsApp groups, and paper diaries with one elegant solution.</p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="lp-feature-card">
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="lp-how">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2>Get started in minutes</h2>
            <p>No complicated setup. No learning curve.</p>
          </div>
          <div className="lp-how-grid">
            <div className="lp-how-step">
              <div className="lp-how-num">01</div>
              <h3>Create your profile</h3>
              <p>Sign up and set your availability, rates, and teaching area. Takes under 2 minutes.</p>
            </div>
            <div className="lp-how-step">
              <div className="lp-how-num">02</div>
              <h3>Add your students</h3>
              <p>Import existing students or share your booking link for new sign-ups.</p>
            </div>
            <div className="lp-how-step">
              <div className="lp-how-num">03</div>
              <h3>Start teaching</h3>
              <p>Book lessons, track progress, record payments. We handle the admin.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="lp-pricing">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2>Simple, transparent pricing</h2>
            <p>No hidden fees. No per-student charges. Cancel anytime.</p>
          </div>
          <div className="lp-pricing-grid">
            <div className="lp-price-card">
              <div className="lp-price-header">
                <h3>Monthly</h3>
                <p>Pay as you go</p>
              </div>
              <div className="lp-price-amount">
                <span className="lp-price">£11.99</span>
                <span className="lp-price-period">/month</span>
              </div>
              <ul className="lp-price-features">
                {PRICING_FEATURES.map((f, i) => (
                  <li key={i}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register-instructor" className="lp-btn-outline lp-price-cta">
                Start Free Trial
              </Link>
            </div>

            <div className="lp-price-card featured">
              <div className="lp-price-badge">Best Value</div>
              <div className="lp-price-header">
                <h3>Yearly</h3>
                <p>Save £25 per year</p>
              </div>
              <div className="lp-price-amount">
                <span className="lp-price-original">£145.00</span>
                <span className="lp-price">£119.99</span>
                <span className="lp-price-period">/year</span>
              </div>
              <ul className="lp-price-features">
                {[...PRICING_FEATURES, "2 months free"].map((f, i) => (
                  <li key={i}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register-instructor" className="lp-btn-primary lp-price-cta">
                Start Free Trial
              </Link>
            </div>

            <div className="lp-price-card">
              <div className="lp-price-badge referral">Referral</div>
              <div className="lp-price-header">
                <h3>Friend Rate</h3>
                <p>When referred by a friend</p>
              </div>
              <div className="lp-price-amount">
                <span className="lp-price-original">£119.99</span>
                <span className="lp-price">£99.99</span>
                <span className="lp-price-period">/year</span>
              </div>
              <ul className="lp-price-features">
                {[...PRICING_FEATURES, "£20 off first year"].map((f, i) => (
                  <li key={i}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register-instructor" className="lp-btn-outline lp-price-cta">
                Get Referral Link
              </Link>
            </div>
          </div>

          <div className="lp-referral-banner">
            <div className="lp-referral-content">
              <h3>Refer a Friend</h3>
              <p>Share your link. They get £20 off their first year. You get 20% off your next renewal or a free month.</p>
            </div>
            <Link to="/register-instructor" className="lp-btn-white">Learn More</Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="lp-faq">
        <div className="lp-container lp-container-sm">
          <div className="lp-section-header">
            <h2>Frequently asked questions</h2>
          </div>
          <div className="lp-faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className={`lp-faq-item ${openFaq === i ? "open" : ""}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                  <span>{item.q}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={openFaq === i ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                  </svg>
                </button>
                <div className="lp-faq-answer">
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="lp-cta">
        <div className="lp-container">
          <h2>Ready to transform your business?</h2>
          <p>Join the next generation of UK driving instructors.</p>
          <div className="lp-cta-actions">
            <Link to="/register-instructor" className="lp-btn-white lp-btn-xl">Start Free Trial</Link>
          </div>
          <p className="lp-cta-note">3-day free trial. No credit card required.</p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════════ */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <span className="lp-logo-mark">7i</span>
              <span className="lp-logo-text">App7i</span>
            </div>
            <nav className="lp-footer-nav">
              <div className="lp-footer-col">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#faq">FAQ</a>
              </div>
              <div className="lp-footer-col">
                <h4>Company</h4>
                <Link to="/about">About</Link>
                <Link to="/contact">Contact</Link>
                <Link to="/support">Support</Link>
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
        </div>
      </footer>
    </div>
  );
}
