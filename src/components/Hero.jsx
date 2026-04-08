import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-br from-[#3D3229] via-[#2D3B2D] to-[#1F3026]">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#4A5D4A]/20 blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#5C4D3C]/20 blur-[80px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-sm font-medium text-amber-300 mb-6 animate-fade-in">
              Early Access - First 50 Instructors
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight">
              Run your classes
              <br />
              <span className="text-white/70">without the chaos</span>
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              App7i automates attendance, payments, scheduling, and communication so you can focus on teaching.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/register-instructor" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#2D3B2D] font-medium rounded-lg shadow-lg hover:bg-white/90 hover:-translate-y-0.5 transition-all">
                Claim Early Access
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/30 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all">
                Log In
              </Link>
            </div>
            <p className="mt-6 text-sm text-white/60">
              Lock in GBP 11.99/month instead of GBP 19.99/month while your subscription remains active
            </p>
          </div>

          <div className="relative lg:pl-8">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-2xl shadow-black/20 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-sm text-[#5C5347]">Good morning, Sarah</p>
                    <h3 className="text-lg font-semibold text-[#2D3B2D]">Your Dashboard</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#2D3B2D]/10 flex items-center justify-center text-sm font-bold text-[#2D3B2D]">7i</div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-blue-50 p-4 hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2} /><path strokeWidth={2} d="M16 2v4M8 2v4M3 10h18" /></svg>
                    <p className="text-2xl font-bold text-[#2D3B2D]">4</p>
                    <p className="text-xs text-[#5C5347]">Lessons Today</p>
                  </div>
                  <div className="rounded-xl bg-green-50 p-4 hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" strokeWidth={2} /><path strokeWidth={2} d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                    <p className="text-2xl font-bold text-[#2D3B2D]">12</p>
                    <p className="text-xs text-[#5C5347]">Students</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-4 hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 text-amber-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                    <p className="text-2xl font-bold text-[#2D3B2D]">GBP 840</p>
                    <p className="text-xs text-[#5C5347]">This Month</p>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-sm font-medium text-[#2D3B2D] mb-3">Next Up</p>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-[#E8E4DD] bg-[#FAF8F5]/50">
                    <div className="w-10 h-10 rounded-lg bg-[#2D3B2D] text-white flex items-center justify-center text-sm font-bold">9:00</div>
                    <div>
                      <p className="font-medium text-[#2D3B2D]">James Wilson</p>
                      <p className="text-sm text-[#5C5347]">Lesson 8 - Roundabouts</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white p-3 rounded-lg border border-[#E8E4DD] shadow-lg">
                <p className="text-xs text-[#5C5347]">New booking!</p>
                <p className="text-sm font-medium text-[#2D3B2D]">Emma - Tomorrow 2pm</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
