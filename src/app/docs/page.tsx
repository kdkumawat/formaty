import Link from "next/link";

export const metadata = {
  title: "Documentation",
  description: "formaty feature guide: JSON, XML, YAML, TOML, CSV converter, query playground, cURL, tree view, schema validation",
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
            <span className="inline-flex items-center gap-0.5 text-[10px] opacity-80">
              <svg className="h-3.5 w-3.5" fill="#e3b341" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 18.896l-7.416 3.518 1.48-8.279-6.064-5.828 8.332-1.151z"/></svg>
            </span>
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 text-sm text-[var(--workspace-text)]">
        <h1 className="mb-6 text-2xl font-semibold">formaty Documentation</h1>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Overview</h2>
          <p className="mb-3 leading-relaxed">
            formaty is a local-first data toolkit for working with JSON, XML, YAML, TOML, and CSV.
            All processing runs in your browser — no data is sent to any server.
          </p>
          <p className="leading-relaxed">
            Format, validate, transform, diff, and convert between data formats. Query data with JSONPath
            or JMESPath. Paste cURL commands to fetch API responses. Generate type definitions for TypeScript,
            Python, Go, Java, and more. View data as a tree, graph, or table.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Keyboard Shortcuts</h2>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>Ctrl+V / Cmd+V</strong> — Paste from clipboard (when input is empty, replaces content; when input has content, paste at cursor)</li>
            <li><strong>Ctrl+Enter / Cmd+Enter</strong> — Parse and transform</li>
            <li><strong>Ctrl+Z</strong> — Undo</li>
            <li><strong>Ctrl+Shift+Z</strong> — Redo</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Input & Output Formats</h2>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>JSON</strong> — Parse, format, validate, minify</li>
            <li><strong>XML</strong> — Parse and convert to/from other formats</li>
            <li><strong>YAML</strong> — Parse and convert</li>
            <li><strong>TOML</strong> — Parse and convert</li>
            <li><strong>CSV</strong> — Parse and convert (array of objects)</li>
            <li><strong>cURL</strong> — Paste a curl command; formaty executes it and renders the API response</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            Input format is auto-detected when you paste or import. Override it via the input format dropdown.
            Output format is selected in the Transform config or toolbar.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Query Playground</h2>
          <p className="mb-3 leading-relaxed">
            Use the <strong>Query</strong> view to run JSONPath or JMESPath queries on your data. Results update live.
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>JSONPath</strong> — e.g. <code className="rounded bg-[var(--workspace-panel)] px-1">$.users[?(@.age &gt; 25)]</code></li>
            <li><strong>JMESPath</strong> — e.g. <code className="rounded bg-[var(--workspace-panel)] px-1">users[?age &gt; `25`]</code></li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Output Views</h2>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>Raw</strong> — Code editor with syntax highlighting, line numbers, copy</li>
            <li><strong>Tree</strong> — Expandable tree view of the structure</li>
            <li><strong>Graph</strong> — Interactive graph visualization (JSON only)</li>
            <li><strong>Query</strong> — JSONPath/JMESPath query playground with live results</li>
            <li><strong>Table</strong> — Tabular view for arrays of objects (CSV-like)</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            Use the star icon next to any view to pin it to the toolbar for quick switching.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Transform Actions</h2>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--workspace-border)]">
                <th className="py-2 pr-4 font-medium">Action</th>
                <th className="py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--workspace-border)]">
                <td className="py-2 pr-4">Format</td>
                <td className="py-2">Pretty-print with configurable indent (0–10 spaces)</td>
              </tr>
              <tr className="border-b border-[var(--workspace-border)]">
                <td className="py-2 pr-4">Minify</td>
                <td className="py-2">Remove whitespace and newlines</td>
              </tr>
              <tr className="border-b border-[var(--workspace-border)]">
                <td className="py-2 pr-4">Flatten</td>
                <td className="py-2">Convert nested objects to dot-notation keys</td>
              </tr>
              <tr className="border-b border-[var(--workspace-border)]">
                <td className="py-2 pr-4">Unflatten</td>
                <td className="py-2">Expand dot-notation keys back to nested objects</td>
              </tr>
              <tr className="border-b border-[var(--workspace-border)]">
                <td className="py-2 pr-4">Schema</td>
                <td className="py-2">Generate JSON Schema from sample data</td>
              </tr>
              <tr className="border-b border-[var(--workspace-border)]">
                <td className="py-2 pr-4">Validate</td>
                <td className="py-2">Validate input against a JSON Schema (paste schema in modal)</td>
              </tr>
              <tr className="border-b border-[var(--workspace-border)]">
                <td className="py-2 pr-4">Diff</td>
                <td className="py-2">Compare two JSON documents side-by-side with highlighting</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Type Generation</h2>
          <p className="mb-3 leading-relaxed">
            Generate type definitions from your JSON data. Supported languages:
          </p>
          <ul className="mb-3 list-inside list-disc space-y-1">
            <li>TypeScript, Java, C#, Python, Go, Protobuf, Kotlin, Swift, Rust, SQL</li>
          </ul>
          <p className="leading-relaxed">
            Star languages in the Transform config to pin them to the output toolbar.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Format Options</h2>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>Indent</strong> — 0–10 spaces</li>
            <li><strong>Quote style</strong> — Double or single quotes for JSON strings</li>
            <li><strong>Sort keys</strong> — Alphabetize object keys in output</li>
            <li><strong>Remove empty</strong> — Strip null and empty values</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Share & Export</h2>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>Share</strong> — Save your playground to the cloud and get a short link at <code className="rounded bg-[var(--workspace-panel)] px-1">/playground?id={'{id}'}</code>. Recipients see the same input, output, view mode (raw/graph/table/tree/query), format, and type language. Your local preferences are not overwritten.</li>
            <li><strong>Copy</strong> — Copy output to clipboard</li>
            <li><strong>Download</strong> — Download output as a file</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            To stop sharing, click the disable icon next to the link — the link is removed and others will see a &quot;not found&quot; message.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Example Gallery</h2>
          <p className="leading-relaxed">
            On the hero (empty output state), try sample data: JSON, XML, YAML, TOML, CSV, cURL, or examples
            like GitHub API, Stripe webhook, Kubernetes manifest, and OpenAPI schema.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Privacy & Local-First</h2>
          <p className="leading-relaxed">
            <strong>Your data stays in your browser only.</strong> formaty runs entirely in your browser. No input or output is sent to servers except when you explicitly share a link. Session state is stored in localStorage. Shared links can be disabled at any time.
          </p>
        </section>
      </main>
    </div>
  );
}
