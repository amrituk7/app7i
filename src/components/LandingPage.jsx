import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

/* ═══════════════════════════════════════════════════════════════════════════
   App7i Landing Page — Premium World-Class SaaS Design
   Linear-level polish, Vercel-level minimalism, Tesla-level animations
   ═══════════════════════════════════════════════════════════════════════════ */

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#referral", label: "Referral" },
];

const STATS = [
  { value: "10,000+", label: "Lessons Tracked" },
  { value: "4.9/5", label: "Instructor Rating" },
  { value: "2,000+", label: "Active Students" },
  { value: "98%", label: "Pass Rate Tracked" },
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
    desc: "Drag-and-drop calendar with automated reminders and student self-booking.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    title: "Payment Tracking",
    desc: "Track every payment instantly. Send invoices. Know who owes what.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    title: "Progress Reports",
    desc: "Visual progress tracking from first lesson to test day.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: "Student Portal",
    desc: "Students login to view progress, book lessons, and make payments.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    title: "WhatsApp Integration",
    desc: "Message students directly. Keep all communication in one place.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M8 12h8" />
      </svg>
    ),
    title: "Shareable Profile",
    desc: "Your branded page to share on social media and attract students.",
  },
];

const STEPS = [
  { num: "01", title: "Create Profile", desc: "Sign up in 2 minutes. Add your details and pricing." },
  { num: "02", title: "Add Students", desc: "Import existing or let new ones sign up via your link." },
  { num: "03", title: "Start Teaching", desc: "Book, track, collect. All from one dashboard." },
];

