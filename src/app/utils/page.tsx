import type { Metadata } from "next";
import { Footer, GroupedRows, PageHero } from "@/components/landing";
import { SITE_URL } from "@/lib/seo";
import { INSTANT_PAGE } from "@/lib/seoInstant";
import { UTIL_PAGES, UTIL_ROUTES } from "@/lib/seoUtils";

const SITE_NAME = "Formaty";
const TITLE = "Developer Utils - Free Online Tools | Formaty";
const DESCRIPTION =
  "17+ free online developer utils: UUID generator, Base64 encoder, JWT decoder, SHA hash, password generator, URL encode/parse, case converter, regex tester, color converter, cron explainer, timezone converter and more. No sign-up, runs locally in your browser.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "developer utils",
    "developer tools online",
    "uuid generator online",
    "base64 encode decode",
    "jwt decoder online",
    "sha-256 hash generator",
    "password generator online",
    "url encoder decoder",
    "regex tester online",
    "color converter online",
    "cron expression explainer",
    "timezone converter",
    "lorem ipsum generator",
    "text case converter",
    "hex converter",
    "html entity encoder",
    "json string escape",
    "number base converter",
    "local-first",
    "no signup",
    "free developer tools",
  ],
  alternates: { canonical: "/utils" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/utils`,
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og.png`],
  },
};

/** Group utils into scannable categories. */
const UTIL_GROUPS: Array<{ title: string; blurb: string; routes: string[] }> = [
  {
    title: "Identifiers & encoding",
    blurb: "Generate IDs and move data safely between encodings.",
    routes: ["uuid-generator", "base64-encoder", "hex-converter", "number-base-converter", "json-string-escape", "html-encoder"],
  },
  {
    title: "Auth & security",
    blurb: "Inspect tokens, hash values, and create strong secrets.",
    routes: ["jwt-decoder", "sha-hash-generator", "password-generator"],
  },
  {
    title: "Text & patterns",
    blurb: "Reshape text and test expressions before they ship.",
    routes: ["text-case-converter", "regex-tester", "lorem-ipsum-generator", "text-stats", "url-encoder-decoder", "url-parser"],
  },
  {
    title: "Time & data formats",
    blurb: "Decode timestamps, schedules, and color values.",
    routes: ["instant", "cron-expression-explainer", "color-converter"],
  },
];

/** Config lookup that also resolves the /utils/instant page. */
function configFor(route: string) {
  return route === "instant" ? INSTANT_PAGE : UTIL_PAGES[route];
}

export default function UtilsIndexPage() {
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Formaty developer utils",
    description: DESCRIPTION,
    itemListElement: [...UTIL_ROUTES, "instant"].map((route, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: configFor(route).h1,
      url: `${SITE_URL}/utils/${route}`,
    })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Developer Utils", item: `${SITE_URL}/utils` },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--workspace-background)] text-[var(--workspace-text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <PageHero
        crumbs={[{ label: "Formaty", href: "/" }, { label: "Utils" }]}
        title="Developer utils, all in one place."
        intro="17+ free online utilities for everyday engineering work: identifiers, encoding, hashing, text reshaping, timezones, and format conversion. Everything runs locally in your browser: no sign-up, no uploads, no limits."
      />
      <main id="main" className="flex-1">
        <GroupedRows
          groups={UTIL_GROUPS.map((g) => ({
            title: g.title,
            blurb: g.blurb,
            items: g.routes
              .filter((r) => r === "instant" || UTIL_ROUTES.includes(r))
              .map((r) => ({ href: `/utils/${r}`, title: configFor(r).h1, desc: configFor(r).description })),
          }))}
        />
      </main>

      <Footer />
    </div>
  );
}
