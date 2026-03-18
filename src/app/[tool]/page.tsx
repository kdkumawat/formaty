import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ToolPage } from "@/components/ToolPage";
import {
  ALL_TOOL_ROUTES,
  getToolConfig,
  getCanonicalUrl,
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
  return {
    title: config.title,
    description: config.description,
    alternates: { canonical },
    openGraph: {
      title: config.title,
      description: config.description,
      url: canonical,
    },
    twitter: {
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
  return <ToolPage config={config} />;
}
