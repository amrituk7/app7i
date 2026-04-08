import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

/* ═══════════════════════════════════════════════════════════════════════════
   App7i Landing Page — Premium World-Class SaaS Design
   Stripe clarity • Linear polish • Vercel minimalism • Notion spacing
   ═══════════════════════════════════════════════════════════════════════════ */

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
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
   ANIMATED CAR - Premium learner car driving left to center
───────────────────────────────────────────────────────────────────────────── */
function AnimatedCar() {
  return (
    <div className="car-scene">
      {/* Road */}
      <div className="car-road">
        <div className="road-surface" />
        <div className="road-markings">
          <span /><span /><span /><span /><span /><span /><span /><span />
        </div>
      </div>
      
      {/* Car - Clean, realistic learner vehicle */}
      <div className="car-wrapper">
        <svg className="car-svg" viewBox="0 0 280 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ground shadow */}
          <ellipse cx="140" cy="102" rx="100" ry="8" fill="rgba(0,0,0,0.08)" />
          
          {/* Main body - Modern hatchback silhouette */}
          <path 
            d="M25 68 L30 68 L42 45 L75 30 L205 30 L235 45 L252 68 L258 68 L260 74 L260 84 L20 84 L20 74 Z" 
            fill="url(#carBodyPremium)"
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          
          {/* Lower body accent line */}
          <path d="M28 84 L28 88 L252 88 L252 84" fill="#94a3b8" />
          
          {/* Windows - darker blue glass */}
          <path d="M78 34 L72 62 L108 62 L108 34 Z" fill="#1e3a5f" />
          <path d="M114 34 L114 62 L200 62 L210 34 Z" fill="#1e3a5f" />
          
          {/* Window reflections */}
          <path d="M80 36 L76 58 L90 58 L90 36 Z" fill="rgba(255,255,255,0.15)" />
          <path d="M116 36 L116 58 L145 58 L145 36 Z" fill="rgba(255,255,255,0.1)" />
          
          {/* Chrome window trim */}
          <path d="M72 62 L78 34 L108 34 L108 62" stroke="#e5e7eb" strokeWidth="2.5" fill="none" />
          <path d="M114 34 L114 62 L200 62 L210 34" stroke="#e5e7eb" strokeWidth="2.5" fill="none" />
          <line x1="111" y1="34" x2="111" y2="62" stroke="#e5e7eb" strokeWidth="4" />
          
          {/* Roof sign - L plate */}
          <rect x="85" y="20" width="110" height="12" rx="4" fill="#ffffff" stroke="#d1d5db" strokeWidth="1.5" />
          <rect x="132" y="22" width="16" height="8" rx="2" fill="#dc2626" />
          <text x="140" y="29" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ffffff">L</text>
          
          {/* Headlights - modern LED style */}
          <path d="M248 58 L255 54 L255 72 L248 68 Z" fill="#fef9c3" />
          <ellipse cx="251" cy="63" rx="3" ry="6" fill="#fef08a" />
          
          {/* Tail lights */}
          <rect x="24" y="55" width="8" height="18" rx="3" fill="#dc2626" />
          <rect x="26" y="59" width="4" height="8" rx="1.5" fill="#fca5a5" />
          
          {/* Front wheel well */}
          <path d="M50 84 Q80 65 110 84" fill="#374151" />
          {/* Front wheel */}
          <circle cx="80" cy="88" r="20" fill="#1f2937" />
          <circle cx="80" cy="88" r="16" fill="#374151" />
          <circle cx="80" cy="88" r="11" fill="#4b5563" />
          <circle cx="80" cy="88" r="6" fill="#6b7280" />
          <circle cx="80" cy="88" r="3" fill="#9ca3af" />
          
          {/* Rear wheel well */}
          <path d="M170 84 Q200 65 230 84" fill="#374151" />
          {/* Rear wheel */}
          <circle cx="200" cy="88" r="20" fill="#1f2937" />
          <circle cx="200" cy="88" r="16" fill="#374151" />
          <circle cx="200" cy="88" r="11" fill="#4b5563" />
          <circle cx="200" cy="88" r="6" fill="#6b7280" />
          <circle cx="200" cy="88" r="3" fill="#9ca3af" />
          
          {/* Side mirror */}
          <ellipse cx="64" cy="52" rx="8" ry="5" fill="#94a3b8" stroke="#e5e7eb" strokeWidth="1" />
          
          {/* Door line */}
          <line x1="111" y1="62" x2="111" y2="82" stroke="#cbd5e1" strokeWidth="1.5" />
          
          {/* Door handle */}
          <rect x="130" y="66" width="16" height="4" rx="2" fill="#cbd5e1" />
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="carBodyPremium" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#f1f5f9" />
              <stop offset="70%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DASHBOARD PREVIEW - Premium floating card
───────────────────────────────────────────────────────────────────────────── */
function DashboardPreview() {
  return (
    <div className="dashboard-preview">
      <div className="dash-header">
        <div>
          <span className="dash-greeting">Good morning, Sarah</span>
          <h3 className="dash-title">Your Dashboard</h3>
        </div>
        <div className="dash-avatar">S</div>
      </div>
      
      <div className="dash-stats">
        <div className="dash-stat">
          <span className="dash-stat-value">4</span>
          <span className="dash-stat-label">Lessons Today</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-value">12</span>
          <span className="dash-stat-label">Students</span>
        </div>
        <div className="dash-stat accent">
          <span className="dash-stat-value">£840</span>
          <span className="dash-stat-label">This Month</span>
        </div>
      </div>
      
      <div className="dash-next">
        <span className="dash-next-label">Next Lesson</span>
        <div className="dash-next-row">
          <div className="dash-next-time">9:00</div>
          <div className="dash-next-info">
            <span className="dash-next-name">James Wilson</span>
            <span className="dash-next-topic">Lesson 8 - Roundabouts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FEATURE CARD
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
   PRICING CARD
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
            <Link to="/login" className="btn-ghost">Log in</Link>
            <Link to="/register-instructor" className="btn-primary">Start Free</Link>
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
            <Link to="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
            <Link to="/register-instructor" className="btn-primary" onClick={() => setMobileOpen(false)}>
              Start Free
            </Link>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="hero">
        <div className="hero-bg" />
        
        <div className="hero-content">
          <h1>Built for UK driving instructors</h1>
          <p className="hero-tagline">Run your lessons. Not your paperwork.</p>
          <p className="hero-desc">
            A complete toolkit for driving instructors — bookings, progress tracking,
            earnings, invoices, and a student portal.
          </p>
          <div className="hero-actions">
            <Link to="/register-instructor" className="btn-primary btn-lg">Start Free</Link>
            <Link to="/login" className="btn-outline btn-lg">Log in</Link>
          </div>
        </div>

        <div className="hero-visual">
          <DashboardPreview />
          <AnimatedCar />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════��══
          SOCIAL PROOF
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="social-proof">
        <p>Trusted by early UK instructors and growing fast.</p>
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
      ═══════════════════════════════════════════════════════════════════ */}
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
          REFERRAL
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="referral-section">
        <div className="referral-inner">
          <div className="referral-content">
            <span className="section-tag">Referral Program</span>
            <h2>Share App7i. Everyone wins.</h2>
            <p>Invite fellow instructors and both of you save.</p>
          </div>
          <div className="referral-cards">
            <div className="referral-card">
              <h3>New Instructor Gets</h3>
              <span className="referral-discount">£20 OFF</span>
              <p>Pay £99.99 instead of £119.99 for your first year</p>
            </div>
            <div className="referral-card">
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
          <p>Join the next generation of UK instructors modernising their workflow.</p>
          <div className="cta-actions">
            <Link to="/register-instructor" className="btn-white btn-lg">Start Free</Link>
            <Link to="/login" className="btn-ghost-light btn-lg">Log in</Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═════════════════════════���═════════════════════════════════════════ */}
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
