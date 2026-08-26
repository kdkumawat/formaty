import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Logo } from "@/components/Logo";
import { getCanonicalUrl, SITE_URL, TOOL_PAGES, type ToolRoute } from "@/lib/seo";
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
  return (
    <div className="min-h-screen bg-[var(--workspace-background)]">
      <header className="sticky top-0 z-50 border-b border-[var(--workspace-border)] bg-[var(--workspace-background)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            href="/"
            aria-label="Formaty home"
            className="flex items-center gap-0.5 text-[var(--workspace-text)] transition-opacity hover:opacity-85"
          >
            <Logo size={22} />
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/docs" className="hidden rounded-lg px-3 py-1.5 text-sm text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] sm:inline-flex">
              Docs
            </Link>
            <Link href="/playground" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-all hover:scale-[1.03]">
              Playground
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12">
        <nav className="mb-5 flex items-center gap-1.5 text-xs text-[var(--workspace-text-muted)]">
          <Link href="/" className="transition-colors hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-[var(--workspace-text)]">Tools</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--workspace-text)]">All Developer Tools</h1>
        <p className="mt-2 max-w-2xl text-base text-[var(--workspace-text-muted)]">
          Compare, format, convert, query, and generate from structured data - all free, all running
          locally in your browser.
        </p>

        <div className="mt-10 space-y-10">
          {TOOL_GROUPS.map((group) => (
            <section key={group.label}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--workspace-text-muted)]">
                {group.label}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.routes.map((route) => {
                  const c = TOOL_PAGES[route];
                  return (
                    <Link
                      key={route}
                      href={`/${route}`}
                      className="group flex items-center justify-between rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                    >
                      <span className="text-sm font-medium text-[var(--workspace-text)] group-hover:text-primary">
                        {c.h1}
                      </span>
                      <ArrowRightIcon className="h-3.5 w-3.5 text-[var(--workspace-text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--workspace-text-muted)]">
              Utils
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/utils/instant"
                className="group flex items-center justify-between rounded-xl border border-primary/20 bg-[var(--workspace-panel)] px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
              >
                <span className="text-sm font-medium text-[var(--workspace-text)] group-hover:text-primary">
                  Instant
                </span>
                <ArrowRightIcon className="h-3.5 w-3.5 text-[var(--workspace-text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
              {UTIL_ROUTES.map((slug) => {
                const c = UTIL_PAGES[slug];
                if (!c) return null;
                return (
                  <Link
                    key={slug}
                    href={`/utils/${slug}`}
                    className="group flex items-center justify-between rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                  >
                    <span className="text-sm font-medium text-[var(--workspace-text)] group-hover:text-primary">
                      {c.h1}
                    </span>
                    <ArrowRightIcon className="h-3.5 w-3.5 text-[var(--workspace-text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: "Formaty Developer Tools", url: canonical, description: "All Formaty developer tools: compare lists and CSV, format and convert JSON/XML/YAML/TOML/CSV, generate SQL and types, query JSON, import cURL, and developer utils." }) }} />
    </div>
  );
}
