import Header from "./Header";
import Hero from "./Hero";
import HowItWorks from "./HowItWorks";
import Stats from "./Stats";
import Features from "./Features";
import Pricing from "./Pricing";
import FAQ from "./FAQ";
import CTA from "./CTA";
import Footer from "./Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D3B2D]">
      <Header />
      <main className="bg-[#FAF8F5]">
        <Hero />
        <HowItWorks />
        <Stats />
        <Features />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
