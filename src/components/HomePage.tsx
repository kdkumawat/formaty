import { Capabilities, FaqSection, FinalCTA, Footer, Hero, Privacy, SiteHeader } from "@/components/landing";

export function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--workspace-background)] text-[var(--workspace-text)]">
      <SiteHeader />
      <main id="main">
        <Hero />
        <Capabilities />
        <Privacy />
        <FaqSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
