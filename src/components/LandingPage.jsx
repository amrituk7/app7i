import { useState } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const FEATURES = [
  { icon: "📅", title: "Smart Scheduling", desc: "Book, reschedule, and track lessons with ease." },
  { icon: "👥", title: "Student Management", desc: "Progress tracking, notes, and test readiness." },
  { icon: "💷", title: "Payment Tracking", desc: "Record cash, card, and bank transfers instantly." },
  { icon: "📊", title: "Earnings Dashboard", desc: "See your weekly and monthly income at a glance." },
  { icon: "📱", title: "Student Portal", desc: "Students book lessons and view their progress." },
  { icon: "🔔", title: "Reminders", desc: "Automated lesson reminders for you and students." },
];

const PRICING_FEATURES = [
  "Unlimited students",
  "Smart scheduling",
  "Payment tracking",
  "Progress reports",
  "Student portal",
  "Email support",
];

const FAQ_ITEMS = [
  { q: "Is there a free trial?", a: "Yes, 3 days free. No credit card required to start." },
  { q: "Can students book their own lessons?", a: "Yes, via a personal booking link you share with them." },
  { q: "How does the referral discount work?", a: "Share your link. New users pay £99.99/year, you get 20% off your next renewal." },
  { q: "What payment methods can I track?", a: "Cash, card, and bank transfer. In-app payments coming soon." },
  { q: "Can I export my data?", a: "Yes, export students, lessons, and earnings anytime." },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useState(() => {
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
            <span className="lp-logo-icon">7i</span>
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
            <Link to="/login" className="lp-btn-ghost">I&apos;m an Instructor</Link>
            <Link to="/register-instructor" className="lp-btn-primary">Claim Early Access</Link>
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
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>I&apos;m an Instructor</Link>
            <Link to="/register-instructor" className="lp-btn-primary" onClick={() => setMobileMenuOpen(false)}>
              Claim Early Access
            </Link>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="lp-hero">
        <div className="lp-hero-bg" />
        <div className="lp-hero-content">
          <span className="lp-badge">Early Access — First 50 Instructors</span>
          <h1>Run your lessons.<br /><span>Not your paperwork.</span></h1>
          <p>
            The all-in-one platform for UK driving instructors. Schedule lessons,
            track progress, and manage your business — all from one dashboard.
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
          <DashboardPreview />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SOCIAL PROOF
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="lp-proof">
        <p>Trusted by early UK instructors and growing fast.</p>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="lp-features">
        <div className="lp-section-header">
          <span className="lp-eyebrow">Features</span>
          <h2>Everything you need. One app.</h2>
          <p>Stop juggling spreadsheets, WhatsApp, and paper diaries.</p>
        </div>
        <div className="lp-features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="lp-feature-card">
              <span className="lp-feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="lp-how">
        <div className="lp-section-header">
          <span className="lp-eyebrow">How It Works</span>
          <h2>Get started in 3 steps</h2>
        </div>
        <div className="lp-how-steps">
          <div className="lp-step">
            <span className="lp-step-num">1</span>
            <h3>Create your profile</h3>
            <p>Set up your instructor profile in under 2 minutes.</p>
          </div>
          <div className="lp-step">
            <span className="lp-step-num">2</span>
            <h3>Add your students</h3>
            <p>Import existing students or let them sign up via your link.</p>
          </div>
          <div className="lp-step">
            <span className="lp-step-num">3</span>
            <h3>Start teaching</h3>
            <p>Schedule lessons, track progress, record payments.</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="lp-pricing">
        <div className="lp-section-header">
          <span className="lp-eyebrow">Simple Pricing</span>
          <h2>One plan. Everything included.</h2>
          <p>No hidden fees. No per-student charges.</p>
        </div>
        <div className="lp-pricing-cards">
          <PricingCard
            title="Monthly"
            price="£11.99"
            period="/month"
            features={PRICING_FEATURES}
            cta="Start Free Trial"
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
          />
          <PricingCard
            title="Referral"
            price="£99.99"
            period="/year"
            originalPrice="£119.99"
            badge="£20 OFF"
            features={[...PRICING_FEATURES, "Exclusive referral rate"]}
            cta="Get Referral Link"
            note="When referred by a friend"
          />
        </div>

        <div className="lp-referral-box">
          <h3>Refer &amp; Save</h3>
          <p>Share your link. New instructors pay £99.99/year. You get 20% off your next renewal.</p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PAYMENTS COMING SOON
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="lp-payments">
        <div className="lp-payments-inner">
          <span className="lp-payments-icon">💳</span>
          <h2>Track payments now. Accept payments later.</h2>
          <p>Record every cash, card, and bank transfer today. In-app payment collection is coming soon.</p>
          <span className="lp-coming-badge">Coming Soon</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="lp-faq">
        <div className="lp-section-header">
          <span className="lp-eyebrow">FAQ</span>
          <h2>Common questions</h2>
        </div>
        <div className="lp-faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className={`lp-faq-item ${openFaq === i ? "open" : ""}`}>
              <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                <span>{item.q}</span>
                <span className="lp-faq-chevron">{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && <p>{item.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="lp-cta">
        <h2>Ready to simplify your business?</h2>
        <p>Join the next generation of UK instructors modernising their workflow.</p>
        <div className="lp-cta-actions">
          <Link to="/register-instructor" className="lp-btn-white lp-btn-lg">Claim Early Access</Link>
          <Link to="/login" className="lp-btn-outline-white lp-btn-lg">I&apos;m an Instructor</Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════════ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-logo-icon">7i</span>
            <span>App7i</span>
          </div>
          <nav className="lp-footer-links">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href}>{link.label}</a>
            ))}
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/support">Support</Link>
          </nav>
          <p className="lp-footer-copy">© {new Date().getFullYear()} App7i. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD PREVIEW COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
function DashboardPreview() {
  return (
    <div className="lp-dash-preview">
      <div className="lp-dash-card">
        <div className="lp-dash-header">
          <div>
            <p className="lp-dash-greeting">Good morning, Sarah</p>
            <h3>Your Dashboard</h3>
          </div>
          <span className="lp-dash-logo">7i</span>
        </div>
        <div className="lp-dash-stats">
          <div className="lp-dash-stat">
            <span className="lp-dash-value">4</span>
            <span className="lp-dash-label">Lessons Today</span>
          </div>
          <div className="lp-dash-stat">
            <span className="lp-dash-value">12</span>
            <span className="lp-dash-label">Students</span>
          </div>
          <div className="lp-dash-stat accent">
            <span className="lp-dash-value">£840</span>
            <span className="lp-dash-label">This Month</span>
          </div>
        </div>
        <div className="lp-dash-next">
          <p className="lp-dash-next-label">Next Lesson</p>
          <div className="lp-dash-next-row">
            <span className="lp-dash-time">9:00</span>
            <div>
              <p className="lp-dash-student">James Wilson</p>
              <p className="lp-dash-topic">Lesson 8 - Roundabouts</p>
            </div>
          </div>
        </div>
      </div>
      <div className="lp-dash-notif">
        <p className="lp-notif-title">New booking!</p>
        <p className="lp-notif-text">Emma - Tomorrow 2pm</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRICING CARD COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
function PricingCard({ title, price, period, originalPrice, badge, highlight, features, cta, note }) {
  return (
    <div className={`lp-price-card ${highlight ? "highlight" : ""}`}>
      {badge && <span className="lp-price-badge">{badge}</span>}
      <h3>{title}</h3>
      <div className="lp-price-amount">
        {originalPrice && <span className="lp-price-original">{originalPrice}</span>}
        <span className="lp-price">{price}</span>
        <span className="lp-period">{period}</span>
      </div>
      <ul className="lp-price-features">
        {features.map((f, i) => (
          <li key={i}>✓ {f}</li>
        ))}
      </ul>
      <Link to="/register-instructor" className="lp-btn-primary lp-price-cta">{cta}</Link>
      {note && <p className="lp-price-note">{note}</p>}
    </div>
  );
}
