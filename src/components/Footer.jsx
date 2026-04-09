import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-[#E8E4DD] bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2D3B2D] text-sm font-bold text-white">7i</div>
              <span className="text-lg font-semibold text-[#2D3B2D]">App7i</span>
            </div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#5C5347]">
              App7i helps driving instructors manage lessons, students, payments, and progress in one organised place.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-5">
            <a href="#how-it-works" className="text-sm text-[#5C5347] transition-colors hover:text-[#2D3B2D]">How It Works</a>
            <a href="#features" className="text-sm text-[#5C5347] transition-colors hover:text-[#2D3B2D]">Features</a>
            <a href="#pricing" className="text-sm text-[#5C5347] transition-colors hover:text-[#2D3B2D]">Pricing</a>
            <a href="#faq" className="text-sm text-[#5C5347] transition-colors hover:text-[#2D3B2D]">FAQ</a>
            <Link to="/privacy" className="text-sm text-[#5C5347] transition-colors hover:text-[#2D3B2D]">Privacy</Link>
            <Link to="/terms" className="text-sm text-[#5C5347] transition-colors hover:text-[#2D3B2D]">Terms</Link>
            <Link to="/support" className="text-sm text-[#5C5347] transition-colors hover:text-[#2D3B2D]">Support</Link>
          </nav>

          <p className="text-sm text-[#5C5347]">© {new Date().getFullYear()} App7i. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
