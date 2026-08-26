"use client";

import Link from "next/link";
import { FeedbackDialog } from "@/components/FeedbackDialog";

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

const UTIL_LINKS = [
  { route: "/utils/instant", label: "Instant" },
  { route: "/utils/uuid-generator", label: "UUID Generator" },
  { route: "/utils/base64-encoder", label: "Base64 Encoder" },
  { route: "/utils/jwt-decoder", label: "JWT Decoder" },
  { route: "/utils/sha-hash-generator", label: "SHA Hash Generator" },
  { route: "/utils/password-generator", label: "Password Generator" },
  { route: "/utils/color-converter", label: "Color Converter" },
  { route: "/utils/cron-expression-explainer", label: "Cron Explainer" },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 pb-8 pt-12">
      <div className="mx-auto max-w-6xl">
        

        {/* Links grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
              Utils
            </h3>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
              {UTIL_LINKS.map(({ route, label }) => (
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
              href="/tools"
              className="text-xs text-[var(--workspace-text-muted)] transition-colors hover:text-primary"
            >
              Tools
            </Link>
            <Link
              href="/guides"
              className="text-xs text-[var(--workspace-text-muted)] transition-colors hover:text-primary"
            >
              Guides
            </Link>
            <Link
              href="/docs"
              className="text-xs text-[var(--workspace-text-muted)] transition-colors hover:text-primary"
            >
              Documentation
            </Link>
            <Link
              href="/#privacy"
              className="text-xs text-[var(--workspace-text-muted)] transition-colors hover:text-primary"
            >
              Privacy
            </Link>
            <Link
              href="/changelog"
              className="text-xs text-[var(--workspace-text-muted)] transition-colors hover:text-primary"
            >
              Changelog
            </Link>
            <FeedbackDialog trigger="link" label="Feedback" />
          </div>
          <a
            href="https://github.com/kdkumawat/formaty"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3 py-1.5 text-xs font-medium text-[var(--workspace-text-muted)] transition-colors hover:border-primary/40 hover:text-[var(--workspace-text)]"
          >
            <svg className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            Star on GitHub
          </a>
          <a
            href="https://www.buymeacoffee.com/kdkumawat"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:border-amber-500/40 hover:bg-amber-500/15"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M20 3H4v10a4 4 0 004 4h6a4 4 0 004-4V5h2a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V5c0-1.1.9-2 2-2h2v1zm-2 4V5H4v8h4a2 2 0 002-2V7h6zM8 19h8v2H8v-2z" />
            </svg>
            Buy me a coffee
          </a>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <span className="text-xs text-[var(--workspace-text-muted)]">
              © {new Date().getFullYear()} Formaty · Local-first developer tools
            </span>
            <span className="flex items-center gap-2 text-xs text-[var(--workspace-text-muted)]">
              <a
                href="https://www.linkedin.com/in/kdkumawat"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Kuldeep Kumawat on LinkedIn"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--workspace-border)] transition-colors hover:border-primary/40 hover:text-primary"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a
                href="https://x.com/kuldeep_kumawat"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Kuldeep Kumawat on X"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--workspace-border)] transition-colors hover:border-primary/40 hover:text-primary"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.97 6.817h-3.31l7.73-8.835L1.5 2.25h6.83l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
