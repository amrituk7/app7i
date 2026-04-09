import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#3D3229] via-[#2D3B2D] to-[#1F3026] pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_60%)]" />
      <div className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-[#5C7A5C]/20 blur-[100px]" />
      <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-[#C4A77D]/15 blur-[100px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80">
            Built for independent driving instructors
          </div>
          <h1 className="mt-6 lp-display text-5xl leading-[0.95] text-white sm:text-6xl md:text-7xl">
            Run your driving school without the admin drag.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/76 lg:mx-0">
            App7i brings bookings, student progress, payments, and messages into one calm dashboard so your business feels organised from the first lesson.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              to="/register-instructor"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 font-medium text-[#2D3B2D] shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-white/90"
            >
              Claim early access
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/8 px-6 py-3.5 font-medium text-white transition-all hover:bg-white/14"
            >
              Log In
            </Link>
          </div>
          <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">Admin</p>
              <p className="mt-2 text-base font-semibold text-white">Lessons, payments, and messages in one place</p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">Students</p>
              <p className="mt-2 text-base font-semibold text-white">Share progress and upcoming lessons clearly</p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">Offer</p>
              <p className="mt-2 text-base font-semibold text-white">Early access at GBP 11.99/month</p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl">
          <div className="overflow-hidden rounded-[28px] border border-white/12 bg-[#F8F4EC] shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
            <div className="border-b border-[#E3DBD0] bg-white px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5C5347]">Today at a glance</p>
                  <h3 className="text-xl font-semibold text-[#2D3B2D]">Instructor dashboard</h3>
                </div>
                <div className="rounded-xl bg-[#2D3B2D] px-3 py-2 text-sm font-semibold text-white">App7i</div>
              </div>
            </div>

            <div className="grid gap-4 p-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#E8E4DD]">
                  <p className="text-xs uppercase tracking-wide text-[#5C5347]">Lessons</p>
                  <p className="mt-2 text-3xl font-semibold text-[#2D3B2D]">4</p>
                  <p className="text-sm text-[#5C5347]">Booked today</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#E8E4DD]">
                  <p className="text-xs uppercase tracking-wide text-[#5C5347]">Students</p>
                  <p className="mt-2 text-3xl font-semibold text-[#2D3B2D]">12</p>
                  <p className="text-sm text-[#5C5347]">Active learners</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#E8E4DD]">
                  <p className="text-xs uppercase tracking-wide text-[#5C5347]">Revenue</p>
                  <p className="mt-2 text-3xl font-semibold text-[#2D3B2D]">GBP 840</p>
                  <p className="text-sm text-[#5C5347]">This month</p>
                </div>
              </div>

              <div className="grid gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#E8E4DD]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#5C5347]">Next lesson</p>
                    <p className="text-xl font-semibold text-[#2D3B2D]">James Wilson</p>
                  </div>
                  <div className="rounded-2xl bg-[#2D3B2D] px-4 py-3 text-center text-white">
                    <p className="text-xs uppercase tracking-wide text-white/60">Start</p>
                    <p className="text-lg font-semibold">9:00</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#FAF8F5] p-4">
                    <p className="text-sm font-medium text-[#2D3B2D]">Lesson focus</p>
                    <p className="mt-1 text-sm text-[#5C5347]">Roundabouts, lane discipline, mock test route</p>
                  </div>
                  <div className="rounded-2xl bg-[#FAF8F5] p-4">
                    <p className="text-sm font-medium text-[#2D3B2D]">Student status</p>
                    <p className="mt-1 text-sm text-[#5C5347]">Test readiness 87%, theory passed, practical booked</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-[#2D3B2D] p-5 text-white">
                <p className="text-sm text-white/70">Why instructors switch</p>
                <p className="mt-2 text-lg font-semibold">Less diary chasing, fewer payment gaps, clearer student progress.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
