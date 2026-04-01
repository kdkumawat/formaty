"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

/* ─── Nav sections ──────────────────────────────── */
const NAV_SECTIONS = [
  { id: "formats",   label: "Formats" },
  { id: "workspace", label: "Workspace" },
  { id: "multi-tab", label: "Multi-Tab" },
  { id: "actions",   label: "Actions" },
  { id: "convert",   label: "Convert" },
  { id: "views",     label: "Views" },
  { id: "types",     label: "Type Gen" },
  { id: "query",     label: "Query" },
  { id: "options",   label: "Options" },
  { id: "diff",      label: "Diff" },
  { id: "palette",   label: "Command Palette" },
  { id: "copy-as",   label: "Copy As" },
  { id: "history",   label: "History" },
  { id: "share",     label: "Share & Export" },
  { id: "shortcuts", label: "Shortcuts" },
  { id: "pinning",   label: "Pinning" },
  { id: "privacy",   label: "Privacy" },
];

/* ─── Helpers ───────────────────────────────────── */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--workspace-text)]">
      {children}
    </kbd>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium ${
        color ?? "border-[var(--workspace-border)] bg-[var(--workspace-background)] text-[var(--workspace-text-muted)]"
      }`}
    >
      {children}
    </span>
  );
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="group mb-4 flex scroll-mt-[72px] items-center gap-2 text-xl font-bold text-[var(--workspace-text)]"
    >
      <a href={`#${id}`} className="opacity-0 transition-opacity group-hover:opacity-40 text-primary text-base">
        #
      </a>
      {children}
    </h2>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--workspace-border)]">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-[var(--workspace-border)] bg-[var(--workspace-background)]">
        {cols.map((c) => (
          <th key={c} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--workspace-text-muted)]">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <tr className="border-b border-[var(--workspace-border)]/60">
      <td className="px-4 py-2.5 align-top font-semibold text-[var(--workspace-text)] whitespace-nowrap">{label}</td>
      <td className="px-4 py-2.5 text-sm text-[var(--workspace-text-muted)] leading-relaxed">{value}</td>
    </tr>
  );
}

/* ─── Section wrapper: hides when filtered out ── */
function Section({
  id,
  query,
  keywords,
  children,
}: {
  id: string;
  query: string;
  keywords: string[];
  children: React.ReactNode;
}) {
  const q = query.toLowerCase().trim();
  if (q && !keywords.some((k) => k.toLowerCase().includes(q))) return null;
  return (
    <section id={id} className="mb-12 scroll-mt-[72px]">
      {children}
    </section>
  );
}

