import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "jsonix",
    short_name: "jsonix",
    description: "Powerful local-first JSON tooling platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f1a",
    theme_color: "#0b0f1a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
