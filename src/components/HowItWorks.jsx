import { Link } from "react-router-dom";

const steps = [
  {
    number: "1",
    title: "Create profile",
    description: "Set up your instructor account and get a searchable username.",
    detail: "@sarah_drives",
    visual: (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 dark:border-slate-700 dark:bg-slate-900/80">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Username preview</p>
        <p className="mt-3 text-2xl font-semibold text-primary">@sarah_drives</p>
      </div>
    ),
  },
  {
    number: "2",
    title: "Share QR code",
    description: "Print or message your QR code so students can connect instantly.",
    visual: (
      <div className="relative mx-auto h-28 w-28 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
        <div className="grid h-full grid-cols-5 gap-1">
          {Array.from({ length: 25 }).map((_, index) => (
            <div
              key={index}
              className={[
                "rounded-sm",
                [0,1,3,5,6,8,10,11,13,15,16,18,20,21,23].includes(index)
                  ? "bg-slate-900 dark:bg-white"
                  : "bg-slate-200 dark:bg-slate-700",
              ].join(" ")}
            />
          ))}
        </div>
        <span className="absolute left-2 right-2 h-1 rounded-full bg-primary/70 shadow-[0_0_18px_rgba(79,70,229,0.55)] animate-scan" />
      </div>
    ),
  },
  {
    number: "3",
    title: "Students connect",
    description: "They scan, join, and start booking with no app confusion.",
    visual: (
      <div className="flex h-28 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 12.5 9.5 17 19 7.5" />
          </svg>
        </div>
      </div>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#faf8f5] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="lp-eyebrow">How It Works</p>
          <h2 className="lp-title mt-3 text-4xl sm:text-5xl">
            Get started in 3 simple steps
          </h2>
          <p className="lp-copy mx-auto mt-4 max-w-2xl text-lg">
            Set up your profile, share your link, and bring students into one clear workflow.
          </p>
        </div>

        <div className="lp-surface relative mt-12 overflow-hidden rounded-[2rem] px-6 py-8">
          <div className="absolute inset-x-6 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#e8e0d4]" />
          <div className="relative h-24 overflow-hidden">
            <div className="absolute bottom-2 w-28 animate-car">
              <div className="relative rounded-3xl bg-[#2d3b2d] px-4 py-3 text-white shadow-xl shadow-black/10">
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#2d3b2d] shadow-md">
                  Scan &amp; Connect!
                </span>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white/20 px-2 py-1 text-xs font-semibold">L</div>
                  <div className="flex-1">
                    <div className="h-2 w-10 rounded-full bg-white/40" />
                    <div className="mt-2 h-2 w-14 rounded-full bg-white/25" />
                  </div>
                </div>
                <div className="absolute -bottom-3 left-4 h-6 w-6 rounded-full border-4 border-white bg-slate-900" />
                <div className="absolute -bottom-3 right-4 h-6 w-6 rounded-full border-4 border-white bg-slate-900" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.number}
              className="lp-surface rounded-[2rem] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#2d3b2d] text-sm font-semibold text-white">
                {step.number}
              </span>
              <h3 className="mt-4 text-xl font-semibold text-[#2d3b2d]">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#5c5347]">{step.description}</p>
              <div className="mt-6">{step.visual}</div>
              {step.detail && <p className="mt-3 text-sm text-[#5c5347]">{step.detail}</p>}
            </article>
          ))}
        </div>

        <div className="lp-brand-gradient mt-10 rounded-[2rem] px-6 py-8 text-white shadow-xl shadow-black/10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">Early Access - First 50 Instructors</p>
              <p className="mt-3 text-2xl font-semibold">Get App7i for £11.99/month (locked in while active).</p>
            </div>
            <Link
              to="/register-instructor"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-[#2d3b2d] transition hover:bg-white/90"
            >
              Claim Early Access
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

