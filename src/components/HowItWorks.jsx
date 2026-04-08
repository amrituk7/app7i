import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function HowItWorks() {
  const [carPosition, setCarPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarPosition((prev) => (prev >= 100 ? 0 : prev + 0.5));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-[#FAF8F5] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#5C7A5C]">How it works</p>
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-[#2D3B2D]">How It Works</h2>
          <p className="mt-4 text-lg text-[#5C5347]">Get set up in minutes. No apps, no setup, no hassle.</p>
        </div>

        <div className="relative mb-16">
          <div className="h-24 bg-gradient-to-r from-[#3D3229] via-[#2D3B2D] to-[#1F3026] rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-1 flex gap-8 px-4">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="w-12 h-1 bg-white/40 rounded-full flex-shrink-0" />
                ))}
              </div>
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 transition-none" style={{ left: `${carPosition}%`, transform: "translateY(-50%) translateX(-50%)" }}>
              <div className="relative">
                <svg width="80" height="40" viewBox="0 0 80 40" className="drop-shadow-lg">
                  <path d="M10 25 L15 15 L30 10 L55 10 L65 15 L70 25 L70 30 L10 30 Z" fill="#C9B96D" />
                  <path d="M20 15 L28 12 L45 12 L50 15 L48 22 L22 22 Z" fill="#87CEEB" opacity="0.8" />
                  <rect x="32" y="2" width="16" height="10" rx="2" fill="white" />
                  <text x="40" y="10" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#DC2626">L</text>
                  <circle cx="20" cy="32" r="6" fill="#333" />
                  <circle cx="20" cy="32" r="3" fill="#666" />
                  <circle cx="60" cy="32" r="6" fill="#333" />
                  <circle cx="60" cy="32" r="3" fill="#666" />
                  <rect x="68" y="22" width="4" height="4" rx="1" fill="#FEF08A" />
                  <rect x="8" y="22" width="3" height="4" rx="1" fill="#EF4444" />
                </svg>
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap animate-pulse">
                  <p className="text-xs font-medium text-[#2D3B2D]">Scan & Connect!</p>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="relative group">
            <div className="bg-white rounded-2xl border border-[#E8E4DD] p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#C4A77D]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-xl font-bold text-[#8B6F47]">1</span>
              </div>
              <h3 className="text-xl font-semibold text-[#2D3B2D] mb-3">Create your instructor profile</h3>
              <p className="text-[#5C5347] leading-relaxed">Sign up and get your App7i username in under a minute.</p>
              <div className="mt-6 p-4 bg-[#FAF8F5] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2D3B2D] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2D3B2D]">@sarah_drives</p>
                    <p className="text-xs text-[#5C5347]">Your unique username</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
              <svg className="w-8 h-8 text-[#5C7A5C]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </div>

          <div className="relative group">
            <div className="bg-white rounded-2xl border border-[#E8E4DD] p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#7A9B7A]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-xl font-bold text-[#5C7A5C]">2</span>
              </div>
              <h3 className="text-xl font-semibold text-[#2D3B2D] mb-3">Share your QR code or link</h3>
              <p className="text-[#5C5347] leading-relaxed">Students join instantly - no apps, no setup, no confusion.</p>
              <div className="mt-6 p-4 bg-[#FAF8F5] rounded-xl flex items-center justify-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-white p-2 rounded-lg shadow-md">
                    <div className="w-full h-full grid grid-cols-7 grid-rows-7 gap-0.5">
                      {[1,1,1,0,1,1,1,1,0,1,1,1,0,1,1,1,1,0,1,1,1,0,0,0,1,0,0,0,1,1,1,0,1,0,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1].map((filled, i) => (
                        <div key={i} className={`${filled ? "bg-[#2D3B2D]" : "bg-transparent"} rounded-sm`} />
                      ))}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-[#5C7A5C]/20 to-transparent animate-scan rounded-lg" />
                </div>
              </div>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
              <svg className="w-8 h-8 text-[#5C7A5C]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </div>

          <div className="relative group">
            <div className="bg-white rounded-2xl border border-[#E8E4DD] p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#C9B96D]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-xl font-bold text-[#9A8A3D]">3</span>
              </div>
              <h3 className="text-xl font-semibold text-[#2D3B2D] mb-3">Everything updates automatically</h3>
              <p className="text-[#5C5347] leading-relaxed">Attendance, payments, scheduling, and communication - all in one place.</p>
              <div className="mt-6 p-4 bg-[#FAF8F5] rounded-xl flex items-center justify-center">
                <div className="relative">
                  <div className="w-20 h-32 bg-[#2D3B2D] rounded-2xl p-1.5 shadow-lg">
                    <div className="w-full h-full bg-white rounded-xl flex flex-col items-center justify-center p-2">
                      <div className="w-8 h-8 rounded-full bg-[#5C7A5C]/20 flex items-center justify-center mb-2">
                        <svg className="w-4 h-4 text-[#5C7A5C]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <p className="text-[6px] font-medium text-[#2D3B2D] text-center">Connected to</p>
                      <p className="text-[8px] font-bold text-[#5C7A5C]">@sarah_drives</p>
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#5C7A5C] rounded-full flex items-center justify-center animate-bounce">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-[#2D3B2D] to-[#3D4B3D] rounded-2xl p-8 text-center shadow-xl">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-sm font-medium text-amber-300 mb-4">
              Early Access - First 50 Instructors
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Get App7i for GBP 11.99/month</h3>
            <p className="text-white/70 mb-6">(normally GBP 19.99)</p>
            <Link to="/register-instructor" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#2D3B2D] font-medium rounded-xl shadow-lg hover:bg-white/90 hover:-translate-y-0.5 transition-all">
              Claim Early Access
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-100%); opacity: 0; }
          50% { transform: translateY(100%); opacity: 1; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
