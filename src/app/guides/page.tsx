import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Logo } from "@/components/Logo";
import { GUIDES } from "@/lib/guides";
import { getCanonicalUrl, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Developer Guides",
  description:
    "Hands-on developer guides for the workflows Formaty automates: comparing database records, finding missing IDs, generating SQL, diffing API responses, and converting JSON to code. Each guide ends in a working tool.",
  alternates: { canonical: "/guides" },
  openGraph: {
    title: "Developer Guides | Formaty",
    description:
      "Hands-on guides for comparing data, generating SQL, diffing API responses, and converting JSON to code - each ending in a working, local-first tool.",
    url: `${SITE_URL}/guides`,
    siteName: "Formaty",
    type: "website",
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: "Formaty developer guides" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Developer Guides | Formaty",
    description:
      "Hands-on guides for comparing data, generating SQL, diffing API responses, and converting JSON to code - each ending in a working tool.",
    images: [`${SITE_URL}/og.png`],
  },
};

export default function GuidesPage() {
  const canonical = getCanonicalUrl("/guides");
  return (
    <div className="min-h-screen bg-[var(--workspace-background)]">
      <header className="sticky top-0 z-50 border-b border-[var(--workspace-border)] bg-[var(--workspace-background)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-0.5 text-[var(--workspace-text)] transition-opacity hover:opacity-85"
          >
            <Logo size={22} />
            <span className="text-lg font-bold tracking-tight text-primary">ormaty</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/tools" className="hidden rounded-lg px-3 py-1.5 text-sm text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] sm:inline-flex">
              Tools
            </Link>
            <Link href="/playground" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-all hover:scale-[1.03]">
              Playground
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <nav className="mb-5 flex items-center gap-1.5 text-xs text-[var(--workspace-text-muted)]">
          <Link href="/" className="transition-colors hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-[var(--workspace-text)]">Guides</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--workspace-text)]">Developer Guides</h1>
        <p className="mt-2 max-w-xl text-base text-[var(--workspace-text-muted)]">
          Real workflows, solved with Formaty. Every guide ends in a working, local-first tool.
        </p>

        <div className="mt-10 space-y-4">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="group flex items-start justify-between gap-4 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
            >
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-[var(--workspace-text)] group-hover:text-primary">
                  {g.h1}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[var(--workspace-text-muted)]">
                  {g.description}
                </p>
              </div>
              <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-[var(--workspace-text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: "Formaty Developer Guides", url: canonical, description: "Hands-on developer guides for comparing data, generating SQL, diffing API responses, and converting JSON to code." }) }} />
    </div>
  );
}
