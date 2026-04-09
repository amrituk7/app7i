import { Link } from "react-router-dom";

const steps = [
  {
    number: "01",
    title: "Set up your instructor profile",
    description: "Create your account, add your details, and get a clean home base for lessons, students, and admin.",
  },
  {
    number: "02",
    title: "Invite students in seconds",
    description: "Share your link or QR code so students can access their portal without extra setup or back-and-forth.",
  },
  {
    number: "03",
    title: "Run everything from one place",
    description: "Track lessons, payments, messages, and progress from a workflow that stays tidy as your business grows.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#F3EEE6] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="lp-eyebrow">How it works</p>
            <h2 className="mt-4 lp-display text-4xl sm:text-5xl">A cleaner workflow from day one.</h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#5C5347]">
              The product should feel straightforward. No clunky setup. No scattered tools. Just a clear path from sign-up to a better-run diary.
            </p>
            <div className="mt-8 rounded-[28px] bg-[#2D3B2D] p-6 text-white shadow-xl shadow-[#2D3B2D]/10">
              <p className="text-sm uppercase tracking-[0.18em] text-white/55">Early access</p>
              <p className="mt-3 text-2xl font-semibold">First 50 instructors lock in the launch price.</p>
              <Link
                to="/register-instructor"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 font-medium text-[#2D3B2D] transition-all hover:-translate-y-0.5 hover:bg-white/92"
              >
                Claim early access
              </Link>
            </div>
          </div>

          <div className="grid gap-5">
            {steps.map((step) => (
              <div key={step.number} className="rounded-[28px] border border-[#DED4C8] bg-[#FFFDF9] p-7 shadow-[0_20px_50px_rgba(45,59,45,0.05)]">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8B6F47]">{step.number}</p>
                    <h3 className="mt-3 text-2xl font-semibold text-[#2D3B2D]">{step.title}</h3>
                    <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#5C5347]">{step.description}</p>
                  </div>
                  <div className="rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm font-medium text-[#2D3B2D] ring-1 ring-[#E8E4DD]">
                    App7i step {step.number}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
