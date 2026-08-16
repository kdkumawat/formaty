import Link from "next/link";
import { Logo } from "@/components/Logo";

const ENTRIES = [
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
    <div className="min-h-screen bg-[var(--workspace-background)]">
      <header className="sticky top-0 z-50 border-b border-[var(--workspace-border)] bg-[var(--workspace-background)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-0.5 text-[var(--workspace-text)] transition-opacity hover:opacity-85">
            <Logo size={22} />
            <span className="text-lg font-bold tracking-tight text-primary">ormaty</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/docs" className="rounded-lg px-3 py-1.5 text-sm text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)]">
              Docs
            </Link>
            <Link href="/playground" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-all hover:scale-[1.03]">
              Playground
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--workspace-text)]">Changelog</h1>
        <p className="mt-2 text-base text-[var(--workspace-text-muted)]">
          What&apos;s new in Formaty. Everything ships free and local-first.
        </p>

        <div className="mt-10 space-y-10">
          {ENTRIES.map((entry) => (
            <section key={entry.version} className="border-l border-[var(--workspace-border)] pl-6">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-mono text-sm font-bold text-primary">{entry.version}</h2>
                <span className="text-xs text-[var(--workspace-text-muted)]">{entry.date}</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-[var(--workspace-text)]">{entry.title}</h3>
              <ul className="mt-3 space-y-2">
                {entry.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-[var(--workspace-text-muted)]">
                    <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
