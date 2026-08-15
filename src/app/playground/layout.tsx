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

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
