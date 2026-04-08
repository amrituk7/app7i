import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createBillingPortalSession, createSubscriptionCheckout } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./Pricing.css";

const BENEFITS = [
  {
    icon: "💷",
    title: "Get paid faster",
    body: "Auto-generated invoices after every lesson - no chasing, no spreadsheets."
  },
  {
    icon: "📅",
    title: "Fewer no-shows",
    body: "Students see upcoming lessons in real time, with reminders that keep them accountable."
  },
  {
    icon: "👩‍🎓",
    title: "Students who stay longer",
    body: "A branded student app builds loyalty - they feel part of something, not just a booking."
  },
  {
    icon: "📊",
    title: "Know your business at a glance",
    body: "Earnings, lesson counts, and progress tracking in one place."
  }
];

const TRUST = [
  "3-day free trial before billing starts",
  "£11.99/month or £99/year",
  "Secure payment via Stripe",
  "Cancel any time - no contract",
  "Support, queries, and concerns handled in-app"
];

const STATUS_META = {
  active: {
    label: "Active",
    tone: "success",
    title: "You're all set",
    body: "Full instructor access is unlocked. Go run your business."
  },
  trialing: {
    label: "Trial Active",
    tone: "success",
    title: "You're in - full access",
    body: "Your 3-day trial is active. Everything is unlocked while you decide which plan fits best."
  },
  trial_expired: {
    label: "Trial Ended",
    tone: "warning",
    title: "Your trial has ended",
    body: "Choose a plan to keep access running."
  },
  past_due: {
    label: "Payment Due",
    tone: "warning",
    title: "Payment needs attention",
    body: "Update your payment method to keep everything running smoothly."
  },
  cancelled: {
    label: "Cancelled",
    tone: "danger",
    title: "Your plan has ended",
    body: "Restart anytime - your students and lesson history are still here."
  },
  unpaid: {
    label: "Not Active",
    tone: "muted",
    title: null,
    body: null
  }
};

const PRICE_MONTHLY = 11.99;
const PRICE_YEARLY = 99;
const YEARLY_EQUIVALENT = (PRICE_YEARLY / 12).toFixed(2);
const YEARLY_SAVING = (PRICE_MONTHLY * 12 - PRICE_YEARLY).toFixed(2);

function getBillingStatus(userProfile, subscriptionStatus, trialExpired) {
  if (userProfile?.isDeveloper === true) return "active";
  if (subscriptionStatus === "trialing") {
    return trialExpired ? "trial_expired" : "trialing";
  }
  return subscriptionStatus || "unpaid";
}

