import { Link } from "react-router-dom";

const LINKS = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "/login", label: "Instructors", isRouter: true },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
              <span className="text-sm font-bold text-white">7i</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              App7i
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {LINKS.map((link) =>
              link.isRouter ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-8 text-center dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-500">
            &copy; {new Date().getFullYear()} App7i. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
