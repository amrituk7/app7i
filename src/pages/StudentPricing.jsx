import { useMemo, useState } from "react";
import { createBillingPortalSession, createSubscriptionCheckout, validateReferralCodeApi } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./Pricing.css";

function getBillingStatus(userProfile, subscriptionStatus, trialExpired) {
  if (userProfile?.isDeveloper === true) return "active";
  if (subscriptionStatus === "trialing") {
    return trialExpired ? "trial_expired" : "trialing";
  }
  return subscriptionStatus || "unpaid";
}

export default function StudentPricing() {
  const { subscriptionStatus, hasActiveSubscription, userProfile, trialExpired, billingStatus: authBillingStatus } = useAuth();
  const { showToast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [referralDetails, setReferralDetails] = useState(null);
  const [busyAction, setBusyAction] = useState("");

  const billingStatus = useMemo(() => {
    if (authBillingStatus) return authBillingStatus;
    return getBillingStatus(userProfile, subscriptionStatus, trialExpired);
  }, [authBillingStatus, subscriptionStatus, trialExpired, userProfile]);

  const canManageBilling = billingStatus === "active" || billingStatus === "trialing" || billingStatus === "past_due" || billingStatus === "cancelled";
  const showCheckout = !hasActiveSubscription;

  async function validateCode() {
    if (!referralCode.trim()) {
      setReferralDetails(null);
      return;
    }

    setBusyAction("validate");
    try {
      const result = await validateReferralCodeApi(referralCode.trim());
      if (result.valid) {
        setReferralDetails(result);
        showToast(`Referral code accepted for ${result.instructorName}`, "success");
      } else {
        setReferralDetails(null);
        showToast("Referral code not recognised", "error");
      }
    } catch (error) {
      showToast(error.message || "Could not validate referral code", "error");
    } finally {
      setBusyAction("");
    }
  }

  async function openCheckout() {
    setBusyAction("checkout");
    try {
      const { url } = await createSubscriptionCheckout("student", {
        referralCode: referralCode.trim() || undefined
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
      const { url } = await createBillingPortalSession("student");
      if (!url) throw new Error("Portal link missing");
      window.location.assign(url);
    } catch (error) {
      showToast(error.message || "Failed to open billing portal", "error");
      setBusyAction("");
    }
  }

  return (
    <div className="pricing-shell">
      <section className="pricing-hero-card">
        <div className="pricing-hero-copy">
          <p className="pricing-eyebrow">Student Billing</p>
          <h1>Student Plan</h1>
          <p className="pricing-lead">
            This screen is only used when student billing is enabled for your account. Validate a referral code,
            then continue to checkout if your instructor has set that up.
          </p>
          <div className="pricing-badges">
            <span className={`pricing-status-pill pricing-status-pill--${hasActiveSubscription ? "success" : "muted"}`}>
              {hasActiveSubscription ? "Active" : billingStatus === "trial_expired" ? "Trial Ended" : subscriptionStatus || "Not Active"}
            </span>
            <span className="pricing-email-pill">{userProfile?.email || "Signed-in student"}</span>
          </div>
        </div>
        <div className="pricing-hero-side">
          <div className="pricing-highlight-card">
            <h2>{hasActiveSubscription ? "Your student plan is active" : "Start secure checkout"}</h2>
            <p>
              {hasActiveSubscription
                ? "Open the billing portal to update your card or manage the subscription."
                : "If your instructor gave you a referral code, validate it here before checkout."}
            </p>
            {hasActiveSubscription ? (
              <button type="button" onClick={openPortal} disabled={busyAction === "portal"}>
                {busyAction === "portal" ? "Opening..." : "Manage Billing"}
              </button>
            ) : (
              <button type="button" onClick={openCheckout} disabled={busyAction === "checkout"}>
                {busyAction === "checkout" ? "Redirecting..." : "Continue to Checkout"}
              </button>
            )}
          </div>
        </div>
      </section>

      {showCheckout && (
        <section className="pricing-grid">
          <article className="pricing-panel">
            <h2>Referral code</h2>
            <label htmlFor="student-referral">Instructor referral code</label>
            <input
              id="student-referral"
              type="text"
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
              placeholder="Enter code"
            />
            <div className="pricing-actions pricing-actions--compact">
              <button type="button" onClick={validateCode} disabled={busyAction === "validate"}>
                {busyAction === "validate" ? "Checking..." : "Validate Code"}
              </button>
            </div>
            {referralDetails?.valid && (
              <p className="pricing-inline-note">
                Code accepted. Referral linked to {referralDetails.instructorName}.
              </p>
            )}
          </article>

          <article className="pricing-panel">
            <h2>Support</h2>
            <p>
              Need help? Use the main Support area in App7i.
            </p>
          </article>
        </section>
      )}

      {canManageBilling && hasActiveSubscription && (
        <section className="pricing-refund-card">
          <h2>Manage your subscription</h2>
          <p>
            If you need to update payment details or review a refund request, open billing from here.
          </p>
          <div className="pricing-refund-actions">
            <button
              type="button"
              className="pricing-secondary-btn"
              onClick={openPortal}
              disabled={busyAction === "portal"}
            >
              {busyAction === "portal" ? "Opening..." : "Manage Billing"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
