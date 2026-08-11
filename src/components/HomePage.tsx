"use client";

import {
  Hero,
  TrustStrip,
  ProblemSolution,
  FeatureGrid,
  PowerFeatures,
  Workflow,
  UseCases,
  Differentiation,
  FinalCTA,
  Footer,
} from "@/components/landing";
import { LandingHeader } from "@/components/landing";

export function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--workspace-background)] pb-12">
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <ProblemSolution />
        <FeatureGrid />
        <PowerFeatures />
        <Workflow />
        <UseCases />
        <Differentiation />
        <FinalCTA />
        <Footer />
      </main>
      <TrustStrip />
    </div>
  );
}
