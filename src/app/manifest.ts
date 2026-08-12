import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Formaty - Format, Convert, Compare & Utils",
    short_name: "Formaty",
    description:
      "Free local-first developer tools: JSON, XML, YAML, TOML, CSV formatting and conversion, diff, query, type generation, and 18+ developer utils.",
    id: "/",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a10",
    theme_color: "#0a0a10",
    lang: "en",
    categories: ["developer tools", "productivity", "utilities"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
