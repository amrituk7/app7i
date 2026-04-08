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
  return (
    <section id="pricing" className="bg-soft py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-moss">Simple pricing</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-forest sm:text-4xl md:text-5xl">
            One plan. Everything included.
          </h2>
          <p className="mt-4 text-lg text-body">No add-ons. No per-student fees. No hidden costs.</p>
        </div>

        <div className="mx-auto mt-16 max-w-lg">
          <div className="relative overflow-hidden rounded-3xl border-2 border-forest/20 bg-paper p-8 shadow-xl shadow-forest/5 md:p-10">
            <div className="absolute -right-12 top-6 rotate-45 bg-forest px-12 py-1 text-xs font-semibold text-white">
              Early Access
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-forest">{"\u00A311.99"}</span>
              <span className="text-body">/month</span>
            </div>

            <p className="mt-4 text-body">Everything you need to run your driving school professionally.</p>

            <Link
              to="/register-instructor"
              className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-forest px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-pine"
            >
              Claim Early Access
            </Link>

            <p className="mt-4 text-center text-sm text-body">Lock in £11.99/month — price increases after early access.</p>

            <div className="mt-8 border-t border-line pt-8">
              <ul className="grid gap-3 sm:grid-cols-2">
                {includedFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-moss/10">
                      <svg viewBox="0 0 16 16" className="h-3 w-3 fill-none stroke-moss stroke-[2.2]">
                        <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                      </svg>
                    </div>
                    <span className="text-sm text-forest">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
