import type { Metadata } from "next";
import { Suspense } from "react";
import { InstantApp } from "@/components/instant/InstantApp";
import { INSTANT_PAGE } from "@/lib/seoInstant";
import { getCanonicalUrl, SITE_URL } from "@/lib/seo";

const canonical = getCanonicalUrl("/utils/instant");

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
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: INSTANT_PAGE.h1 }],
  },
  twitter: {
    card: "summary_large_image",
    title: INSTANT_PAGE.title.replace(/\s*\|\s*Formaty\s*$/i, ""),
    description: INSTANT_PAGE.description,
    images: [`${SITE_URL}/og.png`],
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
};

export default function InstantPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[var(--workspace-background)] text-sm text-[var(--workspace-text-muted)]">
            Loading Instant…
          </div>
        }
      >
        <InstantApp />
      </Suspense>
    </>
  );
}
