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
    <div className="min-h-screen bg-cream text-forest">
      <Header />
      <main className="bg-cream">
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
