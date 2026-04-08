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
    <section id="pricing" className="bg-[#FAF8F5] py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#5C7A5C]">Simple pricing</p>
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-[#2D3B2D] tracking-tight">One plan. Everything included.</h2>
          <p className="mt-4 text-lg text-[#5C5347]">No add-ons. No per-student fees. No hidden costs.</p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm ${!isYearly ? "font-semibold text-[#2D3B2D]" : "text-[#5C5347]"}`}>Monthly</span>
          <button onClick={() => setIsYearly(!isYearly)} className="relative w-14 h-7 bg-[#E8E4DD] rounded-full hover:bg-[#DDD9D2] transition-colors">
            <div className={`absolute top-0.5 w-6 h-6 bg-[#2D3B2D] rounded-full transition-transform ${isYearly ? "translate-x-7" : "translate-x-0.5"}`} />
          </button>
          <span className={`text-sm ${isYearly ? "font-semibold text-[#2D3B2D]" : "text-[#5C5347]"}`}>Yearly</span>
          {isYearly && <span className="px-3 py-1 text-xs font-semibold bg-[#7A9B7A]/20 text-[#5C7A5C] rounded-full">Save 30%</span>}
        </div>

        <div className="max-w-lg mx-auto">
          <div className="relative bg-white border-2 border-[#2D3B2D]/20 rounded-3xl p-8 md:p-10 shadow-xl shadow-[#2D3B2D]/5 overflow-hidden">
            <div className="absolute -right-12 top-6 rotate-45 bg-[#2D3B2D] px-12 py-1 text-xs font-semibold text-white">Early Access</div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-[#2D3B2D]">{isYearly ? "GBP 99.99" : "GBP 11.99"}</span>
              <span className="text-[#5C5347]">/{isYearly ? "year" : "month"}</span>
            </div>
            {isYearly && <p className="mt-2 text-sm text-[#5C5347]"><span className="line-through">GBP 143.88</span> if paid monthly</p>}
            <p className="mt-2 text-sm text-amber-600 font-medium">Normally GBP 19.99/month - locked while subscribed</p>
            <p className="mt-4 text-[#5C5347]">Everything you need to run your driving school professionally.</p>

            <Link to="/register-instructor" className="block w-full mt-8 py-3 text-center bg-[#2D3B2D] text-white font-medium rounded-lg shadow-lg shadow-[#2D3B2D]/25 hover:bg-[#3D4B3D] hover:shadow-xl transition-all">
              Claim Early Access
            </Link>
            <p className="mt-4 text-center text-sm text-[#5C5347]">3-day free trial. Payments via Stripe.</p>

            <div className="mt-8 pt-8 border-t border-[#E8E4DD]">
              <ul className="grid sm:grid-cols-2 gap-3">
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

          <p className="mt-8 text-center text-sm text-[#5C5347]">
            Want your own branded app with a custom name and logo? <a href="#" className="font-medium text-[#2D3B2D] hover:underline">Contact us</a> for a custom quote.
          </p>
        </div>
      </div>
    </section>
  );
}
