import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

/* ═══════════════════════════════════════════════════════════════════════════
   App7i Landing Page — Premium SaaS Design
   Clean, modern, conversion-focused for UK driving instructors
   ═══════════════════════════════════════════════════════════════════════════ */

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    title: "Smart Scheduling",
    description: "Drag-and-drop calendar with automated reminders. Students book online, you stay in control.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    title: "Payment Tracking",
    description: "Track every payment. Send invoices. Know exactly who owes what, instantly.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    title: "Progress Tracking",
    description: "Monitor each student's journey from first lesson to test day with visual progress reports.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: "Student Portal",
    description: "Give students their own login to view progress, book lessons, and make payments.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    title: "WhatsApp Integration",
    description: "Message students directly from the app. Keep all communication in one place.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M8 12h8" />
      </svg>
    ),
    title: "Shareable Profile",
    description: "Your own branded page to share on social media and attract new students.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Create Your Profile",
    description: "Sign up in 2 minutes. Add your details, service area, and pricing.",
  },
  {
    number: "02",
    title: "Add Your Students",
    description: "Import existing students or let new ones sign up through your profile link.",
  },
  {
    number: "03",
    title: "Start Teaching",
    description: "Book lessons, track progress, collect payments. All from one dashboard.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Is there a free trial?",
    a: "Yes! Start with a 3-day free trial. No credit card required.",
  },
  {
    q: "Can students book their own lessons?",
    a: "Absolutely. Share your profile link and students can request bookings that you approve.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes, App7i works on any device. Manage your business from your phone between lessons.",
  },
  {
    q: "How do payments work?",
    a: "Track cash, card, and bank transfers. We don't process payments — you keep using your existing methods.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, no contracts. Cancel with one click if it's not for you.",
  },
];

