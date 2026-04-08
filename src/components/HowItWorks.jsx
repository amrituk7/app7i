import { Link } from "react-router-dom";

const STEPS = [
  {
    num: 1,
    title: "Create your profile",
    desc: "Set up your instructor profile in minutes. Add your details, teaching areas, and availability.",
    visual: (
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-3 dark:bg-slate-800">
        <div className="h-8 w-8 rounded-full bg-emerald-600" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">@sarah_drives</span>
      </div>
    ),
  },
  {
    num: 2,
    title: "Share your QR code",
    desc: "Generate your unique QR code. Students scan it to connect with you instantly.",
    visual: (
      <div className="relative mt-4 flex justify-center">
        <div className="grid h-24 w-24 grid-cols-5 gap-1 rounded-xl bg-white p-3 shadow-md dark:bg-slate-800">
          {Array(25).fill(0).map((_, i) => (
            <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? "bg-slate-900 dark:bg-white" : "bg-transparent"}`} />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-1 w-20 animate-scan bg-emerald-500/50" />
        </div>
      </div>
    ),
  },
  {
    num: 3,
    title: "Students connect",
    desc: "Students join your network. Track their progress, schedule lessons, and manage payments.",
    visual: (
      <div className="mt-4 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <svg className="h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">How It Works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Get started in 3 simple steps
          </h2>
        </div>

        {/* Animated Car */}
        <div className="relative mx-auto mt-12 h-32 max-w-2xl overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-8 rounded-t-lg bg-slate-200 dark:bg-slate-700">
            <div className="absolute top-3 left-0 right-0 flex gap-8 animate-road">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="h-1.5 w-12 flex-shrink-0 rounded bg-amber-400" />
              ))}
            </div>
          </div>
          <div className="absolute bottom-6 animate-car">
            <div className="relative">
              <svg width="120" height="60" viewBox="0 0 120 60" fill="none">
                <ellipse cx="60" cy="55" rx="50" ry="5" fill="rgba(0,0,0,0.1)" />
                <path d="M15 38L20 38L28 22L45 15L75 15L92 22L100 38L105 38L107 42L107 48L13 48L13 42Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                <path d="M46 18L43 35L58 35L58 18Z" fill="#1e3a5f" />
                <path d="M62 18L62 35L88 35L92 18Z" fill="#1e3a5f" />
                <rect x="48" y="8" width="24" height="8" rx="2" fill="white" stroke="#e5e7eb" />
                <rect x="56" y="10" width="8" height="4" rx="1" fill="#dc2626" />
                <circle cx="30" cy="48" r="8" fill="#1f2937" />
                <circle cx="30" cy="48" r="5" fill="#4b5563" />
                <circle cx="90" cy="48" r="8" fill="#1f2937" />
                <circle cx="90" cy="48" r="5" fill="#4b5563" />
              </svg>
              <div className="absolute -right-2 -top-8 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-medium text-white shadow-lg">
                Scan & Connect!
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-800/50"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {step.num}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{step.desc}</p>
              {step.visual}
            </div>
          ))}
        </div>

        {/* Early access callout */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 p-8 text-center text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-white/80">Early Access — First 50 Instructors</p>
          <p className="mt-3 text-2xl font-semibold">Get App7i for £11.99/month — locked in while active.</p>
          <Link
            to="/register-instructor"
            className="mt-6 inline-flex rounded-full bg-white px-8 py-3 text-sm font-semibold text-emerald-700 shadow-lg transition hover:bg-slate-50"
          >
            Claim Early Access
          </Link>
        </div>
      </div>
    </section>
  );
}
