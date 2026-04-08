import { useState } from "react";
import { Link } from "react-router-dom";

const PLANS = [
  {
    name: "Starter",
    monthlyPrice: "£9.99",
    yearlyPrice: "£99",
    features: ["Up to 10 students", "Basic scheduling", "Payment tracking", "Email support"],
  },
  {
    name: "Pro",
    monthlyPrice: "£11.99",
    yearlyPrice: "£99.99",
    featured: true,
    badge: "Early Access",
    features: ["Unlimited students", "Advanced scheduling", "Payment tracking", "WhatsApp integration", "Progress reports", "Priority support"],
  },
  {
    name: "Business",
    monthlyPrice: "£29.99",
    yearlyPrice: "£299",
    features: ["Everything in Pro", "Multi-instructor", "Custom branding", "API access", "Dedicated support"],
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="bg-slate-50 py-24 dark:bg-slate-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Pricing</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-400">
            Start free for 3 days. No credit card required.
          </p>
        </div>

        {/* Toggle */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <span className={`text-sm font-medium ${!isYearly ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>
            Monthly
          </span>
          <button
            type="button"
            onClick={() => setIsYearly(!isYearly)}
            className={`relative h-7 w-12 rounded-full transition-colors ${isYearly ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-600"}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${isYearly ? "left-6" : "left-1"}`}
            />
          </button>
          <span className={`text-sm font-medium ${isYearly ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>
            Yearly
            <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
              Save 17%
            </span>
          </span>
        </div>

        {/* Plans */}
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 transition-all ${
                plan.featured
                  ? "scale-105 border-emerald-500 bg-emerald-600 text-white shadow-xl"
                  : "border-slate-200 bg-white hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-1 text-xs font-semibold text-amber-900">
                  {plan.badge}
                </span>
              )}
              <h3 className={`text-lg font-semibold ${plan.featured ? "text-white" : "text-slate-900 dark:text-white"}`}>
                {plan.name}
              </h3>
              <div className="mt-4">
                <span className={`text-4xl font-bold ${plan.featured ? "text-white" : "text-slate-900 dark:text-white"}`}>
                  {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                <span className={`text-sm ${plan.featured ? "text-white/80" : "text-slate-500"}`}>
                  /{isYearly ? "year" : "month"}
                </span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <svg
                      className={`h-5 w-5 flex-shrink-0 ${plan.featured ? "text-white" : "text-emerald-600"}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className={`text-sm ${plan.featured ? "text-white/90" : "text-slate-600 dark:text-slate-400"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register-instructor"
                className={`mt-8 block w-full rounded-full py-3 text-center text-sm font-semibold transition ${
                  plan.featured
                    ? "bg-white text-emerald-700 hover:bg-slate-50"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                Claim Early Access
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          Lock in £11.99/month — price increases after early access.
        </p>
      </div>
    </section>
  );
}
