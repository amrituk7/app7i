import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="lp-brand-gradient py-20 text-white md:py-24">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Ready to transform your teaching?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/80">
          Replace the admin clutter with one instructor workflow that handles attendance, payments, scheduling, and communication.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register-instructor"
            className="inline-flex min-w-[220px] items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-[#2d3b2d] transition hover:bg-white/90"
          >
            Claim Early Access
          </Link>
          <Link
            to="/login"
            className="inline-flex min-w-[220px] items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Log In
          </Link>
        </div>
        <p className="mt-4 text-sm text-white/70">3-day free trial. Secure payments via Stripe.</p>
      </div>
    </section>
  );
}

