"use client";

import {
  Hero,
  TrustStrip,
  ProblemSolution,
  FeatureGrid,
  ConversionGrid,
  Workflow,
  UseCases,
  Differentiation,
  FinalCTA,
  Footer,
} from "@/components/landing";
import { LandingHeader } from "@/components/landing";

export function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--workspace-background)]">
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <ProblemSolution />
        <FeatureGrid />
        <ConversionGrid />
        <Workflow />
        <UseCases />
        <Differentiation />
        <FinalCTA />
        <Footer />
      </main>
    </div>
  );
}