export default function Pricing() {
  const { userProfile, subscriptionStatus, hasActiveSubscription, trialExpired, billingStatus: authBillingStatus } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [busyAction, setBusyAction] = useState("");
  const [yearly, setYearly] = useState(false);

  const billingStatus = useMemo(() => {
    if (authBillingStatus) return authBillingStatus;
    return getBillingStatus(userProfile, subscriptionStatus, trialExpired);
  }, [authBillingStatus, subscriptionStatus, trialExpired, userProfile]);

  const statusMeta = STATUS_META[billingStatus] || STATUS_META.unpaid;
  const success = searchParams.get("success") === "true";
  const cancelled = searchParams.get("cancelled") === "true";
  const showStatusBar = billingStatus !== "unpaid";
  const showPricingCard = billingStatus === "unpaid" || billingStatus === "trial_expired" || billingStatus === "past_due" || billingStatus === "cancelled";
  const canManageBilling = billingStatus === "active" || billingStatus === "trialing" || billingStatus === "past_due" || billingStatus === "cancelled";

  async function openCheckout() {
    setBusyAction("checkout");
    try {
      const { url } = await createSubscriptionCheckout("instructor", {
        billingInterval: yearly ? "yearly" : "monthly"
      });
      if (!url) throw new Error("Checkout link missing");
      window.location.assign(url);
    } catch (error) {
      showToast(error.message || "Failed to open checkout", "error");
      setBusyAction("");
    }
  }

  async function openPortal() {
    setBusyAction("portal");
    try {
      const { url } = await createBillingPortalSession("instructor");
      if (!url) throw new Error("Portal link missing");
      window.location.assign(url);
    } catch (error) {
      showToast(error.message || "Failed to open billing portal", "error");
      setBusyAction("");
    }
  }

  return (
    <div className="pricing-shell">
      {showStatusBar && (
        <div className={`pricing-status-bar pricing-status-bar--${statusMeta.tone}`}>
          <span className={`pricing-status-dot pricing-status-dot--${statusMeta.tone}`} />
          <div className="pricing-status-text">
            <strong>{statusMeta.title}</strong>
            <span>{statusMeta.body}</span>
          </div>
          {canManageBilling && (
            <button className="pricing-status-action" onClick={openPortal} disabled={busyAction === "portal"}>
              {busyAction === "portal" ? "Opening..." : "Manage Billing"}
            </button>
          )}
        </div>
      )}

      {(success || cancelled) && (
        <div className={`pricing-banner ${success ? "pricing-banner--success" : "pricing-banner--warning"}`}>
          {success
            ? "You're in. If access doesn't unlock in a few seconds, refresh once."
            : "Checkout cancelled - your setup is still here whenever you're ready."}
        </div>
      )}

      <section className="pricing-hero">
        <p className="pricing-eyebrow">Instructor Plan</p>
        <h1 className="pricing-headline">Clear billing for a serious instructor app.</h1>
        <p className="pricing-sub">
          Start with a 3-day free trial, then choose the plan that suits how you run your business:
          £11.99 monthly or £99 yearly.
        </p>
        <div className="pricing-roi">
          <p>Everything stays transparent: one instructor subscription, secure Stripe checkout, and no hidden add-ons.</p>
        </div>
      </section>

      {showPricingCard && (
        <section className="pricing-card-wrap">
          <div className="pricing-card">
            <div className="pricing-toggle-row">
              <button
                className={"pricing-toggle-btn" + (!yearly ? " active" : "")}
                onClick={() => setYearly(false)}
              >
                Monthly
              </button>
              <button
                className={"pricing-toggle-btn" + (yearly ? " active" : "")}
                onClick={() => setYearly(true)}
              >
                Yearly
                <span className="pricing-toggle-badge">Save £{YEARLY_SAVING}</span>
              </button>
            </div>

            <div className="pricing-price-row">
              <span className="pricing-currency">£</span>
              <span className="pricing-amount">{yearly ? PRICE_YEARLY : PRICE_MONTHLY}</span>
              <div className="pricing-period-wrap">
                <span className="pricing-period">{yearly ? "per year" : "per month"}</span>
                {yearly ? (
                  <span className="pricing-billed-note">works out to £{YEARLY_EQUIVALENT}/month</span>
                ) : (
                  <span className="pricing-billed-note">3-day free trial included</span>
                )}
              </div>
            </div>

            <div className="pricing-clarity-list" aria-label="Billing summary">
              <div className="pricing-clarity-item">
                <strong>Trial</strong>
                <span>3 days before billing starts</span>
              </div>
              <div className="pricing-clarity-item">
                <strong>Monthly</strong>
                <span>£11.99 charged each month</span>
              </div>
              <div className="pricing-clarity-item">
                <strong>Yearly</strong>
                <span>£99 charged once per year</span>
              </div>
            </div>

            <button
              className="pricing-cta-btn"
              onClick={openCheckout}
              disabled={busyAction === "checkout"}
            >
              {busyAction === "checkout" ? "Redirecting to Stripe..." : "Start Free Trial"}
            </button>
            <p className="pricing-cta-micro">
              3-day free trial, then {yearly ? "£99/year" : "£11.99/month"} · Cancel any time
            </p>

            <ul className="pricing-trust-list">
              {TRUST.map((t) => (
                <li key={t}>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <p className="pricing-setup-note">
            Want to set up first? <Link to="/profile">Finish your profile</Link> or <Link to="/car-details">add your car</Link> - then come back here.
          </p>
        </section>
      )}

      <section className="pricing-benefits">
        <h2 className="pricing-section-title">What changes when you go live</h2>
        <div className="pricing-benefits-grid">
          {BENEFITS.map((b) => (
            <div key={b.title} className="pricing-benefit-card">
              <span className="pricing-benefit-icon">{b.icon}</span>
              <h3>{b.title}</h3>
              <p>{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pricing-refund-card">
        <h2>Need billing help or a refund request?</h2>
        <p>
          We keep this simple. If something is wrong, send a refund request from support and include the reason.
          We will review it with your billing details.
        </p>
        <div className="pricing-refund-actions">
          <Link to="/support?topic=refund" className="pricing-secondary-btn">Request Refund</Link>
          <button
            type="button"
            className="pricing-secondary-btn pricing-secondary-btn--ghost"
            onClick={openPortal}
            disabled={busyAction === "portal" || !canManageBilling}
          >
            {busyAction === "portal" ? "Opening..." : "Manage Billing"}
          </button>
        </div>
      </section>

      <section className="pricing-support">
        <p>Questions before subscribing? Use <Link to="/support">Support</Link> for customer support, queries, and concerns/issues.</p>
        <p className="pricing-feedback-row">Contact reference: <strong>app7.com</strong></p>
      </section>
    </div>
  );
}
