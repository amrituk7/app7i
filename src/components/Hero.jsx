import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 pt-16">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-32">
        {/* Left: Copy */}
        <div className="flex flex-col justify-center text-center lg:text-left">
          <div className="mb-6 inline-flex items-center justify-center gap-2 self-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 lg:self-start">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Early Access — First 50 Instructors
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Run your classes
            <br />
            <span className="text-white/70">without the chaos</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/80 lg:mx-0">
            App7i automates attendance, payments, scheduling, and communication — so you can focus on teaching.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
            <Link
              to="/register-instructor"
              className="w-full rounded-full bg-white px-8 py-4 text-center text-base font-semibold text-emerald-700 shadow-xl transition hover:bg-slate-50 sm:w-auto"
            >
              Claim Early Access
            </Link>
            <Link
              to="/login"
              className="w-full rounded-full border border-white/30 bg-white/10 px-8 py-4 text-center text-base font-semibold text-white transition hover:bg-white/20 sm:w-auto"
            >
              I&apos;m an Instructor
            </Link>
          </div>

          <p className="mt-6 text-sm text-white/60">
            Join now and lock in £11.99/month — before prices go up.
          </p>
        </div>

        {/* Right: Dashboard Preview */}
        <div className="relative flex items-center justify-center lg:justify-end">
          <div className="relative w-full max-w-md">
            {/* Main card */}
            <div className="rounded-3xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-sm dark:bg-slate-900/95">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Good morning, Sarah</p>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Your Dashboard</h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
                  <span className="text-sm font-bold text-white">7i</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Lessons" value="4" color="bg-emerald-50 dark:bg-emerald-900/30" />
                <StatCard label="Students" value="12" color="bg-amber-50 dark:bg-amber-900/30" />
                <StatCard label="Earnings" value="£840" color="bg-blue-50 dark:bg-blue-900/30" accent />
              </div>

              {/* Next lesson */}
              <div className="mt-6">
                <p className="mb-3 text-sm font-medium text-slate-900 dark:text-white">Next Lesson</p>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                    9:00
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">James Wilson</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Lesson 8 — Roundabouts</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating notification */}
            <div className="absolute -right-4 -top-4 animate-float rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">New booking!</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Emma — Tomorrow 2pm</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, color, accent }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className={`text-2xl font-bold ${accent ? "text-emerald-600" : "text-slate-900 dark:text-white"}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
