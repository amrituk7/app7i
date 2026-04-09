import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="app7i-section">
      <div className="app7i-shell">
        <div className="app7i-cta-panel">
          <div className="app7i-cta-content">
            <div className="app7i-kicker">Early access</div>
            <h2 className="app7i-cta-title">Give your driving business a cleaner front and a calmer back office.</h2>
            <p className="app7i-cta-copy">
              App7i is strongest when the product looks organised, the pricing is easy to explain, and the referral logic actually gives instructors a reason to share it.
            </p>
            <div className="app7i-actions-row">
              <Link to="/register-instructor" className="app7i-button app7i-button-primary">Claim Early Access</Link>
              <Link to="/login" className="app7i-button app7i-button-secondary">Log In</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
