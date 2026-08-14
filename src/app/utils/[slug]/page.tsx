import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ToolPage } from "@/components/ToolPage";
import { getCanonicalUrl, SITE_URL } from "@/lib/seo";
import { getUtilConfig, UTIL_ROUTES } from "@/lib/seoUtils";

export async function generateStaticParams() {
  return UTIL_ROUTES.map((slug) => ({ slug }));
}

/** With `output: "export"`, unknown paths must 404 - not try to render on demand. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = getUtilConfig(slug);
  if (!config) return {};
  const canonical = getCanonicalUrl(`/utils/${slug}`);
  const pageTitle = config.title.replace(/\s*\|\s*Formaty\s*$/i, "");
  return {
    title: pageTitle,
    description: config.description,
    keywords: [pageTitle, config.h1, "developer utils", "online tool", "local-first", "no signup"],
    alternates: { canonical },
    openGraph: {
      title: pageTitle,
      description: config.description,
      url: canonical,
      siteName: "Formaty",
      type: "website",
      images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: config.h1 }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: config.description,
      images: [`${SITE_URL}/og.png`],
    },
  };
}

export default async function UtilRoutePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = getUtilConfig(slug);
  if (!config) notFound();
  const canonical = getCanonicalUrl(`/utils/${slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: config.h1,
    description: config.description,
    url: canonical,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: config.useCases,
    screenshot: `${SITE_URL}/og.png`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Formaty", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Utils", item: `${SITE_URL}/utils/uuid-generator` },
        { "@type": "ListItem", position: 3, name: config.h1, item: canonical },
      ],
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Is the ${config.h1} tool free?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Every Formaty tool is free, requires no sign-up, and runs 100% locally in your browser.",
        },
      },
      {
        "@type": "Question",
        name: `Does the ${config.h1} tool upload my data?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `No. The ${config.h1} tool processes everything in your browser - your data never leaves your device.`,
        },
      },
      {
        "@type": "Question",
        name: `How do I use the ${config.h1} tool?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Open the ${config.h1} tool, paste or type your input, and get results instantly. No account or install needed.`,
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <ToolPage config={config} />
    </>
  );
}
