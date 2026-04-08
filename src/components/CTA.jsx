import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-[#3D3229] via-[#2D3B2D] to-[#1F3026]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl px-6 py-16 sm:px-16 md:py-24 text-center overflow-hidden">
          <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-[#5C7A5C]/20 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-[#8B6F47]/20 blur-[80px] pointer-events-none" />
          <h2 className="relative text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">Ready to get organised?</h2>
          <p className="relative mt-4 text-lg text-white/80 max-w-xl mx-auto">Join instructors who have already swapped the spreadsheets for App7i.</p>
          <div className="relative mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register-instructor" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#2D3B2D] font-medium rounded-lg hover:bg-white/90 hover:-translate-y-0.5 transition-all">
              Claim Early Access
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/30 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all">
              Log In
            </Link>
          </div>
          <p className="relative mt-6 text-sm text-white/60">Lock in GBP 11.99/month while your subscription remains active.</p>
        </div>
      </div>
    </section>
  );
}
