import type { AppUser } from "../types";

// Mobile billing gate.
//
// The Android app cannot sell subscriptions in-app, so unpaid instructors are
// locked and sent to the web portal to subscribe/manage. Missing, empty, "none"
// and "unpaid" statuses are treated as unpaid. Only an active subscription or a
// valid trial unlocks instructor access.

function isEntitled(user: AppUser): boolean {
  const status = user.subscriptionStatus;
  if (status === "active") return true;
  if (status === "trialing") {
    if (!user.trialEnd) return true;
    return user.trialEnd > Date.now();
  }
  return false;
}

export function isInstructorPaywalled(user: AppUser | null): boolean {
  if (!user) return false;
  if (user.role !== "instructor") return false;
  return !isEntitled(user);
}

export function paywallReason(user: AppUser | null): "expired_trial" | "past_due" | "cancelled" | "unpaid" {
  const status = user?.subscriptionStatus;
  if (status === "trial_expired") return "expired_trial";
  if (status === "trialing") return "expired_trial";
  if (status === "past_due") return "past_due";
  if (status === "cancelled" || status === "canceled") return "cancelled";
  return "unpaid";
}

// Payment, refunds and billing history are handled on the secure web portal.
export const BILLING_WEB_URL = "https://app7i.com/pricing";

// Keep in sync with the web pricing page and Stripe.
export const INSTRUCTOR_PLAN = {
  name: "Instructor Plus",
  trialDays: 5,
  refundDays: 14,
  monthly: {
    interval: "monthly",
    price: "£11.99",
    period: "per month",
    note: "Billed monthly",
  },
  yearly: {
    interval: "yearly",
    price: "£119.99",
    period: "per year",
    perMonth: "£10",
    note: "Billed yearly",
    savePercent: 17,
  },
} as const;

export type PlanInterval = "monthly" | "yearly";
