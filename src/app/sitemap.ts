import type { MetadataRoute } from "next";
import { ALL_TOOL_ROUTES } from "@/lib/seo";
import { UTIL_ROUTES } from "@/lib/seoUtils";
import { GUIDE_ROUTES } from "@/lib/guides";

export const dynamic = "force-static";

const SITE_URL = process.env.SITE_URL || "https://formaty.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/playground`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/docs`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/changelog`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/tools`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/guides`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
  ];
  const toolPages: MetadataRoute.Sitemap = ALL_TOOL_ROUTES.map((route) => ({
    url: `${SITE_URL}/${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));
  const utilPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/utils/instant`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.86,
    },
    ...UTIL_ROUTES.map((route) => ({
      url: `${SITE_URL}/utils/${route}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
  const guidePages: MetadataRoute.Sitemap = GUIDE_ROUTES.map((route) => ({
    url: `${SITE_URL}/guides/${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));
  return [...base, ...toolPages, ...utilPages, ...guidePages];
}
