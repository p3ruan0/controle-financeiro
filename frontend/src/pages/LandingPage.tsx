import React from 'react';
import { About } from '../components/landing/About';
import { CTA } from '../components/landing/CTA';
import { Features } from '../components/landing/Features';
import { Footer } from '../components/landing/Footer';
import { Header } from '../components/landing/Header';
import { Hero } from '../components/landing/Hero';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Pricing } from '../components/landing/Pricing';
import { ProblemSection } from '../components/landing/ProblemSection';

export const LandingPage: React.FC = () => (
  <div className="min-h-screen overflow-hidden bg-white text-slate-900">
    <Header />
    <main>
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <Features />
      <About />
      <Pricing />
      <CTA />
    </main>
    <Footer />
  </div>
);

export default LandingPage;
