import React from 'react';
import { Header } from '../components/Header';
import { FeatureCarousel } from '../components/FeatureCarousel';
import { FeatureMarquee } from '../components/FeatureMarquee';
import { ProcessSteps } from '../components/ProcessSteps';
import { FeaturesDetail } from '../components/FeaturesDetail';
import { FAQ } from '../components/FAQ';
import { Footer } from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground selection:bg-primary/20">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 md:py-24 flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl space-y-16 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Powerful Image Tools
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
              Professional-grade image processing, right in your browser. 
              Private, fast, and secure.
            </p>
          </div>
          
          <div className="space-y-8">
            <FeatureCarousel />
            <FeatureMarquee />
          </div>

          <ProcessSteps />

          <FeaturesDetail />

          <FAQ />
        </div>
      </main>

      <Footer />
    </div>
  );
}
