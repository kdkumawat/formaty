import Link from "next/link";

export const metadata = {
  title: "Documentation",
  description: "formaty feature guide: JSON, XML, YAML, TOML, CSV converter, command palette, diff navigation, history, query playground, cURL, type generation, schema validation",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[var(--workspace-panel)]">
      <header className="sticky top-0 z-10 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-1">
          <Link
            href="/"
            className="rounded p-1 text-sm text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:underline hover:text-primary transition-colors"
          >
            ← Back to formaty
          </Link>
          <a
            href="https://github.com/kdkumawat/formaty"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded p-1 text-sm text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:underline hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
            GitHub
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 text-sm text-[var(--workspace-text)]">
        <h1 className="mb-2 text-2xl font-semibold">formaty Documentation</h1>
        <p className="mb-8 text-[var(--workspace-text-muted)]">Local-first data toolkit. Everything runs in your browser.</p>

        {/* TOC */}
        <nav className="mb-10 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-background)] p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">Contents</p>
          <ol className="list-inside list-decimal space-y-1 text-primary">
            {["Input & Output Formats","Transform Actions","Output Views","Type Generation","Format Options","Diff","Command Palette","Copy As","Input History","Share & Export","Keyboard Shortcuts","Toolbar & Pinning","Privacy"].map((s) => (
              <li key={s}><a href={`#${s.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`} className="hover:underline">{s}</a></li>
            ))}
          </ol>
        </nav>

        <section className="mb-10" id="input-output-formats">
          <h2 className="mb-3 text-lg font-semibold">Input &amp; Output Formats</h2>
          <table className="w-full border-collapse text-left">
            <thead><tr className="border-b border-[var(--workspace-border)]"><th className="py-2 pr-4 font-medium">Format</th><th className="py-2 font-medium">Support</th></tr></thead>
            <tbody className="divide-y divide-[var(--workspace-border)]">
              <tr><td className="py-2 pr-4 font-medium">JSON</td><td className="py-2">Parse, format, validate, minify</td></tr>
              <tr><td className="py-2 pr-4 font-medium">XML</td><td className="py-2">Parse and convert to/from other formats</td></tr>
              <tr><td className="py-2 pr-4 font-medium">YAML</td><td className="py-2">Parse and convert</td></tr>
              <tr><td className="py-2 pr-4 font-medium">TOML</td><td className="py-2">Parse and convert</td></tr>
              <tr><td className="py-2 pr-4 font-medium">CSV</td><td className="py-2">Parse and convert (array of objects). Delimiter: comma, tab, semicolon, or pipe</td></tr>
              <tr><td className="py-2 pr-4 font-medium">cURL</td><td className="py-2">Paste a curl command — formaty executes it and renders the API response</td></tr>
            </tbody>
          </table>
          <p className="mt-3 text-[var(--workspace-text-muted)]">Input format is auto-detected. Override via the input format dropdown in the status bar.</p>
        </section>

        <section className="mb-10" id="transform-actions">
          <h2 className="mb-3 text-lg font-semibold">Transform Actions</h2>
          <table className="w-full border-collapse text-left">
            <thead><tr className="border-b border-[var(--workspace-border)]"><th className="py-2 pr-4 font-medium">Action</th><th className="py-2 font-medium">Description</th></tr></thead>
            <tbody className="divide-y divide-[var(--workspace-border)]">
              <tr><td className="py-2 pr-4">Beautify</td><td className="py-2">Pretty-print with indentation</td></tr>
              <tr><td className="py-2 pr-4">Minify</td><td className="py-2">Remove all whitespace and newlines</td></tr>
              <tr><td className="py-2 pr-4">Flatten</td><td className="py-2">Convert nested objects to dot-notation keys — <code className="rounded bg-[var(--workspace-background)] px-1">a.b.c</code></td></tr>
              <tr><td className="py-2 pr-4">Unflatten</td><td className="py-2">Expand dot-notation keys back to nested objects</td></tr>
              <tr><td className="py-2 pr-4">Sort array items</td><td className="py-2">Sort all array contents recursively (alphabetically / numerically)</td></tr>
              <tr><td className="py-2 pr-4">Remove duplicate items</td><td className="py-2">Deduplicate array values recursively (deep equality)</td></tr>
              <tr><td className="py-2 pr-4">Generate JSON Schema</td><td className="py-2">Infer a JSON Schema from sample data</td></tr>
              <tr><td className="py-2 pr-4">Validate against Schema</td><td className="py-2">Check input against a JSON Schema — paste schema in the modal</td></tr>
              <tr><td className="py-2 pr-4">Diff / Compare</td><td className="py-2">Side-by-side diff of two documents with highlighted additions and removals</td></tr>
            </tbody>
          </table>
        </section>

        <section className="mb-10" id="output-views">
          <h2 className="mb-3 text-lg font-semibold">Output Views</h2>
          <ul className="space-y-2">
            <li><strong>Raw</strong> — Code editor with syntax highlighting, line numbers, copy</li>
            <li><strong>Tree</strong> — Expandable tree view of the data structure</li>
            <li><strong>Graph</strong> — Interactive graph visualization with zoom and pan</li>
            <li><strong>Query</strong> — JSONPath / JMESPath playground with live results. Examples: <code className="rounded bg-[var(--workspace-background)] px-1">$.users[?(@.age &gt; 25)]</code> or <code className="rounded bg-[var(--workspace-background)] px-1">users[?age &gt; `25`]</code></li>
            <li><strong>Table</strong> — Tabular view for arrays of objects</li>
          </ul>
          <p className="mt-3 text-[var(--workspace-text-muted)]">Star any view to pin it to the toolbar for quick switching.</p>
        </section>

        <section className="mb-10" id="type-generation">
          <h2 className="mb-3 text-lg font-semibold">Type Generation</h2>
          <p className="mb-3">Generate type definitions from your JSON data. Supported languages:</p>
          <div className="flex flex-wrap gap-1.5">
            {["TypeScript","Java","C#","Python","Go","Protobuf","Kotlin","Swift","Rust","SQL"].map((l) => (
              <span key={l} className="rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-2 py-0.5 text-xs">{l}</span>
            ))}
          </div>
          <p className="mt-3 text-[var(--workspace-text-muted)]">Star any language to pin it to the output toolbar for one-click generation.</p>
        </section>

        <section className="mb-10" id="format-options">
          <h2 className="mb-3 text-lg font-semibold">Format Options</h2>
          <table className="w-full border-collapse text-left">
            <thead><tr className="border-b border-[var(--workspace-border)]"><th className="py-2 pr-4 font-medium">Option</th><th className="py-2 font-medium">Description</th></tr></thead>
            <tbody className="divide-y divide-[var(--workspace-border)]">
              <tr><td className="py-2 pr-4">Indent</td><td className="py-2">0–10 spaces. Use − / + buttons or reset to default (2)</td></tr>
              <tr><td className="py-2 pr-4">Quote style</td><td className="py-2">Double or single quotes for JSON strings</td></tr>
              <tr><td className="py-2 pr-4">Sort keys</td><td className="py-2">Alphabetize all object keys in output</td></tr>
              <tr><td className="py-2 pr-4">Remove empty</td><td className="py-2">Strip null, empty string, and empty array/object values</td></tr>
              <tr><td className="py-2 pr-4">CSV delimiter</td><td className="py-2">Comma <code className="rounded bg-[var(--workspace-background)] px-1">,</code> (default), Tab <code className="rounded bg-[var(--workspace-background)] px-1">\t</code>, Semicolon <code className="rounded bg-[var(--workspace-background)] px-1">;</code>, or Pipe <code className="rounded bg-[var(--workspace-background)] px-1">|</code></td></tr>
              <tr><td className="py-2 pr-4">Line wrap</td><td className="py-2">Wrap long lines in the editor. Toggle via command palette → &quot;Line wrap&quot;</td></tr>
            </tbody>
          </table>
        </section>

        <section className="mb-10" id="diff">
          <h2 className="mb-3 text-lg font-semibold">Diff</h2>
          <p className="mb-3">Compare two documents by running the <strong>Diff / Compare</strong> action and editing both panes.</p>
          <ul className="space-y-2">
            <li><strong>Side-by-side view</strong> — changes displayed in two columns (default)</li>
            <li><strong>Inline view</strong> — toggle with the &quot;Inline&quot; / &quot;Side-by-side&quot; button in the diff toolbar</li>
            <li><strong>Previous / Next difference</strong> — use the ↑ ↓ buttons in the diff toolbar, or search &quot;diff&quot; in the command palette</li>
          </ul>
        </section>

        <section className="mb-10" id="command-palette">
          <h2 className="mb-3 text-lg font-semibold">Command Palette</h2>
          <p className="mb-3">Press <kbd className="rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1.5 py-0.5 font-mono text-xs">⌘K</kbd> anywhere — even while the editor is focused — to open the command palette. Search and run any action without touching the mouse.</p>
          <table className="w-full border-collapse text-left">
            <thead><tr className="border-b border-[var(--workspace-border)]"><th className="py-2 pr-4 font-medium">Category</th><th className="py-2 font-medium">Examples</th></tr></thead>
            <tbody className="divide-y divide-[var(--workspace-border)]">
              <tr><td className="py-2 pr-4">Actions</td><td className="py-2">Beautify, Minify, Flatten, Sort arrays, Remove duplicates, Diff…</td></tr>
              <tr><td className="py-2 pr-4">Convert to</td><td className="py-2">JSON, YAML, XML, TOML, CSV</td></tr>
              <tr><td className="py-2 pr-4">View as</td><td className="py-2">Raw, Tree, Graph, Query, Table</td></tr>
              <tr><td className="py-2 pr-4">Generate Types</td><td className="py-2">TypeScript, Go, Python, Java, C#, Rust…</td></tr>
              <tr><td className="py-2 pr-4">Samples</td><td className="py-2">Load JSON / YAML / CSV sample, GitHub API example, Stripe webhook…</td></tr>
              <tr><td className="py-2 pr-4">Settings</td><td className="py-2">Sort keys, Remove empty, Quote style, Indent, CSV delimiter, Line wrap, Live transform, Pin/Unpin…</td></tr>
              <tr><td className="py-2 pr-4">Workspace</td><td className="py-2">Copy, Copy as Base64/Escaped/URL-encoded/Data URI, Download, Share, Browse history, Export history, Focus input/output, Find in output, Undo/Redo, Fullscreen…</td></tr>
              <tr><td className="py-2 pr-4">Theme</td><td className="py-2">Light, Dark, System</td></tr>
            </tbody>
          </table>
        </section>

        <section className="mb-10" id="copy-as">
          <h2 className="mb-3 text-lg font-semibold">Copy As</h2>
          <p className="mb-3">Search &quot;copy as&quot; in the command palette to copy output in different encodings:</p>
          <ul className="space-y-1.5">
            <li><strong>Base64</strong> — <code className="rounded bg-[var(--workspace-background)] px-1">btoa(output)</code></li>
            <li><strong>Escaped string</strong> — output wrapped in a JSON string literal (e.g. for embedding in code)</li>
            <li><strong>URL-encoded</strong> — percent-encoded for use in query parameters</li>
            <li><strong>Data URI</strong> — <code className="rounded bg-[var(--workspace-background)] px-1">data:application/json;base64,...</code></li>
          </ul>
        </section>

        <section className="mb-10" id="input-history">
          <h2 className="mb-3 text-lg font-semibold">Input History</h2>
          <p className="mb-3">Every paste, import, or edit batch is tracked in an undo stack (up to 100 entries).</p>
          <ul className="space-y-1.5">
            <li><strong>Undo / Redo</strong> — <kbd className="rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1 py-0.5 font-mono text-xs">⌘Z</kbd> / <kbd className="rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1 py-0.5 font-mono text-xs">⌘⇧Z</kbd>, toolbar arrows, or command palette</li>
            <li><strong>Browse history</strong> — Command palette → &quot;Browse input history&quot; opens a side panel with all entries. Click any to restore.</li>
            <li><strong>Export history</strong> — Command palette → &quot;Export history&quot; downloads all undo entries as a JSON file</li>
          </ul>
        </section>

        <section className="mb-10" id="share-export">
          <h2 className="mb-3 text-lg font-semibold">Share &amp; Export</h2>
          <ul className="space-y-2">
            <li><strong>Share</strong> — Save your playground to the cloud and get a short link at <code className="rounded bg-[var(--workspace-background)] px-1">/playground?id=&#123;id&#125;</code>. Recipients see the same input, output, view mode, format, and type language. Your local preferences are not overwritten.</li>
            <li><strong>Embed / iframe URL</strong> — After sharing, open the command palette → &quot;Copy embed / iframe URL&quot; for a shareable read-only embed URL.</li>
            <li><strong>Copy</strong> — Copy output to clipboard</li>
            <li><strong>Download</strong> — Download output as a file (extension matches output format)</li>
          </ul>
          <p className="mt-3 text-[var(--workspace-text-muted)]">To stop sharing, click the disable icon next to the link — the link is removed and others will see a &quot;not found&quot; message.</p>
        </section>

        <section className="mb-10" id="keyboard-shortcuts">
          <h2 className="mb-3 text-lg font-semibold">Keyboard Shortcuts</h2>
          <table className="w-full border-collapse text-left">
            <thead><tr className="border-b border-[var(--workspace-border)]"><th className="py-2 pr-4 font-medium">Shortcut</th><th className="py-2 font-medium">Action</th></tr></thead>
            <tbody className="divide-y divide-[var(--workspace-border)]">
              <tr><td className="py-2 pr-4 font-mono text-xs">⌘K / Ctrl+K</td><td className="py-2">Open command palette (works even inside editor)</td></tr>
              <tr><td className="py-2 pr-4 font-mono text-xs">⌘Z / Ctrl+Z</td><td className="py-2">Undo input</td></tr>
              <tr><td className="py-2 pr-4 font-mono text-xs">⌘⇧Z / Ctrl+Shift+Z</td><td className="py-2">Redo input</td></tr>
              <tr><td className="py-2 pr-4 font-mono text-xs">⌘V / Ctrl+V</td><td className="py-2">Paste from clipboard</td></tr>
              <tr><td className="py-2 pr-4 font-mono text-xs">⌘C / Ctrl+C</td><td className="py-2">Copy output</td></tr>
              <tr><td className="py-2 pr-4 font-mono text-xs">⌘↵ / Ctrl+Enter</td><td className="py-2">Parse and transform</td></tr>
              <tr><td className="py-2 pr-4 font-mono text-xs">ESC</td><td className="py-2">Close command palette</td></tr>
              <tr><td className="py-2 pr-4 font-mono text-xs">↑ ↓ in palette</td><td className="py-2">Navigate commands</td></tr>
              <tr><td className="py-2 pr-4 font-mono text-xs">↵ in palette</td><td className="py-2">Run selected command</td></tr>
            </tbody>
          </table>
        </section>

        <section className="mb-10" id="toolbar-pinning">
          <h2 className="mb-3 text-lg font-semibold">Toolbar &amp; Pinning</h2>
          <p className="mb-3">Every option (output format, view, action, indent, type language) has a star ☆ icon. Click it to pin the item to the top toolbar. Pinned items persist in your session via localStorage.</p>
          <p className="text-[var(--workspace-text-muted)]">You can also pin/unpin via the command palette: search &quot;pin&quot;.</p>
        </section>

        <section className="mb-10" id="privacy">
          <h2 className="mb-3 text-lg font-semibold">Privacy &amp; Local-First</h2>
          <p className="leading-relaxed">
            <strong>Your data stays in your browser only.</strong> formaty runs entirely in your browser using a Web Worker. No input, output, or transform results are sent to any server — except when you explicitly click Share. Session state (pinned items, theme, etc.) is stored in localStorage. Shared links can be disabled at any time.
          </p>
        </section>
      </main>
    </div>
  );
}
