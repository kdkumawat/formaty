"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";

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
    <footer className="border-t border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 pb-8 pt-12">
      <div className="mx-auto max-w-6xl">
        

        {/* Links grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
              Tools
            </h3>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
              {TOOL_LINKS.map(({ route, label }) => (
                <li key={route}>
                  <Link
                    href={route}
                    className="text-xs text-[var(--workspace-text-muted)] transition-colors hover:text-primary"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
              Conversions
            </h3>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
              {CONVERSION_LINKS.map(({ route, label }) => (
                <li key={route}>
                  <Link
                    href={route}
                    className="text-xs text-[var(--workspace-text-muted)] transition-colors hover:text-primary"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--workspace-border)] pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/playground"
              className="text-xs text-[var(--workspace-text-muted)] transition-colors hover:text-primary"
            >
              Playground
            </Link>
            <Link
              href="/docs"
              className="text-xs text-[var(--workspace-text-muted)] transition-colors hover:text-primary"
            >
              Documentation
            </Link>
          </div>
          <span className="text-xs text-[var(--workspace-text-muted)]">
            © {new Date().getFullYear()} Formaty · Local-first developer tools
          </span>
        </div>
      </div>
    </footer>
  );
}
