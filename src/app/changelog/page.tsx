import type { Metadata } from "next";
import { Footer, PageHero, PROSE, WRAP } from "@/components/landing";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Changelog - What's New in Formaty",
  description:
    "Every Formaty release: new tools, formats, and workspace features. JSON, XML, YAML, TOML, CSV formatting, compare, type generation, and developer utils - all local-first and free.",
  alternates: { canonical: "/changelog" },
  openGraph: {
    title: "Changelog | Formaty",
    description:
      "Every Formaty release: new tools, formats, and workspace features for the local-first developer data workspace.",
    url: `${SITE_URL}/changelog`,
    siteName: "Formaty",
    type: "website",
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: "Formaty changelog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog | Formaty",
    description:
      "Every Formaty release: new tools, formats, and workspace features for the local-first developer data workspace.",
    images: [`${SITE_URL}/og.png`],
  },
};

const ENTRIES = [
  {
    version: "2.1.2",
    date: "August 2026",
    title: "Reliable Ctrl/Cmd+Enter execution",
    items: [
      "Ctrl/Cmd+Enter now executes the input from any focused pane on every platform - including plain Ctrl+Enter on macOS, where the shortcut previously fell through",
      "A single keypress fires exactly one request: the global handler and Monaco's keybinding both stay live and the duplicate dispatch is deduped",
      "Works for cURL execution and JSON parsing alike, with the raw body fallback for non-JSON responses",
    ],
  },
  {
    version: "2.1.1",
    date: "August 2026",
    title: "cURL fixes, SEO architecture & tools directory",
    items: [
      "Ctrl/Cmd+Enter on a cURL input now shows the raw response body when the API returns plain text, HTML, or another non-JSON payload instead of failing",
      "New /tools directory grouping every utility by category, plus a /guides section with workflow-first guides (database records, SQL IN, JSON queries, API responses)",
      "Tool pages gained visible FAQ sections, related-tools internal linking, and richer 404 navigation",
      "Playground tool presets now auto-select a useful result bucket, so one-sided list compare tools like the SQL IN generator always show output",
      "Deduplicated overlapping tools (SQL NOT IN folds into SQL IN generator with a redirect) and fixed the logo mark on the tools/guides headers",
    ],
  },
  {
    version: "2.1.0",
    date: "August 2026",
    title: "Developer workspace, animated icons & Next.js 16",
    items: [
      "itsHover-inspired animated icons across the toolbar, pinned buttons, and landing hero",
      "cURL code generation (fetch / axios / Python / Go) and the developer-focused landing pages",
      "Feedback system with an admin triage inbox and copy-all for AI review",
      "CSV output preserved on the Raw view and compact workspace UI polish",
      "Toast notifications, multi-tab polish, and utility UI improvements",
      "Migrated to shadcn/ui and Next.js 16 with all lint warnings resolved",
      "Consent-gated Google Analytics and a refreshed launch landing page with SEO",
    ],
  },
  {
    version: "2.0.1",
    date: "August 2026",
    title: "Keyboard-first workspace & marketing refresh",
    items: [
      "Full keyboard shortcut layer: beautify/minify, compare/utils toggles, view switching, copy, find, history stepping, theme and more",
      "Shortcuts reference overlay (press ? or Cmd/Ctrl+/) plus a ? button in the status bar",
      "Shortcut chips render per platform - Cmd on Mac, Ctrl on Windows/Linux",
      "Offline support: the app now caches itself and works without a connection after first visit",
      "New landing pages for every developer util (UUID, Base64, JWT, hashing and more)",
      "Live try-it widget, example recipes, and GitHub star badge on the landing page",
    ],
  },
  {
    version: "2.0.0",
    date: "June 2026",
    title: "Compare, Utils, and type generation",
    items: [
      "Document diff and list/set compare with SQL IN export",
      "18+ developer utils: UUID, Base64, JWT, hash, time, URL, case, hex, regex, color, cron and more",
      "Type generation for 10+ languages (TypeScript, Python, Go, Rust, Java, C#, Kotlin, Swift, SQL, Protobuf)",
      "Multi-tab workspace with per-tab snapshots",
      "Share links for exact-state collaboration",
    ],
  },
  {
    version: "1.1.0",
    date: "March 2026",
    title: "Analytics & improvements",
    items: [
      "Consent-gated Google Analytics (optional, off by default)",
      "Improved Open Graph metadata and search indexing",
      "Multiple polish and stability fixes across the workspace",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[var(--workspace-background)] text-[var(--workspace-text)]">
      <PageHero
        small
        crumbs={[{ label: "Formaty", href: "/" }, { label: "Changelog" }]}
        title="Changelog"
        intro="What is new in Formaty. Everything ships free and local-first."
      />
      <main id="main" className={`${WRAP} flex flex-col py-[clamp(32px,5vw,64px)]`}>
        {ENTRIES.map((entry) => (
          <section
            key={entry.version}
            className="grid gap-x-12 gap-y-3 border-b border-[var(--workspace-border)] py-7 first:pt-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]"
          >
            <div>
              <h2 className="font-display text-[22px] font-extrabold tracking-[-0.03em]">{entry.version}</h2>
              <p className="text-[15px] text-[var(--workspace-text-muted)]">{entry.date}</p>
            </div>
            <div>
              <h3 className="font-display text-[18px] font-extrabold tracking-[-0.02em]">{entry.title}</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-[var(--workspace-text-muted)]">
                {entry.items.map((item) => (
                  <li key={item} className={PROSE}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  );
}
