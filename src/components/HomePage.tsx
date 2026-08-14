"use client";

import {
  Hero,
  TryIt,
  ProblemSolution,
  FeatureGrid,
  ConversionGrid,
  PowerFeatures,
  Capabilities,
  Workflow,
  UseCases,
  Recipes,
  Testimonials,
  Differentiation,
  FinalCTA,
  Footer,
  TrustStrip,
} from "@/components/landing";
import { LandingHeader } from "@/components/landing";

export function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--workspace-background)] pb-12">
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <TryIt />
        <ProblemSolution />
        <FeatureGrid />
        <ConversionGrid />
        <PowerFeatures />
        <Capabilities />
        <Workflow />
        <UseCases />
        <Recipes />
        <Testimonials />
        <Differentiation />
        <FinalCTA />
        <Footer />
      </main>
      <TrustStrip />
    </div>
  );
}
