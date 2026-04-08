import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#FAF8F5] border-t border-[#E8E4DD] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2D3B2D] flex items-center justify-center text-sm font-bold text-white">7i</div>
            <span className="text-lg font-semibold text-[#2D3B2D]">App7i</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6">
            <a href="#how-it-works" className="text-sm text-[#5C5347] hover:text-[#2D3B2D] transition-colors">How It Works</a>
            <a href="#features" className="text-sm text-[#5C5347] hover:text-[#2D3B2D] transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-[#5C5347] hover:text-[#2D3B2D] transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-[#5C5347] hover:text-[#2D3B2D] transition-colors">FAQ</a>
            <Link to="/privacy" className="text-sm text-[#5C5347] hover:text-[#2D3B2D] transition-colors">Privacy</Link>
            <Link to="/terms" className="text-sm text-[#5C5347] hover:text-[#2D3B2D] transition-colors">Terms</Link>
            <Link to="/support" className="text-sm text-[#5C5347] hover:text-[#2D3B2D] transition-colors">Support</Link>
          </nav>

          <p className="text-sm text-[#5C5347]">© {new Date().getFullYear()} App7i. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
