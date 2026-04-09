import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="app7i-footer">
      <div className="app7i-shell">
        <div className="app7i-footer-row">
          <div className="app7i-footer-copy">
            <strong style={{ color: "#223228" }}>App7i</strong>
            <div>Built for driving instructors who want a more organised business.</div>
          </div>

          <nav className="app7i-footer-links">
            <a href="#why-app7i">Why App7i</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/support">Support</Link>
          </nav>

          <div className="app7i-footer-copy">© {new Date().getFullYear()} App7i</div>
        </div>
      </div>
    </footer>
  );
}
