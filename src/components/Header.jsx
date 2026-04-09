import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const links = [
  { href: "#why-app7i", label: "Why App7i" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`app7i-nav ${scrolled ? "is-solid" : ""}`}>
      <div className="app7i-shell app7i-nav-row">
        <a href="/" className="app7i-brand">
          <span className="app7i-brand-mark">7i</span>
          <span className="app7i-brand-copy">
            <span className="app7i-brand-title">App7i</span>
            <span className="app7i-brand-subtitle">Driving instructor platform</span>
          </span>
        </a>

        <nav className="app7i-nav-links" aria-label="Primary">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="app7i-nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="app7i-nav-actions">
          <Link to="/login" className="app7i-button app7i-button-ghost">Log In</Link>
          <Link to="/register-instructor" className="app7i-button app7i-button-primary">Claim Early Access</Link>
        </div>

        <button
          type="button"
          className="app7i-mobile-toggle"
          onClick={() => setMobileOpen((value) => !value)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? "×" : "≡"}
        </button>
      </div>

      {mobileOpen && (
        <div className="app7i-shell app7i-mobile-panel">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
              {link.label}
            </a>
          ))}
          <div className="app7i-mobile-panel-actions">
            <Link to="/login" className="app7i-button app7i-button-ghost" onClick={() => setMobileOpen(false)}>Log In</Link>
            <Link to="/register-instructor" className="app7i-button app7i-button-primary" onClick={() => setMobileOpen(false)}>Claim Early Access</Link>
          </div>
        </div>
      )}
    </header>
  );
}
