"use client";

import {
  Hero,
  UseCases,
  Tools,
  CodeGen,
  Compare,
  TryIt,
  Instant,
  Privacy,
  LovedBy,
  FinalCTA,
  Footer,
  LandingHeader,
} from "@/components/landing";

export function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--workspace-background)]">
      <LandingHeader />
      <main id="main" className="flex-1">
        <Hero />
        <UseCases />
        <Tools />
        <CodeGen />
        <Compare />
        <TryIt />
        <Instant />
        <Privacy />
        <LovedBy />
        <FinalCTA />
        <Footer />
      </main>
    </div>
  );
}
