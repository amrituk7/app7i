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
        isScrolled ? "border-b border-[#E3DBD0] bg-[#FAF8F5]/95 shadow-sm backdrop-blur-md" : "bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div
            className={[
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              isScrolled ? "bg-[#2D3B2D]" : "bg-white/15 ring-1 ring-white/15",
            ].join(" ")}
          >
            <span className="text-sm font-bold text-white">7i</span>
          </div>
          <span className={["text-xl font-semibold transition-colors", isScrolled ? "text-[#2D3B2D]" : "text-white"].join(" ")}>
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
                isScrolled ? "text-[#5C5347] hover:text-[#2D3B2D]" : "text-white/80 hover:text-white",
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
                ? "text-[#5C5347] hover:bg-[#F2EDE6] hover:text-[#2D3B2D]"
                : "text-white hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            Log in
          </Link>
          <Link
            to="/register-instructor"
            className={[
              "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition",
              isScrolled ? "bg-[#2D3B2D] text-white hover:bg-[#1F3026]" : "bg-[#FAF8F5] text-[#2D3B2D] hover:bg-[#F2EDE6]",
            ].join(" ")}
          >
            Start Free
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
                isScrolled ? "bg-[#2D3B2D]" : "bg-white",
              ].join(" ")}
            />
            <span
              className={[
                "block h-0.5 w-5 rounded transition-colors",
                isScrolled ? "bg-[#2D3B2D]" : "bg-white",
              ].join(" ")}
            />
            <span
              className={[
                "block h-0.5 w-5 rounded transition-colors",
                isScrolled ? "bg-[#2D3B2D]" : "bg-white",
              ].join(" ")}
            />
          </div>
        </button>
      </div>

      {isMobileOpen && (
        <div className="border-t border-[#E8E4DD] bg-[#FAF8F5] md:hidden">
          <nav className="flex flex-col gap-4 p-4">
            {NAV_LINKS.map((item) => (
              <a key={item.href} href={item.href} className="text-sm text-[#5C5347]" onClick={closeMenu}>
                {item.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-4">
              <Link to="/login" onClick={closeMenu} className="rounded-full px-3 py-2 text-sm text-[#5C5347]">
                Log in
              </Link>
              <Link
                to="/register-instructor"
                onClick={closeMenu}
                className="rounded-full bg-[#2D3B2D] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#3D4B3D]"
              >
                Start Free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
