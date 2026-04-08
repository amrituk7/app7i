import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white transition-colors ${
              scrolled ? "bg-[#2D3B2D]" : "bg-white/20"
            }`}
          >
            7i
          </div>
          <span className={`text-xl font-semibold transition-colors ${scrolled ? "text-[#2D3B2D]" : "text-white"}`}>
            App7i
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className={`text-sm transition-colors ${scrolled ? "text-[#5C5347] hover:text-[#2D3B2D]" : "text-white/80 hover:text-white"}`}>How It Works</a>
          <a href="#features" className={`text-sm transition-colors ${scrolled ? "text-[#5C5347] hover:text-[#2D3B2D]" : "text-white/80 hover:text-white"}`}>Features</a>
          <a href="#pricing" className={`text-sm transition-colors ${scrolled ? "text-[#5C5347] hover:text-[#2D3B2D]" : "text-white/80 hover:text-white"}`}>Pricing</a>
          <a href="#faq" className={`text-sm transition-colors ${scrolled ? "text-[#5C5347] hover:text-[#2D3B2D]" : "text-white/80 hover:text-white"}`}>FAQ</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className={`px-4 py-2 text-sm rounded-lg transition-colors ${scrolled ? "text-[#5C5347] hover:bg-gray-100" : "text-white hover:bg-white/10"}`}>Log In</Link>
          <Link to="/register-instructor" className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${scrolled ? "bg-[#2D3B2D] text-white hover:bg-[#3D4B3D]" : "bg-white text-[#2D3B2D] hover:bg-white/90"}`}>Claim Early Access</Link>
        </div>

        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen}>
          {mobileMenuOpen ? (
            <svg className={`w-6 h-6 ${scrolled ? "text-[#2D3B2D]" : "text-white"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className={`w-6 h-6 ${scrolled ? "text-[#2D3B2D]" : "text-white"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <nav className="flex flex-col gap-4 p-4">
            <a href="#how-it-works" className="text-sm text-[#5C5347]" onClick={closeMobileMenu}>How It Works</a>
            <a href="#features" className="text-sm text-[#5C5347]" onClick={closeMobileMenu}>Features</a>
            <a href="#pricing" className="text-sm text-[#5C5347]" onClick={closeMobileMenu}>Pricing</a>
            <a href="#faq" className="text-sm text-[#5C5347]" onClick={closeMobileMenu}>FAQ</a>
            <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
              <Link to="/login" className="text-sm text-[#5C5347]" onClick={closeMobileMenu}>Log In</Link>
              <Link to="/register-instructor" className="px-4 py-2 text-sm font-medium text-center rounded-lg bg-[#2D3B2D] text-white" onClick={closeMobileMenu}>Claim Early Access</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
