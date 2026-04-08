import { Link } from "react-router-dom";

const heroStats = [
  {
    title: "Lessons Today",
    value: "4",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 2.5v3M16 2.5v3M4 8.5h16M5.5 4.5h13A1.5 1.5 0 0 1 20 6v12.5A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5V6A1.5 1.5 0 0 1 5.5 4.5Z" />
      </svg>
    ),
    tint: "bg-[#8B6F47]/10 text-[#8B6F47]",
  },
  {
    title: "Students",
    value: "12",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="8" cy="8" r="3" />
        <circle cx="16.5" cy="7" r="2.5" />
        <path d="M3.5 18.5a4.5 4.5 0 0 1 9 0M13.5 18.5a3.5 3.5 0 0 1 7 0" />
      </svg>
    ),
    tint: "bg-[#5C7A5C]/10 text-[#5C7A5C]",
  },
  {
    title: "This Month",
    value: "\u00A3840",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 3.5c-2.8 0-4.75 1.83-4.75 4.55 0 1.3.46 2.45 1.25 3.45H7v1.8h3.95c-.32 2.13-1.63 3.54-4.1 4.7h10.65" />
      </svg>
    ),
    tint: "bg-[#9A8A3D]/10 text-[#9A8A3D]",
  },
];

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden pb-16 pt-24 md:pb-24 md:pt-32"
      style={{ background: "linear-gradient(135deg, #3D3229 0%, #2D3B2D 50%, #1F3026 100%)" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#5C7A5C]/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#8B6F47]/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <div className="animate-fade-in-up mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90">
              Built for UK driving instructors
            </div>

            <h1 className="animate-fade-in-up animation-delay-100 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Run your lessons.
              <br />
              <span className="text-white/70">Not your paperwork.</span>
            </h1>

            <p className="animate-fade-in-up animation-delay-200 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/80 lg:mx-0">
              A complete toolkit for driving instructors: bookings, progress tracking, earnings, invoices, and a
              student portal.
            </p>

            <div className="animate-fade-in-up animation-delay-300 mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <Link
                to="/register-instructor"
                className="inline-flex items-center justify-center rounded-full bg-cream px-6 py-3.5 text-base font-semibold text-forest shadow-lg shadow-black/20 transition hover:bg-soft"
              >
                Claim Early Access
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-white/20"
              >
                {"I'm an Instructor"}
              </Link>
            </div>

            <p className="animate-fade-in-up animation-delay-400 mt-6 text-sm text-white/60">
              No contract. Cancel any time. 3-day free trial.
            </p>
          </div>

          <div className="animate-fade-in-up animation-delay-300 relative lg:pl-8">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="rounded-2xl border border-white/15 bg-paper/95 p-6 shadow-2xl shadow-black/20 backdrop-blur-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-body">Good morning, Sarah</p>
                    <h3 className="text-lg font-semibold text-forest">Your Dashboard</h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest/10">
                    <span className="text-sm font-bold text-forest">7i</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {heroStats.map((stat) => (
                    <div key={stat.title} className={`rounded-xl p-4 transition-transform hover:scale-105 ${stat.tint}`}>
                      <div className="mb-2">{stat.icon}</div>
                      <p className="text-2xl font-bold text-forest">{stat.value}</p>
                      <p className="text-xs text-body">{stat.title}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  <p className="text-sm font-medium text-forest">Next Up</p>
                  <div className="flex items-center gap-3 rounded-lg border border-line bg-soft p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest text-sm font-bold text-white">
                      9:00
                    </div>
                    <div>
                      <p className="font-medium text-forest">James Wilson</p>
                      <p className="text-sm text-body">Lesson 8 - Roundabouts</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="animate-float absolute -right-4 -top-4 rounded-lg border border-line bg-paper p-3 shadow-lg shadow-black/10">
                <p className="text-xs text-body">New booking!</p>
                <p className="text-sm font-medium text-forest">Emma - Tomorrow 2pm</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
