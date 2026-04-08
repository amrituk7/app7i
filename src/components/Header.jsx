import { useEffect, useState } from "react";
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
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const closeMenu = () => setIsMobileOpen(false);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        isScrolled ? "border-b border-line bg-cream/95 shadow-sm backdrop-blur-md" : "bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div
            className={[
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              isScrolled ? "bg-forest" : "bg-white/15 ring-1 ring-white/15",
            ].join(" ")}
          >
            <span className="text-sm font-bold text-white">7i</span>
          </div>
          <span className={["text-xl font-semibold transition-colors", isScrolled ? "text-forest" : "text-white"].join(" ")}>
            App7i
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={[
                "text-sm transition-colors",
                isScrolled ? "text-body hover:text-forest" : "text-white/80 hover:text-white",
              ].join(" ")}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className={[
              "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition",
              isScrolled
                ? "text-body hover:bg-soft hover:text-forest"
                : "text-white hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            Log in
          </Link>
          <Link
            to="/register-instructor"
            className={[
              "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition",
              isScrolled ? "bg-forest text-white hover:bg-pine" : "bg-cream text-forest hover:bg-soft",
            ].join(" ")}
          >
            Claim Early Access
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileOpen}
          onClick={() => setIsMobileOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full md:hidden"
        >
          <div className="space-y-1.5">
            <span
              className={[
                "block h-0.5 w-5 rounded transition-colors",
                isScrolled ? "bg-forest" : "bg-white",
              ].join(" ")}
            />
            <span
              className={[
                "block h-0.5 w-5 rounded transition-colors",
                isScrolled ? "bg-forest" : "bg-white",
              ].join(" ")}
            />
            <span
              className={[
                "block h-0.5 w-5 rounded transition-colors",
                isScrolled ? "bg-forest" : "bg-white",
              ].join(" ")}
            />
          </div>
        </button>
      </div>

      {isMobileOpen && (
        <div className="border-t border-line bg-cream md:hidden">
          <nav className="flex flex-col gap-4 p-4">
            {NAV_LINKS.map((item) => (
              <a key={item.href} href={item.href} className="text-sm text-body" onClick={closeMenu}>
                {item.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-4">
              <Link to="/login" onClick={closeMenu} className="rounded-full px-3 py-2 text-sm text-body">
                Log in
              </Link>
              <Link
                to="/register-instructor"
                onClick={closeMenu}
                className="rounded-full bg-forest px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-pine"
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