const PRICING_FEATURES = [
  "Unlimited students",
  "Smart calendar",
  "Payment tracking",
  "Progress reports",
  "Student portal",
  "WhatsApp integration",
  "Shareable profile",
  "Priority support",
];

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATED CAR COMPONENT
───────────────────────────────────────────────────────────────────────────── */
function AnimatedCar() {
  return (
    <div className="car-animation-container">
      <div className="car-road">
        <div className="road-line" />
        <div className="road-line" />
        <div className="road-line" />
      </div>
      <div className="car-wrapper">
        <svg className="car-svg" viewBox="0 0 120 50" fill="none">
          {/* Car body */}
          <path
            d="M15 35 L20 20 L40 15 L80 15 L95 20 L105 35 L105 40 L15 40 Z"
            fill="url(#carGradient)"
          />
          {/* Windows */}
          <path
            d="M25 22 L38 18 L75 18 L88 22 L85 30 L28 30 Z"
            fill="#0f172a"
            opacity="0.8"
          />
          {/* Roof */}
          <path
            d="M35 18 L42 12 L78 12 L85 18"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
          />
          {/* Front wheel */}
          <circle cx="30" cy="42" r="8" fill="#1e293b" />
          <circle cx="30" cy="42" r="4" fill="#475569" />
          {/* Back wheel */}
          <circle cx="90" cy="42" r="8" fill="#1e293b" />
          <circle cx="90" cy="42" r="4" fill="#475569" />
          {/* Headlight */}
          <ellipse cx="103" cy="32" rx="3" ry="2" fill="#fbbf24" />
          {/* Tail light */}
          <rect x="15" y="30" width="4" height="6" rx="1" fill="#ef4444" />
          <defs>
            <linearGradient id="carGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="car-shadow" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FEATURE CARD COMPONENT
───────────────────────────────────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PRICING CARD COMPONENT
───────────────────────────────────────────────────────────────────────────── */
function PricingCard({ title, price, period, originalPrice, badge, highlight, features, cta, note }) {
  return (
    <div className={`pricing-card ${highlight ? "highlight" : ""}`}>
      {badge && <span className="pricing-badge">{badge}</span>}
      <h3 className="pricing-title">{title}</h3>
      <div className="pricing-amount">
        {originalPrice && <span className="price-original">{originalPrice}</span>}
        <span className="price">{price}</span>
        <span className="period">{period}</span>
      </div>
      <ul className="pricing-features">
        {features.map((f, i) => (
          <li key={i}>
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="2" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <Link to="/register-instructor" className={`pricing-cta ${highlight ? "primary" : "secondary"}`}>
        {cta}
      </Link>
      {note && <span className="pricing-note">{note}</span>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STAT ITEM COMPONENT
───────────────────────────────────────────────────────────────────────────── */
function StatItem({ value, label }) {
  return (
    <div className="stat-item">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="lp">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <header className={`lp-header ${scrolled ? "scrolled" : ""}`}>
        <div className="lp-header-inner">
          <Link to="/" className="lp-logo">
            <span className="logo-mark">7i</span>
            <span className="logo-text">App7i</span>
          </Link>

          <nav className="lp-nav">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href}>{l.label}</a>
            ))}
          </nav>

          <div className="lp-header-actions">
            <Link to="/login" className="btn-ghost">Log In</Link>
            <Link to="/register-instructor" className="btn-primary">Get Started</Link>
          </div>

          <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>

        {mobileOpen && (
          <div className="mobile-menu">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}>{l.label}</a>
            ))}
            <Link to="/login" onClick={() => setMobileOpen(false)}>Log In</Link>
            <Link to="/register-instructor" className="btn-primary" onClick={() => setMobileOpen(false)}>
              Get Started
            </Link>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — Premium with animated car
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient" />
          <div className="hero-blur-1" />
          <div className="hero-blur-2" />
        </div>

        <div className="hero-content">
          <span className="hero-badge">Built for UK Driving Instructors</span>
          <h1>
            Run your lessons.<br />
            <span>Not your paperwork.</span>
          </h1>
          <p>
            The all-in-one platform for independent driving instructors. Schedule lessons,
            track progress, and manage your business — all from one beautiful dashboard.
          </p>
          <div className="hero-actions">
            <Link to="/register-instructor" className="btn-primary btn-lg">
              Start Free Trial
            </Link>
            <Link to="/login" className="btn-outline btn-lg">
              {"I'm an Instructor"}
            </Link>
          </div>
          <span className="hero-note">3-day free trial. No credit card required.</span>
        </div>

        <div className="hero-visual">
          <AnimatedCar />
          <div className="hero-dashboard-blur">
            <div className="blur-card" />
            <div className="blur-card small" />
            <div className="blur-card tall" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SOCIAL PROOF / STATS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="stats-section">
        <div className="stats-inner">
          {STATS.map((s) => (
            <StatItem key={s.label} value={s.value} label={s.label} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="how-section">
        <div className="section-header">
          <span className="section-tag">How It Works</span>
          <h2>Get started in 3 simple steps</h2>
          <p>Set up your profile, add students, and start teaching smarter.</p>
        </div>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div key={s.num} className="step-card">
              <span className="step-num">{s.num}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════���═══════════════════════════ */}
      <section id="features" className="features-section">
        <div className="section-header">
          <span className="section-tag">Features</span>
          <h2>Everything you need. One app.</h2>
          <p>Replace spreadsheets, WhatsApp groups, and paper diaries.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PRICING
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="pricing-section">
        <div className="section-header">
          <span className="section-tag">Pricing</span>
          <h2>Simple, transparent pricing</h2>
          <p>No hidden fees. Cancel anytime.</p>
        </div>
        <div className="pricing-grid">
          <PricingCard
            title="Monthly"
            price="£11.99"
            period="/month"
            features={PRICING_FEATURES}
            cta="Start Free Trial"
            note="Cancel anytime"
          />
          <PricingCard
            title="Yearly"
            price="£119.99"
            period="/year"
            originalPrice="£145.00"
            badge="Save £25"
            highlight
            features={[...PRICING_FEATURES, "2 months free"]}
            cta="Start Free Trial"
            note="Best value"
          />
          <PricingCard
            title="Referral"
            price="£99.99"
            period="/year"
            originalPrice="£119.99"
            badge="£20 OFF"
            features={[...PRICING_FEATURES, "Exclusive referral rate", "Priority onboarding"]}
            cta="Get Referral Link"
            note="When referred by a friend"
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          REFERRAL PROGRAM
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="referral" className="referral-section">
        <div className="referral-inner">
          <div className="referral-content">
            <span className="section-tag">Referral Program</span>
            <h2>Share App7i. Everyone wins.</h2>
            <p>Invite fellow instructors and both of you save.</p>
          </div>
          <div className="referral-cards">
            <div className="referral-card">
              <div className="referral-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <h3>New Instructor Gets</h3>
              <span className="referral-discount">£20 OFF</span>
              <p>Pay £99.99 instead of £119.99 for your first year</p>
            </div>
            <div className="referral-card">
              <div className="referral-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3>Referrer Gets</h3>
              <span className="referral-discount">20% OFF</span>
              <p>Next month free OR £99.99 on your next yearly renewal</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PAYMENTS COMING SOON
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="payments-section">
        <div className="payments-inner">
          <div className="payments-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <path d="M1 10h22" />
            </svg>
          </div>
          <h2>Track payments now. Accept payments later.</h2>
          <p>
            Record every cash, card, and bank transfer today. In-app payment collection
            is coming soon — and you&apos;ll be first to know.
          </p>
          <span className="payments-badge">Coming Soon</span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="final-cta">
        <div className="cta-inner">
          <h2>Start your journey today</h2>
          <p>Join hundreds of UK driving instructors who&apos;ve simplified their business.</p>
          <div className="cta-actions">
            <Link to="/register-instructor" className="btn-white btn-lg">Start Free Trial</Link>
            <Link to="/login" className="btn-ghost-light btn-lg">Log In</Link>
          </div>
          <span>3-day free trial. No credit card. Cancel anytime.</span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="lp-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="logo-mark">7i</span>
            <span className="logo-text">App7i</span>
          </div>
          <nav className="footer-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/support">Support</Link>
          </nav>
          <span className="footer-copy">© {new Date().getFullYear()} App7i. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