/* ─── Main page ─────────────────────────────────── */
export default function DocsPage() {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string>("");
  const mainRef = useRef<HTMLElement>(null);

  /* IntersectionObserver to track active sidebar link */
  useEffect(() => {
    const els = NAV_SECTIONS.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [query]);

  const clearSearch = useCallback(() => setQuery(""), []);

  return (
    <div className="min-h-screen bg-[var(--workspace-background)]">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[var(--workspace-text)] hover:text-primary transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              formaty
            </Link>
            <span className="select-none text-[var(--workspace-border)]">/</span>
            <span className="text-sm text-[var(--workspace-text-muted)]">Docs</span>
          </div>

          {/* Search */}
          <div className="relative hidden max-w-xs flex-1 sm:flex">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--workspace-text-muted)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search docs..."
              className="w-full rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-background)] py-1.5 pl-8 pr-7 text-xs text-[var(--workspace-text)] placeholder:text-[var(--workspace-text-muted)] outline-none transition-colors focus:border-primary/50"
            />
            {query && (
              <button type="button" onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--workspace-text-muted)] hover:text-primary">
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/playground" className="hidden rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-content shadow-sm transition-all hover:scale-[1.02] sm:inline-flex">
              Open Playground
            </Link>
            <a href="https://github.com/kdkumawat/formaty" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-[var(--workspace-text-muted)] hover:text-primary transition-colors">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl">
        {/* ── Left sidebar ── */}
        <aside className="sticky top-[49px] hidden h-[calc(100dvh-49px)] w-52 shrink-0 overflow-y-auto border-r border-[var(--workspace-border)] bg-[var(--workspace-panel)] py-5 lg:block">
          <nav className="px-3">
            <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--workspace-text-muted)]">Contents</p>
            <ul className="space-y-0.5">
              {NAV_SECTIONS.map(({ id, label }) => {
                const active = activeId === id;
                return (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className={`flex items-center rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all ${
                        active
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-[var(--workspace-text-muted)] hover:bg-primary/8 hover:text-primary"
                      }`}
                    >
                      {active && <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      {label}
                    </a>
                  </li>
                );
              })}
            </ul>
            <div className="mt-5 border-t border-[var(--workspace-border)] pt-4 px-2">
              <Link href="/playground" className="block rounded-lg bg-primary/10 px-2.5 py-2 text-[12px] font-semibold text-primary transition-all hover:bg-primary/15 text-center">
                Try Playground &rarr;
              </Link>
            </div>
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main ref={mainRef} className="min-w-0 flex-1 px-5 py-10 md:px-10">
          {/* Mobile search */}
          <div className="relative mb-6 sm:hidden">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--workspace-text-muted)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search docs..."
              className="w-full rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] py-2.5 pl-10 pr-4 text-sm text-[var(--workspace-text)] placeholder:text-[var(--workspace-text-muted)] outline-none focus:border-primary/50"
            />
          </div>

          {/* Page title */}
          {!query && (
            <div className="mb-10 border-b border-[var(--workspace-border)] pb-8">
              <span className="mb-3 inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">Docs</span>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--workspace-text)]">formaty Documentation</h1>
              <p className="mt-2 text-base text-[var(--workspace-text-muted)]">Local-first data toolkit. Everything runs in your browser &mdash; no servers, no sign-up.</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {["JSON", "XML", "YAML", "TOML", "CSV", "cURL"].map((f) => (
                  <Tag key={f}>{f}</Tag>
                ))}
              </div>
            </div>
          )}

          {/* ── Formats ── */}
          <Section id="formats" query={query} keywords={["formats","json","xml","yaml","toml","csv","curl","input","output","parse","convert","auto-detect","detect"]}>
            <SectionTitle id="formats">Input &amp; Output Formats</SectionTitle>
            <TableWrap>
              <THead cols={["Format", "Description"]} />
              <tbody className="divide-y divide-[var(--workspace-border)]/50">
                <Row label={<Tag color="text-amber-600 border-amber-500/30 bg-amber-500/8">JSON</Tag>} value="The primary format. Beautify, minify, flatten, sort, validate, schema, diff, and more." />
                <Row label={<Tag color="text-red-600 border-red-500/30 bg-red-500/8">XML</Tag>} value="Parse and convert to/from all other formats." />
                <Row label={<Tag color="text-lime-700 border-lime-600/30 bg-lime-600/8">YAML</Tag>} value="Parse and convert; ideal for configs and infrastructure files." />
                <Row label={<Tag color="text-teal-600 border-teal-500/30 bg-teal-500/8">TOML</Tag>} value="Parse and convert; Rust / systems-friendly config format." />
                <Row
                  label={<Tag color="text-blue-600 border-blue-500/30 bg-blue-500/8">CSV</Tag>}
                  value={
                    <>
                      Parse and convert (array of objects). Supports comma, tab{" "}
                      <code className="rounded bg-[var(--workspace-background)] px-1 font-mono text-xs">	</code>,
                      semicolon <code className="rounded bg-[var(--workspace-background)] px-1 font-mono text-xs">;</code>,
                      and pipe <code className="rounded bg-[var(--workspace-background)] px-1 font-mono text-xs">|</code>.
                    </>
                  }
                />
                <Row label={<Tag color="text-sky-600 border-sky-500/30 bg-sky-500/8">cURL</Tag>} value="Paste any curl command. formaty executes it and renders the live API response as formatted JSON." />
              </tbody>
            </TableWrap>
            <p className="mt-3 text-sm text-[var(--workspace-text-muted)]">Input format is auto-detected. Override via the format selector in the input toolbar.</p>
          </Section>

          {/* ── Workspace ── */}
          <Section id="workspace" query={query} keywords={["workspace","pane","splitter","resize","live transform","auto-format","paste","import","font size","fullscreen","maximize","split input","settings","editor","drag"]}>
            <SectionTitle id="workspace">Workspace</SectionTitle>
            <p className="mb-4 text-sm text-[var(--workspace-text-muted)]">
              The playground is split into an <strong className="text-[var(--workspace-text)]">input pane</strong> (left) and an{" "}
              <strong className="text-[var(--workspace-text)]">output pane</strong> (right), separated by a draggable splitter.
            </p>
            <TableWrap>
              <THead cols={["Feature", "Details"]} />
              <tbody className="divide-y divide-[var(--workspace-border)]/50">
                <Row label="Drag splitter" value="Click and drag the center divider to resize input/output panes to any ratio." />
                <Row label="Live transform" value="When enabled, output updates instantly as you type. Toggle via command palette." />
                <Row label="Auto-format on paste" value="Automatically beautifies data when you paste into the input editor. Toggle via settings." />
                <Row label="Import file" value='Upload any supported file directly into the input pane via command palette "Import file".' />
                <Row label="Maximize output" value='Expand the output pane to full width via command palette "Maximize output pane".' />
                <Row label="Window fullscreen" value='Enter true browser fullscreen via command palette "Enter fullscreen".' />
                <Row label="Find in output" value='Open find/replace in the output editor via command palette "Find in output".' />
                <Row label="Focus panes" value='Keyboard-navigate between panes: command palette "Focus input pane" / "Focus output pane".' />
                <Row label="Editor font size" value='Increase / decrease via command palette "Font size +" / "Font size -".' />
                <Row label="Line wrap" value="Toggle long-line wrapping in the Monaco editor via command palette." />
                <Row label="Samples" value='Load built-in examples: GitHub API, Stripe webhook, Kubernetes manifest, OpenAPI schema. Search "load" or "sample" in the command palette.' />
              </tbody>
            </TableWrap>
          </Section>

          {/* ── Multi-Tab ── */}
          <Section id="multi-tab" query={query} keywords={["multi-tab","tab","tabs","multiple","parallel","enable","disable","vertical","sidebar","multi tab"]}>
            <SectionTitle id="multi-tab">Multi-Tab Mode</SectionTitle>
            <p className="mb-4 text-sm leading-relaxed text-[var(--workspace-text-muted)]">
              Work on multiple independent documents simultaneously. Each tab has its own input, output, format settings, and history.
            </p>
            <TableWrap>
              <THead cols={["Action", "How"]} />
              <tbody className="divide-y divide-[var(--workspace-border)]/50">
                <Row label="Enable / disable" value='Command palette "Enable multi-tab mode". State persists across page refreshes.' />
                <Row label="New tab" value='Command palette "New tab" (only available when multi-tab is on).' />
                <Row label="Close tab" value="Hover the vertical tab label in the left rail then click the x button." />
                <Row label="Switch tab" value="Click any tab in the vertical tab bar on the left edge of the input pane." />
                <Row label="Persistence" value="Tab names and the enabled/disabled state are saved in localStorage and restored on refresh." />
              </tbody>
            </TableWrap>
            <p className="mt-3 text-sm text-[var(--workspace-text-muted)]">
              Tabs are displayed as a compact vertical column on the left edge of the input pane, keeping the editor at full width.
            </p>
          </Section>

          {/* ── Actions ── */}
          <Section id="actions" query={query} keywords={["actions","beautify","minify","flatten","unflatten","sort","deduplicate","schema","validate","diff","compare","pretty","compress","format"]}>
            <SectionTitle id="actions">Transform Actions</SectionTitle>
            <TableWrap>
              <THead cols={["Action", "Description"]} />
              <tbody className="divide-y divide-[var(--workspace-border)]/50">
                <Row label="Beautify" value="Pretty-print with configurable indentation (0-10 spaces)." />
                <Row label="Minify" value="Remove all whitespace for the smallest possible output." />
                <Row
                  label="Flatten"
                  value={
                    <>
                      Convert nested objects to dot-notation keys:{" "}
                      <code className="rounded bg-[var(--workspace-background)] px-1.5 py-0.5 font-mono text-xs">a.b.c</code>
                    </>
                  }
                />
                <Row label="Unflatten" value="Expand dot-notation keys back to nested objects." />
                <Row label="Sort array items" value="Sort all array contents recursively (alphabetically / numerically)." />
                <Row label="Remove duplicates" value="Deep-deduplicate array values recursively." />
                <Row label="Generate JSON Schema" value="Infer a JSON Schema draft from your sample data." />
                <Row label="Validate against Schema" value="Paste a JSON Schema in the modal — formaty validates input and reports all errors." />
              </tbody>
            </TableWrap>
          </Section>

          {/* ── Convert ── */}
          <Section id="convert" query={query} keywords={["convert","json","yaml","xml","toml","csv","change format","output format","curl"]}>
            <SectionTitle id="convert">Format Conversion</SectionTitle>
            <p className="mb-4 text-sm text-[var(--workspace-text-muted)]">
              Convert between any supported format pair using the output format picker or command palette.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { from: "JSON", to: "YAML" }, { from: "JSON", to: "XML" }, { from: "JSON", to: "TOML" }, { from: "JSON", to: "CSV" },
                { from: "YAML", to: "JSON" }, { from: "XML",  to: "JSON" }, { from: "TOML", to: "JSON" }, { from: "CSV",  to: "JSON" },
                { from: "cURL", to: "JSON" },
              ].map(({ from, to }) => (
                <span key={`${from}-${to}`} className="inline-flex items-center gap-1 rounded-lg border border-[var(--workspace-border)] px-2.5 py-1 text-xs font-medium text-[var(--workspace-text-muted)]">
                  <span className="text-[var(--workspace-text)]">{from}</span>
                  <span className="text-primary">&rarr;</span>
                  <span className="text-[var(--workspace-text)]">{to}</span>
                </span>
              ))}
            </div>
          </Section>

          {/* ── Views ── */}
          <Section id="views" query={query} keywords={["views","raw","tree","graph","table","query","jsonpath","jmespath","visual","explore","pin"]}>
            <SectionTitle id="views">Output Views</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "Raw",   desc: "Monaco editor with syntax highlighting, folding, line numbers, and find/replace." },
                { name: "Tree",  desc: "Expandable/collapsible explorer of the full data structure." },
                { name: "Graph", desc: "Interactive node graph — zoom, pan, drag to explore relationships." },
                { name: "Query", desc: "JSONPath / JMESPath live filter with highlighted matching nodes." },
                { name: "Table", desc: "Tabular grid for arrays of objects — ideal for CSV or flat data." },
              ].map(({ name, desc }) => (
                <div key={name} className="rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4">
                  <p className="mb-1 font-bold text-[var(--workspace-text)]">{name}</p>
                  <p className="text-sm leading-relaxed text-[var(--workspace-text-muted)]">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-[var(--workspace-text-muted)]">Pin any view to the output toolbar with &#9734; for one-click switching.</p>
          </Section>

          {/* ── Type Gen ── */}
          <Section id="types" query={query} keywords={["types","typescript","java","csharp","python","go","kotlin","swift","rust","sql","protobuf","generate","interface","struct","type generation"]}>
            <SectionTitle id="types">Type Generation</SectionTitle>
            <p className="mb-4 text-sm leading-relaxed text-[var(--workspace-text-muted)]">
              Generate strongly-typed interfaces and structs from your JSON data. Search{" "}
              <strong className="text-[var(--workspace-text)]">generate</strong> in the command palette, or use the output format picker.
            </p>
            <div className="flex flex-wrap gap-2">
              {["TypeScript", "Java", "C#", "Python", "Go", "Protobuf", "Kotlin", "Swift", "Rust", "SQL"].map((l) => (
                <Tag key={l}>{l}</Tag>
              ))}
            </div>
          </Section>

          {/* ── Query ── */}
          <Section id="query" query={query} keywords={["query","jsonpath","jmespath","filter","search","expression","path","result","live"]}>
            <SectionTitle id="query">Query Playground</SectionTitle>
            <p className="mb-4 text-sm leading-relaxed text-[var(--workspace-text-muted)]">
              Switch to <strong className="text-[var(--workspace-text)]">Query</strong> view to run live path expressions against your output data.
            </p>
            <TableWrap>
              <THead cols={["Language", "Example", "Notes"]} />
              <tbody className="divide-y divide-[var(--workspace-border)]/50">
                <tr className="border-b border-[var(--workspace-border)]/60">
                  <td className="px-4 py-2.5 font-semibold text-[var(--workspace-text)] whitespace-nowrap">JSONPath</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-emerald-600">$.users[*].name</td>
                  <td className="px-4 py-2.5 text-sm text-[var(--workspace-text-muted)]">Recursive descent, filter expressions, array slices</td>
                </tr>
                <tr className="border-b border-[var(--workspace-border)]/60">
                  <td className="px-4 py-2.5 font-semibold text-[var(--workspace-text)] whitespace-nowrap">JMESPath</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-emerald-600">users[].name</td>
                  <td className="px-4 py-2.5 text-sm text-[var(--workspace-text-muted)]">AWS-standard query language; projections &amp; functions</td>
                </tr>
              </tbody>
            </TableWrap>
            <p className="mt-3 text-sm text-[var(--workspace-text-muted)]">Matching nodes are highlighted. Results appear below the expression input.</p>
          </Section>

          {/* ── Options ── */}
          <Section id="options" query={query} keywords={["options","indent","quote style","sort keys","remove empty","csv delimiter","line wrap","auto-format","font size","settings","indentation"]}>
            <SectionTitle id="options">Format Options &amp; Settings</SectionTitle>
            <TableWrap>
              <THead cols={["Option", "Details"]} />
              <tbody className="divide-y divide-[var(--workspace-border)]/50">
                <Row label="Indent" value="0-10 spaces. Use the - / + buttons in the toolbar or reset to 2 (default)." />
                <Row label="Quote style" value="Double or single quotes for JSON string values." />
                <Row label="Sort keys" value="Alphabetize all object keys in output." />
                <Row label="Remove empty" value="Strip null, empty string, and empty array/object values from output." />
                <Row
                  label="CSV delimiter"
                  value={
                    <>
                      Comma <code className="rounded bg-[var(--workspace-background)] px-1 font-mono text-xs">,</code>,
                      Tab <code className="rounded bg-[var(--workspace-background)] px-1 font-mono text-xs">	</code>,
                      Semicolon <code className="rounded bg-[var(--workspace-background)] px-1 font-mono text-xs">;</code>,
                      or Pipe <code className="rounded bg-[var(--workspace-background)] px-1 font-mono text-xs">|</code>
                    </>
                  }
                />
                <Row label="Live transform" value="Re-runs the active operation on every keystroke. Disable for large files." />
                <Row label="Auto-format on paste" value="Automatically beautifies when pasting content into the input editor." />
                <Row label="Line wrap" value="Wrap long lines inside the Monaco editor." />
                <Row label="Editor font size" value='Increase / decrease via command palette "Font size +" / "Font size -".' />
              </tbody>
            </TableWrap>
          </Section>

          {/* ── Diff ── */}
          <Section id="diff" query={query} keywords={["diff","compare","delta","side-by-side","inline","navigate","changes","two documents","delta"]}>
            <SectionTitle id="diff">Diff &amp; Compare</SectionTitle>
            <p className="mb-4 text-sm leading-relaxed text-[var(--workspace-text-muted)]">Compare two documents side-by-side with full change highlighting.</p>
            <ul className="space-y-2 text-sm text-[var(--workspace-text-muted)]">
              <li><strong className="text-[var(--workspace-text)]">Enter diff mode</strong> &mdash; Actions &rarr; "Diff / Compare JSON" or command palette &rarr; "Diff".</li>
              <li><strong className="text-[var(--workspace-text)]">Side-by-side view</strong> &mdash; Two editable panes showing additions (green) and removals (red), default mode.</li>
              <li><strong className="text-[var(--workspace-text)]">Inline view</strong> &mdash; Toggle with the "Inline" button in the diff toolbar.</li>
              <li><strong className="text-[var(--workspace-text)]">Navigate diffs</strong> &mdash; Use the arrow buttons in the toolbar or search "diff next" / "diff prev" in the command palette.</li>
              <li><strong className="text-[var(--workspace-text)]">Exit diff</strong> &mdash; Command palette &rarr; "Exit Diff mode".</li>
            </ul>
          </Section>

          {/* ── Command Palette ── */}
          <Section id="palette" query={query} keywords={["command palette","palette","search","cmd k","ctrl k","recent","shortcut","all commands"]}>
            <SectionTitle id="palette">Command Palette</SectionTitle>
            <p className="mb-4 text-sm leading-relaxed text-[var(--workspace-text-muted)]">
              Press <Kbd>Cmd K</Kbd> (or <Kbd>Ctrl K</Kbd>) anywhere &mdash; even inside the editor &mdash; to open the command palette. The last 3 used commands always appear first.
            </p>
            <TableWrap>
              <THead cols={["Category", "Examples"]} />
              <tbody className="divide-y divide-[var(--workspace-border)]/50">
                <Row label="Recent" value="Last 3 executed commands at the top for fast re-run." />
                <Row label="Actions" value="Beautify, Minify, Flatten, Unflatten, Sort arrays, Remove duplicates, Diff, Generate Schema, Validate..." />
                <Row label="Convert to" value="JSON, YAML, XML, TOML, CSV" />
                <Row label="View as" value="Raw, Tree, Graph, Query, Table" />
                <Row label="Generate Types" value="TypeScript, Go, Python, Java, C#, Rust, Kotlin, Swift, Protobuf, SQL..." />
                <Row label="Samples" value="Load JSON / YAML / CSV / cURL samples; GitHub API, Stripe, K8s, OpenAPI examples" />
                <Row label="Settings" value="Sort keys, Remove empty, Quote style, Indent, CSV delimiter, Live transform, Auto-format on paste, Line wrap, Font size..." />
                <Row label="Workspace" value="Paste, Import file, Copy output, Download, Share, Browse history, Multi-tab, Find in output, Fullscreen, Maximize output, Focus pane..." />
                <Row label="Theme" value="Light, Dark, System" />
              </tbody>
            </TableWrap>
          </Section>

          {/* ── Copy As ── */}
          <Section id="copy-as" query={query} keywords={["copy as","base64","escaped","url-encoded","data uri","clipboard","encode","export"]}>
            <SectionTitle id="copy-as">Copy As</SectionTitle>
            <p className="mb-4 text-sm text-[var(--workspace-text-muted)]">
              Search <strong className="text-[var(--workspace-text)]">copy as</strong> in the command palette to copy output in alternate encodings:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { name: "Base64",         desc: "btoa(output) — compact binary-safe encoding." },
                { name: "Escaped string", desc: "Output wrapped as a JSON string literal (escaped) for embedding in code." },
                { name: "URL-encoded",    desc: "Percent-encoded for use in query parameters or form POST bodies." },
                { name: "Data URI",       desc: "data:application/json;base64,... for inline embedding in HTML / CSS." },
              ].map(({ name, desc }) => (
                <div key={name} className="rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4">
                  <p className="mb-1 font-bold text-[var(--workspace-text)]">{name}</p>
                  <p className="text-sm text-[var(--workspace-text-muted)]">{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── History ── */}
          <Section id="history" query={query} keywords={["history","undo","redo","restore","browse","export","stack","entry","previous"]}>
            <SectionTitle id="history">Input History</SectionTitle>
            <p className="mb-4 text-sm leading-relaxed text-[var(--workspace-text-muted)]">
              Every paste, import, or edit batch is saved to an undo stack (up to 100 entries per tab).
            </p>
            <ul className="space-y-2 text-sm text-[var(--workspace-text-muted)]">
              <li><strong className="text-[var(--workspace-text)]">Undo / Redo</strong> &mdash; <Kbd>Cmd Z</Kbd> / <Kbd>Cmd Shift Z</Kbd>, toolbar arrow buttons, or command palette.</li>
              <li><strong className="text-[var(--workspace-text)]">Browse history panel</strong> &mdash; Command palette &rarr; "Browse history". Opens a side panel listing all entries. Click any entry to restore.</li>
              <li><strong className="text-[var(--workspace-text)]">Export history</strong> &mdash; Downloads all undo entries as a JSON file.</li>
            </ul>
          </Section>

          {/* ── Share ── */}
          <Section id="share" query={query} keywords={["share","export","download","embed","iframe","link","url","copy","cloud","disable"]}>
            <SectionTitle id="share">Share &amp; Export</SectionTitle>
            <ul className="space-y-3 text-sm text-[var(--workspace-text-muted)]">
              <li><strong className="text-[var(--workspace-text)]">Share</strong> &mdash; Save the current workspace to cloud and generate a short link. Recipients see the same input, output, format and view settings. Command palette &rarr; "Share workspace link".</li>
              <li><strong className="text-[var(--workspace-text)]">Embed</strong> &mdash; After sharing, command palette &rarr; "Copy embed / iframe URL" for a read-only embeddable frame.</li>
              <li><strong className="text-[var(--workspace-text)]">Disable sharing</strong> &mdash; Click the x icon next to the shared link indicator in the status bar.</li>
              <li><strong className="text-[var(--workspace-text)]">Download</strong> &mdash; Saves output as a file (extension matches output format). Command palette &rarr; "Download output".</li>
              <li><strong className="text-[var(--workspace-text)]">Copy</strong> &mdash; Copy output text via the floating button, the status bar icon, or <Kbd>Cmd C</Kbd>.</li>
            </ul>
          </Section>

          {/* ── Shortcuts ── */}
          <Section id="shortcuts" query={query} keywords={["shortcuts","keyboard","hotkey","cmd","ctrl","keybinding","esc","enter","undo","redo"]}>
            <SectionTitle id="shortcuts">Keyboard Shortcuts</SectionTitle>
            <TableWrap>
              <THead cols={["Shortcut", "Action"]} />
              <tbody className="divide-y divide-[var(--workspace-border)]/50">
                <Row label={<Kbd>Cmd K</Kbd>} value="Open command palette (works inside the editor)" />
                <Row label={<Kbd>Cmd Z</Kbd>} value="Undo input" />
                <Row label={<Kbd>Cmd Shift Z</Kbd>} value="Redo input" />
                <Row label={<Kbd>Cmd V</Kbd>} value="Paste from clipboard into input" />
                <Row label={<Kbd>Cmd C</Kbd>} value="Copy output to clipboard" />
                <Row label={<Kbd>Cmd Enter</Kbd>} value="Parse and transform (when live transform is off)" />
                <Row label={<Kbd>ESC</Kbd>} value="Close command palette / modal" />
              </tbody>
            </TableWrap>
          </Section>

          {/* ── Pinning ── */}
          <Section id="pinning" query={query} keywords={["pinning","pin","star","toolbar","persist","quick access","favorite","unpin"]}>
            <SectionTitle id="pinning">Toolbar Pinning</SectionTitle>
            <p className="text-sm leading-relaxed text-[var(--workspace-text-muted)]">
              Every item &mdash; format, view, action, type language, setting &mdash; has a{" "}
              <strong className="text-[var(--workspace-text)]">&#9734;</strong> icon. Click it to pin the item to the quick-access toolbar.
              Pinned items persist across sessions via localStorage. You can also pin/unpin via command palette &rarr; search{" "}
              <strong className="text-[var(--workspace-text)]">pin</strong>.
            </p>
          </Section>

          {/* ── Privacy ── */}
          <Section id="privacy" query={query} keywords={["privacy","local","browser","data","server","localstorage","share","secure","offline"]}>
            <SectionTitle id="privacy">Privacy &amp; Local-First</SectionTitle>
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5 text-sm leading-relaxed text-[var(--workspace-text-muted)]">
              <p className="mb-2 font-bold text-emerald-600">Your data never leaves your browser</p>
              <p>
                formaty processes everything locally using a Web Worker. No input, output, or transform result is ever
                sent to any server &mdash; except when you explicitly click{" "}
                <strong className="text-[var(--workspace-text)]">Share</strong>. Session state (pinned items, theme, tabs, settings)
                is stored in localStorage. Shared links can be disabled at any time from the status bar.
              </p>
            </div>
          </Section>

          {/* Bottom CTA */}
          {!query && (
            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
              <p className="mb-4 text-base font-semibold text-[var(--workspace-text)]">Ready to try it?</p>
              <Link
                href="/playground"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-content shadow-lg shadow-primary/25 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-primary/35"
              >
                Open Playground &rarr;
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
