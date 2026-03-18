"use client";

import Link from "next/link";

const TOOL_LINKS = [
  { route: "/json-formatter", label: "JSON Formatter" },
  { route: "/xml-formatter", label: "XML Formatter" },
  { route: "/yaml-formatter", label: "YAML Formatter" },
  { route: "/toml-formatter", label: "TOML Formatter" },
  { route: "/csv-formatter", label: "CSV Formatter" },
  { route: "/json-viewer", label: "JSON Viewer" },
  { route: "/json-diff", label: "JSON Diff" },
  { route: "/jsonpath-tester", label: "JSONPath Tester" },
  { route: "/json-to-typescript", label: "JSON to TypeScript" },
  { route: "/graph-viewer", label: "Graph Viewer" },
  { route: "/schema-generator", label: "Schema Generator" },
  { route: "/api-import", label: "API Import" },
];

const CONVERSION_LINKS = [
  { route: "/json-to-xml", label: "JSON to XML" },
  { route: "/xml-to-json", label: "XML to JSON" },
  { route: "/json-to-yaml", label: "JSON to YAML" },
  { route: "/yaml-to-json", label: "YAML to JSON" },
  { route: "/json-to-csv", label: "JSON to CSV" },
  { route: "/csv-to-json", label: "CSV to JSON" },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
              Tools
            </h3>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {TOOL_LINKS.map(({ route, label }) => (
                <li key={route}>
                  <Link
                    href={route}
                    className="text-xs text-[var(--workspace-text)] hover:text-primary hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
              Conversions
            </h3>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {CONVERSION_LINKS.map(({ route, label }) => (
                <li key={route}>
                  <Link
                    href={route}
                    className="text-xs text-[var(--workspace-text)] hover:text-primary hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 border-t border-[var(--workspace-border)] pt-6">
          <Link href="/playground" className="text-xs text-[var(--workspace-text-muted)] hover:text-primary">
            Open tool
          </Link>
          <Link href="/docs" className="text-xs text-[var(--workspace-text-muted)] hover:text-primary">
            Documentation
          </Link>
          <span className="text-xs text-[var(--workspace-text-muted)]">
            © {new Date().getFullYear()} Formaty
          </span>
        </div>
      </div>
    </footer>
  );
}
