import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="app7i-section app7i-hero">
      <div className="app7i-shell">
        <div className="app7i-hero-panel">
          <div className="app7i-hero-grid">
            <div>
              <div className="app7i-kicker">Built for independent driving instructors</div>
              <h1 className="app7i-display">Run your driving school without the admin drag.</h1>
              <p className="app7i-hero-copy">
                App7i gives instructors one calm place for bookings, student progress, messages, payments, and renewals so the business side finally feels organised.
              </p>

              <div className="app7i-actions-row">
                <Link to="/register-instructor" className="app7i-button app7i-button-primary">Claim Early Access</Link>
                <Link to="/login" className="app7i-button app7i-button-secondary">Log In</Link>
              </div>

              <div className="app7i-chip-row">
                <div className="app7i-chip">
                  <span className="app7i-chip-label">Price</span>
                  <strong>Early access from GBP 11.99 monthly or GBP 119.99 yearly.</strong>
                </div>
                <div className="app7i-chip">
                  <span className="app7i-chip-label">Student experience</span>
                  <strong>Students get their own portal with upcoming lessons and progress.</strong>
                </div>
                <div className="app7i-chip">
                  <span className="app7i-chip-label">Referral upside</span>
                  <strong>Refer another instructor and improve your own renewal or upgrade price.</strong>
                </div>
              </div>
            </div>

            <div className="app7i-dashboard-card" aria-label="Dashboard preview">
              <div className="app7i-dashboard-header">
                <div>
                  <div className="app7i-brand-subtitle">Today at a glance</div>
                  <strong className="app7i-brand-title">Instructor dashboard</strong>
                </div>
                <div className="app7i-dashboard-tag">App7i</div>
              </div>

              <div className="app7i-dashboard-body">
                <div className="app7i-dashboard-metrics">
                  <div className="app7i-metric">
                    <span className="app7i-metric-label">Lessons</span>
                    <strong className="app7i-metric-value">4</strong>
                    <div className="app7i-metric-note">Booked today</div>
                  </div>
                  <div className="app7i-metric">
                    <span className="app7i-metric-label">Students</span>
                    <strong className="app7i-metric-value">12</strong>
                    <div className="app7i-metric-note">Active learners</div>
                  </div>
                  <div className="app7i-metric">
                    <span className="app7i-metric-label">Revenue</span>
                    <strong className="app7i-metric-value">GBP 840</strong>
                    <div className="app7i-metric-note">This month</div>
                  </div>
                </div>

                <div className="app7i-next-lesson">
                  <div className="app7i-next-top">
                    <div>
                      <div className="app7i-brand-subtitle">Next lesson</div>
                      <strong className="app7i-brand-title">James Wilson</strong>
                    </div>
                    <div className="app7i-time-pill">
                      <span>Start</span>
                      <strong>9:00</strong>
                    </div>
                  </div>
                  <div className="app7i-next-grid">
                    <div className="app7i-next-card">
                      <span>Lesson focus</span>
                      <strong>Roundabouts, lane discipline, mock route confidence</strong>
                    </div>
                    <div className="app7i-next-card">
                      <span>Student status</span>
                      <strong>87% test ready, theory passed, practical booked</strong>
                    </div>
                  </div>
                </div>

                <div className="app7i-note-banner">
                  <span>Why instructors switch</span>
                  <strong>Less diary chasing, fewer payment gaps, clearer student progress.</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
