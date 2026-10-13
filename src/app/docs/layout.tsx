import type { Metadata } from "next";
import { DocsThemeProvider } from "@/components/DocsThemeProvider";

const SITE_URL = process.env.SITE_URL || "https://formaty.dev";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Formaty feature guide: JSON, XML, YAML, TOML, CSV converter, typed tabs, search every tool, compare lists and documents, query, cURL import, type generation, schema validation, sharing, and developer utils.",
  keywords: [
    "Formaty docs",
    "JSON formatter guide",
    "JSON to TypeScript guide",
    "JSON diff guide",
    "JSONPath guide",
    "developer tools documentation",
    "JWT decoder guide",
    "UUID generator guide",
    "local-first tools",
  ],
  alternates: { canonical: `${SITE_URL}/docs` },
  openGraph: {
    title: "Documentation",
    description:
      "Formaty feature guide: format, convert, compare, query, and developer utils - everything runs locally in your browser.",
    url: `${SITE_URL}/docs`,
    siteName: "Formaty",
    type: "website",
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: "Formaty documentation" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Documentation",
    description:
      "Formaty feature guide: format, convert, compare, query, and developer utils - everything runs locally in your browser.",
    images: [`${SITE_URL}/og.png`],
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsThemeProvider>{children}</DocsThemeProvider>;
}
