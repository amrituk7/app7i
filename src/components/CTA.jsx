import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 py-24">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to transform your teaching?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
          Join the next generation of UK instructors modernising their workflow.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/register-instructor"
            className="w-full rounded-full bg-white px-8 py-4 text-base font-semibold text-emerald-700 shadow-xl transition hover:bg-slate-50 sm:w-auto"
          >
            Claim Early Access
          </Link>
          <Link
            to="/login"
            className="w-full rounded-full border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/20 sm:w-auto"
          >
            I&apos;m an Instructor
          </Link>
        </div>

        <p className="mt-8 text-sm text-white/60">
          3-day free trial. Secure payments via Stripe.
        </p>
      </div>
    </section>
  );
}
