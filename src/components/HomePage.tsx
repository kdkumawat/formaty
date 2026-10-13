import { Hero, Convert, Generators, Compare, MoreTools, Privacy, FaqSection, FinalCTA, Footer, SiteHeader } from "@/components/landing";

export function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--workspace-background)] text-[var(--workspace-text)]">
      {/* The hero carries the page's amber key, so the header's playground link starts plain. */}
      <SiteHeader quiet />
      <main id="main">
        <Hero />
        <Convert />
        <Generators />
        <Compare />
        <MoreTools />
        <FaqSection />
        <Privacy />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
