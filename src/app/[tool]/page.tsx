import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ToolPage } from "@/components/ToolPage";
import { ToolRedirect } from "@/components/ToolRedirect";
import {
  ALL_TOOL_ROUTES,
  TOOL_REDIRECTS,
  getCanonicalUrl,
  SEO_KEYWORDS,
  SITE_URL,
  type ToolRoute,
} from "@/lib/seo";
import { getPageConfig, isToolPageConfig } from "@/lib/seoUtils";

export async function generateStaticParams() {
  return [...ALL_TOOL_ROUTES, ...Object.keys(TOOL_REDIRECTS)].map((route) => ({
    tool: route,
  }));
}

/** With `output: "export"`, unknown paths must 404 - not try to render on demand. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool } = await params;
  const redirectTarget = TOOL_REDIRECTS[tool];
  if (redirectTarget) {
    const target = getPageConfig(redirectTarget);
    if (!target || !isToolPageConfig(target)) return {};
    return {
      title: target.h1,
      description: target.description,
      alternates: { canonical: getCanonicalUrl(`/${redirectTarget}`) },
      robots: { index: false, follow: true },
      openGraph: {
        title: target.h1,
        url: getCanonicalUrl(`/${redirectTarget}`),
        siteName: "Formaty",
        type: "website",
      },
    };
  }
  if (!ALL_TOOL_ROUTES.includes(tool as ToolRoute)) return {};
  const config = getPageConfig(tool as ToolRoute);
  if (!config || !isToolPageConfig(config)) return {};
  const canonical = getCanonicalUrl(`/${tool}`);
  const toolKeywords = SEO_KEYWORDS[tool as ToolRoute] ?? [];
  // Titles already include the brand; strip it so the root template `%s | Formaty` doesn't double it.
  const pageTitle = config.title.replace(/\s*\|\s*Formaty\s*$/i, "");
  return {
    title: pageTitle,
    description: config.description,
    keywords: [...toolKeywords, "developer tools", "local-first", "no signup", "browser tool"],
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

export default async function ToolRoutePage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  const redirectTarget = TOOL_REDIRECTS[tool];
  if (redirectTarget) {
    const target = getPageConfig(redirectTarget);
    if (!target || !isToolPageConfig(target)) notFound();
    return (
      <>
        {/* Hoisted to <head> by React 19 - instant redirect without JS. */}
        <meta httpEquiv="refresh" content={`0; url=/${redirectTarget}`} />
        <ToolRedirect to={redirectTarget} label={target.h1} />
      </>
    );
  }
  if (!ALL_TOOL_ROUTES.includes(tool as ToolRoute)) notFound();
  const config = getPageConfig(tool as ToolRoute);
  if (!config || !isToolPageConfig(config)) notFound();
  const canonical = getCanonicalUrl(`/${tool}`);

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
        { "@type": "ListItem", position: 2, name: config.h1, item: canonical },
      ],
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How do I use the ${config.h1} tool?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Open the ${config.h1} page, paste or type your data, and the tool formats and validates it instantly - all in your browser with no upload.`,
        },
      },
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
          text: `No. The ${config.h1} tool processes everything locally in your browser using WebWorkers - your data never leaves your device.`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <ToolPage config={config} />
    </>
  );
}