const INCLUDED = [
  "Unlimited students",
  "Smart calendar",
  "Payment tracking",
  "Progress reports",
  "Student portal",
  "WhatsApp integration",
  "Shareable profile",
  "Priority support",
];

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="lp">
      {/* ─────────────────────────────────────────────────────────────────────
          HEADER
      ───────────────────────────────────────────────────────────────────── */}
      <header className={`lp-header ${isScrolled ? "scrolled" : ""}`}>
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
            className="lp-mobile-toggle"
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
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
            <Link to="/register-instructor" className="lp-btn-primary" onClick={() => setMobileMenuOpen(false)}>
              Get Started
            </Link>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────────────
          HERO
      ───────────────────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-content">
          <div className="lp-hero-badge">Built for UK Driving Instructors</div>
          <h1>
            Run your lessons.<br />
            <span>Not your paperwork.</span>
          </h1>
          <p>
            The all-in-one app for independent driving instructors. Schedule lessons, 
            track payments, monitor student progress — all from one dashboard.
          </p>
          <div className="lp-hero-actions">
            <Link to="/register-instructor" className="lp-btn-primary lp-btn-lg">
              Claim Early Access
            </Link>
            <Link to="/login" className="lp-btn-outline lp-btn-lg">
              I&apos;m an Instructor
            </Link>
          </div>
          <p className="lp-hero-note">3-day free trial. No credit card required.</p>
        </div>

        <div className="lp-hero-visual">
          <div className="lp-hero-card">
            <div className="lp-hero-card-header">
              <div>
                <span className="lp-hero-card-greeting">Good morning, Sarah</span>
                <span className="lp-hero-card-title">Your Dashboard</span>
              </div>
              <div className="lp-hero-card-logo">7i</div>
            </div>
            <div className="lp-hero-card-stats">
              <div className="lp-hero-stat">
                <span className="lp-hero-stat-value">24</span>
                <span className="lp-hero-stat-label">Students</span>
              </div>
              <div className="lp-hero-stat">
                <span className="lp-hero-stat-value">5</span>
                <span className="lp-hero-stat-label">Today</span>
              </div>
              <div className="lp-hero-stat">
                <span className="lp-hero-stat-value">£2.4k</span>
                <span className="lp-hero-stat-label">This Month</span>
              </div>
            </div>
            <div className="lp-hero-card-next">
              <span className="lp-hero-card-next-label">Next Up</span>
              <div className="lp-hero-card-next-item">
                <div className="lp-hero-card-next-time">9:00</div>
                <div>
                  <span className="lp-hero-card-next-name">James Wilson</span>
                  <span className="lp-hero-card-next-detail">Lesson 8 — Roundabouts</span>
                </div>
              </div>
            </div>
          </div>
          <div className="lp-hero-float">
            <span>New booking!</span>
            <strong>Emma — Tomorrow 2pm</strong>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          STATS BAR
      ───────────────────────────────────────────────────────────────────── */}
      <section className="lp-stats">
        <div className="lp-stats-inner">
          <div className="lp-stat-item">
            <span className="lp-stat-value">10,000+</span>
            <span className="lp-stat-label">Lessons Tracked</span>
          </div>
          <div className="lp-stat-item">
            <span className="lp-stat-value">4.9/5</span>
            <span className="lp-stat-label">Instructor Rating</span>
          </div>
          <div className="lp-stat-item">
            <span className="lp-stat-value">2,000+</span>
            <span className="lp-stat-label">Students</span>
          </div>
          <div className="lp-stat-item">
            <span className="lp-stat-value">98%</span>
            <span className="lp-stat-label">Payment Success</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          FEATURES
      ───────────────────────────────────────────────────────────────────── */}
      <section id="features" className="lp-features">
        <div className="lp-section-header">
          <span className="lp-section-tag">Features</span>
          <h2>Everything you need. One app.</h2>
          <p>Stop juggling spreadsheets, WhatsApp groups, and paper diaries.</p>
        </div>
        <div className="lp-features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="lp-feature-card">
              <div className="lp-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          HOW IT WORKS
      ───────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="lp-how">
        <div className="lp-section-header">
          <span className="lp-section-tag">How It Works</span>
          <h2>Get started in 3 simple steps</h2>
          <p>Set up your profile, add students, and start teaching smarter.</p>
        </div>
        <div className="lp-steps">
          {STEPS.map((s) => (
            <div key={s.number} className="lp-step">
              <span className="lp-step-number">{s.number}</span>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
            </div>
          ))}
        </div>
        <div className="lp-how-cta">
          <div className="lp-how-cta-inner">
            <div>
              <span className="lp-how-cta-tag">Early Access — First 50 Instructors</span>
              <h3>Lock in £11.99/month for life.</h3>
            </div>
            <Link to="/register-instructor" className="lp-btn-white">Claim Early Access</Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          PRICING
      ───────────────────────────────────────────────────────────────────── */}
      <section id="pricing" className="lp-pricing">
        <div className="lp-section-header">
          <span className="lp-section-tag">Pricing</span>
          <h2>One plan. Everything included.</h2>
          <p>No add-ons. No per-student fees. No hidden costs.</p>
        </div>
        <div className="lp-pricing-card">
          <div className="lp-pricing-badge">Early Access</div>
          <div className="lp-pricing-price">
            <span className="lp-pricing-amount">£11.99</span>
            <span className="lp-pricing-period">/month</span>
          </div>
          <p className="lp-pricing-desc">Everything you need to run your driving school professionally.</p>
          <Link to="/register-instructor" className="lp-btn-primary lp-btn-lg lp-btn-full">
            Start 3-Day Free Trial
          </Link>
          <span className="lp-pricing-note">No credit card required</span>
          <ul className="lp-pricing-features">
            {INCLUDED.map((item) => (
              <li key={item}>
                <svg viewBox="0 0 16 16" className="lp-check">
                  <path d="M3.5 8.5 6.5 11.5 12.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          FAQ
      ───────────────────────────────────────────────────────────────────── */}
      <section id="faq" className="lp-faq">
        <div className="lp-section-header">
          <span className="lp-section-tag">FAQ</span>
          <h2>Common questions, answered.</h2>
        </div>
        <div className="lp-faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div key={item.q} className={`lp-faq-item ${openFaq === i ? "open" : ""}`}>
              <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                <span>{item.q}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {openFaq === i && <p>{item.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          FINAL CTA
      ───────────────────────────────────────────────────────────────────── */}
      <section className="lp-final-cta">
        <h2>Ready to transform your teaching?</h2>
        <p>Join hundreds of UK driving instructors who&apos;ve simplified their business with App7i.</p>
        <div className="lp-final-cta-actions">
          <Link to="/register-instructor" className="lp-btn-white lp-btn-lg">Claim Early Access</Link>
          <Link to="/login" className="lp-btn-ghost-light lp-btn-lg">Log In</Link>
        </div>
        <span>3-day free trial. Cancel anytime.</span>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          FOOTER
      ───────────────────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-logo-mark">7i</span>
            <span className="lp-logo-text">App7i</span>
          </div>
          <nav className="lp-footer-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/support">Support</Link>
            <Link to="/login">Log In</Link>
          </nav>
          <span className="lp-footer-copy">© {new Date().getFullYear()} App7i. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
