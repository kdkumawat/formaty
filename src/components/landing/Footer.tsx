"use client";

import Link from "next/link";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { AnimatedHeartIcon, useIconAnimation } from "@/components/icons";

/** "Made with ❤️ by kdkumawat" - the heart beats on its own and thumps on hover. */
function MadeWithLove() {
  const icon = useIconAnimation();
  return (
    <span {...icon.bind} className="inline-flex items-center gap-1.5">
      Made with
      <AnimatedHeartIcon ref={icon.ref} className="h-3.5 w-3.5 text-red-500" />
      by{" "}
      <a
        href="https://www.linkedin.com/in/kdkumawat"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-[var(--workspace-text)] transition-colors hover:text-primary"
        title="kdkumawat on LinkedIn"
      >
        kdkumawat
      </a>
    </span>
  );
}

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
  { route: "/utils/uuid-generator", label: "UUID Generator" },
  { route: "/utils/base64-encoder", label: "Base64 Encoder" },
  { route: "/utils/jwt-decoder", label: "JWT Decoder" },
  { route: "/utils/sha-hash-generator", label: "SHA Hash Generator" },
  { route: "/utils/password-generator", label: "Password Generator" },
  { route: "/utils/unix-timestamp-converter", label: "Unix Timestamp" },
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
              href="/docs"
              className="text-xs text-[var(--workspace-text-muted)] transition-colors hover:text-primary"
            >
              Documentation
            </Link>
            <Link
              href="/docs#privacy"
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
            href="https://github.com/sponsors/kdkumawat"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/[0.07] px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/15"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            Sponsor
          </a>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <span className="text-xs text-[var(--workspace-text-muted)]">
              © {new Date().getFullYear()} Formaty · Local-first developer tools
            </span>
            <MadeWithLove />
          </div>
        </div>
      </div>
    </footer>
  );
}
