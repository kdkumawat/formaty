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
  TrustStrip,
  LandingHeader,
} from "@/components/landing";

export function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--workspace-background)] pb-12">
      <LandingHeader />
      <main className="flex-1">
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
      <TrustStrip />
    </div>
  );
}
