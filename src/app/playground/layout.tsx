import type { Metadata } from "next";

const SITE_URL = process.env.SITE_URL || "https://formaty.dev";

export const metadata: Metadata = {
  title: "Playground - Format, Convert, Compare & Utils",
  description:
    "Free online developer playground: format and validate JSON, XML, YAML, TOML, CSV, compare documents and lists, run JSONPath queries, generate types and schemas, decode JWT, hash, and 18+ developer utils. 100% local - no upload.",
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
    title: "Playground - Format, Convert, Compare & Utils",
    description:
      "Free online developer playground: format, convert, compare, query, and decode - all in your browser with no data leaving your device.",
    url: `${SITE_URL}/playground`,
    siteName: "Formaty",
    type: "website",
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: "Formaty developer playground" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Playground - Format, Convert, Compare & Utils",
    description:
      "Free online developer playground: format, convert, compare, query, and decode - all in your browser with no data leaving your device.",
    images: [`${SITE_URL}/og.png`],
  },
};

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
