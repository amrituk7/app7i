import { Link } from "react-router-dom";

const links = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-white py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest text-sm font-semibold text-white">
            7i
          </span>
          <span className="text-lg font-semibold tracking-tight text-forest">App7i</span>
        </div>

        <nav className="flex flex-wrap gap-4 text-sm text-body">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-forest">
              {link.label}
            </a>
          ))}
          <Link to="/privacy" className="transition hover:text-forest">
            Privacy
          </Link>
          <Link to="/terms" className="transition hover:text-forest">
            Terms
          </Link>
          <Link to="/support" className="transition hover:text-forest">
            Support
          </Link>
          <Link to="/login" className="transition hover:text-forest">
            Log In
          </Link>
        </nav>

        <p className="text-sm text-body">© {year} App7i. All rights reserved.</p>
      </div>
    </footer>
  );
}

