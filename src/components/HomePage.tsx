"use client";

import {
  Hero,
  TryIt,
  ProblemSolution,
  Reconcile,
  JsonToSql,
  ApiWorkflow,
  CompareSection,
  CodeGen,
  FeatureGrid,
  ConversionGrid,
  PowerFeatures,
  Capabilities,
  Workflow,
  UseCases,
  Recipes,
  Privacy,
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
        <ProblemSolution />
        <Reconcile />
        <JsonToSql />
        <ApiWorkflow />
        <CompareSection />
        <CodeGen />
        <TryIt />
        <FeatureGrid />
        <ConversionGrid />
        <PowerFeatures />
        <Capabilities />
        <Workflow />
        <UseCases />
        <Recipes />
        <Privacy />
        <Testimonials />
        <Differentiation />
        <FinalCTA />
        <Footer />
      </main>
      <TrustStrip />
    </div>
  );
}
