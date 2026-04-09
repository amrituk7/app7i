import { useState } from "react";
import { Link } from "react-router-dom";

const includedFeatures = [
  "Unlimited students",
  "Unlimited lessons",
  "Earnings dashboard and CSV export",
  "Professional lesson invoices",
  "Student portal with progress tracking",
  "In-app messaging",
  "Calendar view",
  "Waiting list",
  "Car details and MOT/insurance alerts",
  "Mobile-ready on any device",
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="bg-[#FAF8F5] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="lp-eyebrow">Simple pricing</p>
          <h2 className="mt-4 lp-display text-4xl sm:text-5xl">One plan. No clutter.</h2>
          <p className="mt-5 text-lg text-[#5C5347]">A single instructor plan with the tools people actually care about, not a page full of upsells.</p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm ${!isYearly ? "font-semibold text-[#2D3B2D]" : "text-[#5C5347]"}`}>Monthly</span>
          <button onClick={() => setIsYearly(!isYearly)} className="relative w-14 h-7 bg-[#E8E4DD] rounded-full hover:bg-[#DDD9D2] transition-colors">
            <div className={`absolute top-0.5 w-6 h-6 bg-[#2D3B2D] rounded-full transition-transform ${isYearly ? "translate-x-7" : "translate-x-0.5"}`} />
          </button>
          <span className={`text-sm ${isYearly ? "font-semibold text-[#2D3B2D]" : "text-[#5C5347]"}`}>Yearly</span>
          {isYearly && <span className="px-3 py-1 text-xs font-semibold bg-[#7A9B7A]/20 text-[#5C7A5C] rounded-full">Save 30%</span>}
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[32px] border border-[#DED4C8] bg-[#FFFDF9] p-8 shadow-[0_22px_60px_rgba(45,59,45,0.06)] md:p-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8B6F47]">Instructor plan</p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-5xl font-semibold text-[#2D3B2D]">{isYearly ? "GBP 99.99" : "GBP 11.99"}</span>
                  <span className="pb-1 text-[#5C5347]">/{isYearly ? "year" : "month"}</span>
                </div>
                {isYearly && <p className="mt-2 text-sm text-[#5C5347]"><span className="line-through">GBP 143.88</span> if paid monthly</p>}
                <p className="mt-3 text-sm font-medium text-[#8B6F47]">Normally GBP 19.99/month while closed beta pricing is active.</p>
              </div>
              <div className="rounded-2xl bg-[#F3EEE6] px-4 py-3 text-sm font-medium text-[#2D3B2D]">
                3-day free trial
              </div>
            </div>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#5C5347]">
              This plan covers the core instructor workflow: diary, students, progress, invoicing, messages, and the student portal.
            </p>

            <div className="mt-8 pt-8 border-t border-[#E8E4DD]">
              <ul className="grid gap-3 sm:grid-cols-2">
                {includedFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#7A9B7A]/20 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-[#5C7A5C]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm text-[#2D3B2D]">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-[32px] bg-[#2D3B2D] p-8 text-white shadow-[0_28px_70px_rgba(31,48,38,0.2)] md:p-10">
            <p className="text-sm uppercase tracking-[0.18em] text-white/55">Launch offer</p>
            <h3 className="mt-4 text-3xl font-semibold">Get in early and keep the lower rate while subscribed.</h3>
            <p className="mt-4 text-base leading-relaxed text-white/72">
              No per-student fee. No tier maze. No separate portal upgrade. The pricing stays clear because the product should too.
            </p>
            <Link
              to="/register-instructor"
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-3.5 font-medium text-[#2D3B2D] transition-all hover:-translate-y-0.5 hover:bg-white/92"
            >
              Claim early access
            </Link>
            <p className="mt-4 text-center text-sm text-white/60">Payments handled securely at checkout.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
