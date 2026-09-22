import type { Metadata } from "next";
import { Suspense } from "react";
import { InstantApp } from "@/components/instant/InstantApp";
import { INSTANT_PAGE } from "@/lib/seoInstant";
import { getCanonicalUrl, SITE_URL } from "@/lib/seo";

const canonical = getCanonicalUrl("/utils/instant");
const ogImage = `${SITE_URL}/og/instant.png`;

export const metadata: Metadata = {
  title: INSTANT_PAGE.title.replace(/\s*\|\s*Formaty\s*$/i, ""),
  description: INSTANT_PAGE.description,
  keywords: [
    "timezone converter",
    "world clock",
    "time zone converter",
    "UTC converter",
    "IST to EST",
    "IST to PST",
    "UTC timestamp converter",
    "Unix timestamp converter",
    "timezone comparison",
    "international meeting time",
  ],
  alternates: { canonical },
  openGraph: {
    title: INSTANT_PAGE.title.replace(/\s*\|\s*Formaty\s*$/i, ""),
    description: INSTANT_PAGE.description,
    url: canonical,
    siteName: "Formaty",
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "Instant — Timezone Converter" }],
  },
  twitter: {
    card: "summary_large_image",
    title: INSTANT_PAGE.title.replace(/\s*\|\s*Formaty\s*$/i, ""),
    description: INSTANT_PAGE.description,
    images: [ogImage],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: INSTANT_PAGE.h1,
  description: INSTANT_PAGE.description,
  url: canonical,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: INSTANT_PAGE.useCases,
  screenshot: ogImage,
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Formaty", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Utils", item: `${SITE_URL}/utils` },
      { "@type": "ListItem", position: 3, name: "Instant", item: canonical },
    ],
  },
};

/** Single source of truth: the visible FAQ section mirrors the FAQPage JSON-LD. */
const INSTANT_FAQ: Array<{ q: string; a: string }> = [
  {
    q: "How do I convert a time between timezones?",
    a: "Type a moment into the smart input - a clock time like 10:30, a date, an ISO 8601 timestamp, a Unix timestamp, or a shortcut like 10:30 Asia/Kolkata. Every location on the timeline updates instantly to show that same moment in its own timezone.",
  },
  {
    q: "Does Instant handle daylight saving time correctly?",
    a: "Yes. Timezone projections use the IANA time zone database through a Temporal polyfill, so DST shifts, gaps, and ambiguous local times are resolved the same way your operating system would.",
  },
  {
    q: "Can I share a specific moment with someone?",
    a: "Yes. Every state serializes into the URL (the moment, your locations, and display options), so copying the link sends the exact timeline you are looking at - no account needed.",
  },
  {
    q: "Does the timezone converter upload my data?",
    a: "No. All timezone math runs locally in your browser. Your locations and timestamps never leave your device.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: INSTANT_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function InstantPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[var(--workspace-background)] text-sm text-[var(--workspace-text-muted)]">
            Loading Instant…
          </div>
        }
      >
        <InstantApp />
      </Suspense>

      {/* FAQ - mirrors the FAQPage JSON-LD emitted above */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--workspace-text-muted)]">
          FAQ
        </h2>
        <div className="mt-4 space-y-3">
          {INSTANT_FAQ.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-3"
            >
              <summary className="cursor-pointer list-none text-sm font-medium text-[var(--workspace-text)]">
                {f.q}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-[var(--workspace-text-muted)]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
