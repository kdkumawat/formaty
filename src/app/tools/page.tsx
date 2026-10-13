import type { Metadata } from "next";
import { Footer, GroupedRows, PageHero } from "@/components/landing";
import { getCanonicalUrl, SITE_URL, TOOL_PAGES, type ToolRoute } from "@/lib/seo";
import { INSTANT_PAGE } from "@/lib/seoInstant";
import { UTIL_PAGES, UTIL_ROUTES } from "@/lib/seoUtils";

export const metadata: Metadata = {
  title: "All Developer Tools",
  description:
    "Every Formaty developer tool in one place: compare lists and CSV, format JSON/XML/YAML/TOML/CSV, generate SQL and types, convert between formats, query with JSONPath, import cURL, and 18+ developer utils. All free and local-first.",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "All Developer Tools | Formaty",
    description:
      "Compare lists, format and convert structured data, generate SQL and types, query JSON, import cURL, and use 18+ developer utils - all free and running locally in your browser.",
    url: `${SITE_URL}/tools`,
    siteName: "Formaty",
    type: "website",
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: "All Formaty developer tools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "All Developer Tools | Formaty",
    description:
      "Compare lists, format and convert structured data, generate SQL and types, query JSON, import cURL, and use 18+ developer utils - free and local-first.",
    images: [`${SITE_URL}/og.png`],
  },
};

const TOOL_GROUPS: { label: string; routes: ToolRoute[] }[] = [
  {
    label: "Compare & Lists",
    routes: ["compare-lists", "compare-ids", "compare-csv", "csv-column-compare", "find-duplicates-in-list", "sql-in-clause-generator", "sql-values-generator"],
  },
  {
    label: "JSON",
    routes: ["json-formatter", "json-viewer", "json-diff", "jsonpath-tester", "graph-viewer", "json-flattener", "json-schema-validator", "schema-generator"],
  },
  {
    label: "Convert",
    routes: ["json-to-xml", "xml-to-json", "json-to-yaml", "yaml-to-json", "json-to-toml", "toml-to-json", "json-to-csv", "csv-to-json", "xml-formatter", "yaml-formatter", "toml-formatter", "csv-formatter"],
  },
  {
    label: "Generate",
    routes: ["json-to-typescript", "json-to-zod", "json-to-go", "json-to-python", "json-to-pydantic", "json-to-java", "json-to-csharp", "json-to-protobuf", "json-to-sql"],
  },
  {
    label: "API & cURL",
    routes: ["api-import", "curl-to-fetch", "curl-to-axios", "curl-to-python", "curl-to-go"],
  },
];

export default function ToolsPage() {
  const canonical = getCanonicalUrl("/tools");
  const groups = [
    ...TOOL_GROUPS.map((g) => ({
      title: g.label,
      items: g.routes.map((r) => ({ href: `/${r}`, title: TOOL_PAGES[r].h1, desc: TOOL_PAGES[r].description })),
    })),
    {
      title: "Utils",
      items: [
        { href: "/utils/instant", title: "Instant", desc: INSTANT_PAGE.description },
        ...UTIL_ROUTES.flatMap((slug) => {
          const c = UTIL_PAGES[slug];
          return c ? [{ href: `/utils/${slug}`, title: c.h1, desc: c.description }] : [];
        }),
      ],
    },
  ];
  return (
    <div className="min-h-screen bg-[var(--workspace-background)] text-[var(--workspace-text)]">
      <PageHero
        crumbs={[{ label: "Formaty", href: "/" }, { label: "Tools" }]}
        title="All developer tools"
        intro="Compare, format, convert, query, and generate from structured data - all free, all running locally in your browser."
      />
      <main id="main">
        <GroupedRows groups={groups} />
      </main>
      <Footer />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: "Formaty Developer Tools", url: canonical, description: "All Formaty developer tools: compare lists and CSV, format and convert JSON/XML/YAML/TOML/CSV, generate SQL and types, query JSON, import cURL, and developer utils." }) }} />
    </div>
  );
}
