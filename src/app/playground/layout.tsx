import type { Metadata } from "next";

const SITE_URL = process.env.SITE_URL || "https://formaty.dev";

export const metadata: Metadata = {
  title: "Developer Data Workspace - Format, Convert, Compare & Generate",
  description:
    "Free online developer data workspace: format and validate JSON, XML, YAML, TOML, CSV, compare documents and lists, run JSONPath queries, generate SQL and types, import cURL, and more. 100% local - no upload, no signup.",
  keywords: [
    "developer playground",
    "JSON playground",
    "format JSON online",
    "compare JSON",
    "JSONPath tester",
    "JWT decoder",
    "developer tools",
    "local-first",
    "no signup",
    "browser tool",
  ],
  alternates: { canonical: `${SITE_URL}/playground` },
  openGraph: {
    title: "Developer Data Workspace - Format, Convert, Compare & Generate",
    description:
      "Free online developer data workspace: format, convert, compare, reconcile, query, and generate SQL and types - all in your browser with no data leaving your device.",
    url: `${SITE_URL}/playground`,
    siteName: "Formaty",
    type: "website",
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: "Formaty developer playground" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Developer Data Workspace - Format, Convert, Compare & Generate",
    description:
      "Free online developer data workspace: format, convert, compare, reconcile, query, and generate SQL and types - all in your browser with no data leaving your device.",
    images: [`${SITE_URL}/og.png`],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Formaty Playground",
  description:
    "Free online developer data workspace: format, convert, compare, query, and generate - all in your browser with no data leaving your device.",
  url: `${SITE_URL}/playground`,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "JSON formatter and validator",
    "Format conversion: JSON, XML, YAML, TOML, CSV",
    "JSONPath and JMESPath query playground",
    "JSON diff with side-by-side comparison",
    "Type generation (TypeScript, Python, Go, Java, and more)",
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Formaty", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Playground", item: `${SITE_URL}/playground` },
  ],
};

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
