import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
              isScrolled ? "bg-emerald-600" : "bg-white/20 ring-1 ring-white/30"
            }`}
          >
            <span className="text-sm font-bold text-white">7i</span>
          </div>
          <span
            className={`text-xl font-semibold tracking-tight transition-colors ${
              isScrolled ? "text-slate-900 dark:text-white" : "text-white"
            }`}
          >
            App7i
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                isScrolled
                  ? "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  : "text-white/80 hover:text-white"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isScrolled
                ? "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                : "text-white/90 hover:text-white"
            }`}
          >
            I&apos;m an Instructor
          </Link>
          <Link
            to="/register-instructor"
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              isScrolled
                ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
                : "bg-white text-emerald-700 shadow-lg hover:bg-slate-50"
            }`}
          >
            Claim Early Access
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={isMobileOpen}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-full md:hidden"
        >
          <div className="space-y-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`block h-0.5 w-5 rounded-full transition-colors ${
                  isScrolled ? "bg-slate-900 dark:bg-white" : "bg-white"
                }`}
              />
            ))}
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:hidden">
          <nav className="flex flex-col gap-1 p-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
              <Link
                to="/login"
                onClick={() => setIsMobileOpen(false)}
                className="rounded-full px-4 py-2.5 text-center text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                I&apos;m an Instructor
              </Link>
              <Link
                to="/register-instructor"
                onClick={() => setIsMobileOpen(false)}
                className="rounded-full bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Claim Early Access
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
