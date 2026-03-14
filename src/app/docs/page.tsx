import Link from "next/link";

export const metadata = {
  title: "Documentation",
  description: "jsonix feature guide and documentation",
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
            ← Back to jsonix
          </Link>
          <a
            href="https://github.com/kdkumawat/jsonix"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded p-1 text-sm text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:underline hover:text-primary transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 text-sm text-[var(--workspace-text)]">
        <h1 className="mb-6 text-2xl font-semibold">jsonix Documentation</h1>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Overview</h2>
          <p className="mb-3 leading-relaxed">
            jsonix is a local-first data toolkit for working with JSON, XML, YAML, TOML, and CSV.
            All processing runs in your browser — no data is sent to any server.
          </p>
          <p className="leading-relaxed">
            Use it to format, validate, transform, diff, and convert between data formats. Generate
            type definitions for TypeScript, Python, Go, Java, and more. View data as a tree or
            interactive graph.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Input & Output Formats</h2>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>JSON</strong> — Parse, format, validate, minify</li>
            <li><strong>XML</strong> — Parse and convert to/from other formats</li>
            <li><strong>YAML</strong> — Parse and convert</li>
            <li><strong>TOML</strong> — Parse and convert</li>
            <li><strong>CSV</strong> — Parse and convert (array of objects)</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            Input format is auto-detected when you paste or import. Override it via the status bar
            dropdown (bottom left). Output format is selected in the Transform config or toolbar.
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
                <td className="py-2">Convert nested objects to dot-notation keys (e.g. <code className="rounded bg-[var(--workspace-panel)] px-1">a.b.c</code>)</td>
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
          <h2 className="mb-3 text-lg font-medium">Output Views</h2>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>Raw</strong> — Code editor with syntax highlighting, line numbers, copy</li>
            <li><strong>Tree</strong> — Expandable tree view of the structure</li>
            <li><strong>Graph</strong> — Interactive graph visualization (JSON only)</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            Use the star icon next to any view to pin it to the toolbar for quick switching.
          </p>
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
            Star languages in the Transform config to pin them to the output toolbar. Each starred
            language appears as its own button for one-click generation.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Format Options</h2>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>Indent</strong> — 0–10 spaces. Use − / + buttons or reset to default (2)</li>
            <li><strong>Quote style</strong> — Double or single quotes for JSON strings</li>
            <li><strong>Sort keys</strong> — Alphabetize object keys in output</li>
            <li><strong>Remove empty</strong> — Strip null and empty values</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Toolbar & Pinning</h2>
          <p className="mb-3 leading-relaxed">
            Click the star icon next to any option (output format, view, action, indent, type
            language) to pin it to the top toolbar. Pinned items persist in your session (stored
            in localStorage).
          </p>
          <p className="leading-relaxed">
            This lets you customize the toolbar with your most-used actions for faster workflow.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Share & Export</h2>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>Share</strong> — Generate a URL with input/output encoded (compressed)</li>
            <li><strong>Copy</strong> — Copy output to clipboard</li>
            <li><strong>Download</strong> — Download output as a file with the appropriate extension</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Keyboard & Input</h2>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>Undo / Redo</strong> — Ctrl+Z, Ctrl+Shift+Z</li>
            <li><strong>Paste</strong> — Paste from clipboard (auto-detects format)</li>
            <li><strong>Import</strong> — Drop or select .json, .yaml, .xml, .toml, .csv files</li>
            <li><strong>Live Transform</strong> — Toggle in status bar to auto-transform on input change</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Privacy & Local-First</h2>
          <p className="leading-relaxed">
            jsonix runs entirely in your browser. No data is sent to external servers. Your input,
            output, and session state stay on your device. Session state (including pinned items)
            is stored in localStorage for convenience.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Transform Config</h2>
          <p className="mb-3 leading-relaxed">
            Click the chevron next to the Transform button to open the config panel. From there you can:
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>Select output format (JSON, XML, YAML, TOML, CSV)</li>
            <li>Choose view (Raw, Tree, Graph)</li>
            <li>Run actions (Format, Minify, Flatten, etc.)</li>
            <li>Adjust indent (0–10) with − / + / reset</li>
            <li>Set quote style (double or single)</li>
            <li>Toggle sort keys and remove empty</li>
            <li>Generate types in any supported language</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            Use the star icon to pin options to the toolbar. Pinned items appear as quick-access buttons.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Input Editor</h2>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>Undo / Redo</strong> — Toolbar buttons or Ctrl+Z / Ctrl+Shift+Z</li>
            <li><strong>Clear</strong> — Trash icon clears input and output</li>
            <li><strong>Paste</strong> — Header button pastes from clipboard</li>
            <li><strong>Import</strong> — Drop files or use Import to select .json, .yaml, .xml, .toml, .csv</li>
            <li><strong>Input format</strong> — Status bar shows detected format; click to override</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Schema & Validate</h2>
          <p className="mb-3 leading-relaxed">
            <strong>Schema</strong> generates a JSON Schema from your current input. Copy the output
            and use it elsewhere, or paste it into the Validate modal.
          </p>
          <p className="leading-relaxed">
            <strong>Validate</strong> checks your input against a schema. Click Validate, paste your
            JSON Schema (or YAML schema) in the modal, and run. Errors show in the status bar.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Diff</h2>
          <p className="leading-relaxed">
            Diff compares two JSON documents. Click Diff, paste the second document in the modal,
            and run. The output shows a side-by-side view with additions and removals highlighted.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Share URL</h2>
          <p className="leading-relaxed">
            Share encodes your input and output into a compressed URL. Anyone with the link can
            open the same state. Useful for debugging, code reviews, or sharing examples.
          </p>
        </section>
      </main>
    </div>
  );
}
