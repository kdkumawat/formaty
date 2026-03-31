import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ToolPage } from "@/components/ToolPage";
import {
  ALL_TOOL_ROUTES,
  getToolConfig,
  getCanonicalUrl,
  SEO_KEYWORDS,
  SITE_URL,
  type ToolRoute,
} from "@/lib/seo";

export async function generateStaticParams() {
  return ALL_TOOL_ROUTES.map((route) => ({ tool: route }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool } = await params;
  if (!ALL_TOOL_ROUTES.includes(tool as ToolRoute)) return {};
  const config = getToolConfig(tool as ToolRoute);
  const canonical = getCanonicalUrl(`/${tool}`);
  const toolKeywords = SEO_KEYWORDS[tool as ToolRoute] ?? [];
  return {
    title: config.title,
    description: config.description,
    keywords: [...toolKeywords, "developer tools", "local-first", "no signup", "browser tool"],
    alternates: { canonical },
    openGraph: {
      title: config.title,
      description: config.description,
      url: canonical,
      siteName: "Formaty",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: config.title,
      description: config.description,
    },
  };
}

export default async function ToolRoutePage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  if (!ALL_TOOL_ROUTES.includes(tool as ToolRoute)) notFound();
  const config = getToolConfig(tool as ToolRoute);
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
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Formaty", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: config.h1, item: canonical },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolPage config={config} />
    </>
  );
}
