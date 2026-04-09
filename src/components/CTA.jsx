import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="bg-[#FAF8F5] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#3D3229] via-[#2D3B2D] to-[#1F3026] px-6 py-16 text-center shadow-[0_36px_90px_rgba(31,48,38,0.24)] sm:px-16 md:py-24">
          <div className="absolute -top-20 left-0 h-64 w-64 rounded-full bg-white/8 blur-[100px]" />
          <div className="absolute -bottom-20 right-0 h-64 w-64 rounded-full bg-[#C4A77D]/14 blur-[100px]" />
          <p className="relative text-sm font-semibold uppercase tracking-[0.2em] text-white/55">Final step</p>
          <h2 className="relative mt-4 lp-display text-4xl text-white sm:text-5xl md:text-6xl">Make the admin side feel lighter.</h2>
          <p className="relative mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/76">
            Start with the instructor workflow that matters most: keep your diary clean, your students updated, and your business easier to run.
          </p>
          <div className="relative mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/register-instructor"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-medium text-[#2D3B2D] transition-all hover:-translate-y-0.5 hover:bg-white/92"
            >
              Claim early access
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-8 py-4 font-medium text-white transition-all hover:bg-white/18">
              Log In
            </Link>
          </div>
          <p className="relative mt-6 text-sm text-white/60">Early access pricing stays at GBP 11.99/month while your subscription remains active.</p>
        </div>
      </div>
    </section>
  );
}
