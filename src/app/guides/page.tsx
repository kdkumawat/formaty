import type { Metadata } from "next";
import { Footer, GroupedRows, PageHero } from "@/components/landing";
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
    <div className="min-h-screen bg-[var(--workspace-background)] text-[var(--workspace-text)]">
      <PageHero
        crumbs={[{ label: "Formaty", href: "/" }, { label: "Guides" }]}
        title="Developer guides"
        intro="Real workflows, solved with Formaty. Every guide ends in a working, local-first tool."
      />
      <main id="main">
        <GroupedRows
          groups={[{ title: "All guides", items: GUIDES.map((g) => ({ href: `/guides/${g.slug}`, title: g.h1, desc: g.description })) }]}
        />
      </main>
      <Footer />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: "Formaty Developer Guides", url: canonical, description: "Hands-on developer guides for comparing data, generating SQL, diffing API responses, and converting JSON to code." }) }} />
    </div>
  );
}
