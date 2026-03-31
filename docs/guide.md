# formaty Feature Guide

## Overview

formaty is a local-first data toolkit for working with JSON, XML, YAML, TOML, and CSV. All processing runs in your browser — no data is sent to any server.

Format, validate, transform, diff, and convert between data formats. Query data with JSONPath or JMESPath. Paste cURL commands to fetch API responses. Generate type definitions for TypeScript, Python, Go, Java, and more. View data as a tree, graph, or table.

---

## Input & Output Formats

| Format | Support |
|--------|----------|
| **JSON** | Parse, format, validate, minify |
| **XML** | Parse and convert to/from other formats |
| **YAML** | Parse and convert |
| **TOML** | Parse and convert |
| **CSV** | Parse and convert (array of objects); configurable delimiter |
| **cURL** | Paste a curl command; formaty executes it and renders the API response |

Input format is auto-detected when you paste or import. Override it via the input format dropdown in the status bar.

---

## Transform Actions

| Action | Description |
|--------|-------------|
| **Beautify** | Pretty-print with indentation |
| **Minify** | Remove whitespace and newlines |
| **Flatten** | Convert nested objects to dot-notation keys (`a.b.c`) |
| **Unflatten** | Expand dot-notation keys back to nested objects |
| **Sort array items** | Sort all array contents recursively |
| **Remove duplicate items** | Deduplicate array values recursively |
| **Generate JSON Schema** | Infer a JSON Schema from sample data |
| **Validate against Schema** | Validate input against a JSON Schema (paste schema in modal) |
| **Diff / Compare** | Compare two JSON documents with highlighted changes |

---

## Output Views

| View | Description |
|------|-------------|
| **Raw** | Code editor with syntax highlighting, line numbers, copy |
| **Tree** | Expandable tree view of the structure |
| **Graph** | Interactive graph visualization |
| **Query** | JSONPath / JMESPath playground with live results |
| **Table** | Tabular view for arrays of objects |

Star any view to pin it to the toolbar for quick switching.

---

## Type Generation

Generate type definitions from your JSON data. Supported languages:

TypeScript, Java, C#, Python, Go, Protobuf, Kotlin, Swift, Rust, SQL

Star languages to pin them to the output toolbar for one-click generation.

---

## Format Options

| Option | Description |
|--------|-------------|
| **Indent** | 0–10 spaces. Use − / + buttons or reset |
| **Quote style** | Double or single quotes for JSON strings |
| **Sort keys** | Alphabetize object keys in output |
| **Remove empty** | Strip null and empty values |
| **CSV delimiter** | Comma (default), Tab (TSV), Semicolon, or Pipe |
| **Line wrap** | Wrap long lines in the editor (toggle in command palette) |

---

## Diff

Diff compares two JSON documents. Paste the second document in the right editor pane when diff mode is active.

- **Side-by-side view** — changes displayed in two columns (default)
- **Inline view** — toggle with the "Inline" / "Side-by-side" button in the diff toolbar
- **Previous / Next difference** — navigate between individual changes using the ↑ ↓ buttons in the diff toolbar, or via the command palette

---

## Command Palette (`⌘K` / `Ctrl+K`)

Press `⌘K` (or `Ctrl+K` on Windows/Linux) anywhere in the workspace — even while the editor is focused — to open the command palette. Search and run any action without touching the mouse.

### Categories

| Category | Examples |
|----------|----------|
| **Actions** | Beautify, Minify, Flatten, Sort arrays, Remove duplicates, Diff… |
| **Convert to** | JSON, YAML, XML, TOML, CSV |
| **View as** | Raw, Tree, Graph, Query, Table |
| **Generate Types** | TypeScript, Go, Python, Java, C#, Rust… |
| **Samples** | Load JSON / YAML / CSV sample, GitHub API example, Stripe webhook… |
| **Settings** | Sort keys, Remove empty, Quote style, Indent, CSV delimiter, Line wrap, Live transform, Pin/Unpin |
| **Workspace** | Copy output, Copy as Base64/Escaped/URL-encoded/Data URI, Download, Share, Browse history, Export history, Focus input/output, Find in output, Undo/Redo |
| **Theme** | Light, Dark, System |

---

## Copy As

From the command palette (`⌘K`), search "copy as" to copy the output in multiple encodings:

- **Base64** — `btoa(output)`
- **Escaped string** — output wrapped in a JSON string literal
- **URL-encoded** — percent-encoded for use in query parameters
- **Data URI** — `data:application/json;base64,...`

---

## Input History

Every paste, import, or keystroke batch is tracked in an undo stack (up to 100 entries).

- **Undo / Redo** — `Ctrl+Z` / `Ctrl+Shift+Z`, or via the toolbar arrows, or via the command palette
- **Browse history** — Open the history panel from the command palette → "Browse input history". Click any entry to restore it.
- **Export history** — Download all undo entries as a JSON file via command palette → "Export history"

---

## Share & Export

- **Share** — Save your playground to the cloud and get a short link (`/playground?id=...`). Recipients see the same input, output, view mode, format, and type language. Your local preferences are not overwritten.
- **Embed / iframe URL** — After sharing, open the command palette and run "Copy embed / iframe URL" to get a shareable read-only embed URL.
- **Copy** — Copy output to clipboard
- **Download** — Download output as a file (extension matches output format)

To stop sharing, click the disable icon next to the link.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open command palette |
| `⌘Z` / `Ctrl+Z` | Undo input |
| `⌘⇧Z` / `Ctrl+Shift+Z` | Redo input |
| `⌘V` / `Ctrl+V` | Paste from clipboard |
| `⌘C` / `Ctrl+C` | Copy output |
| `⌘Enter` / `Ctrl+Enter` | Parse and transform |
| `ESC` | Close command palette |
| `↑` / `↓` (palette) | Navigate commands |
| `↵` (palette) | Run selected command |

---

## Toolbar & Pinning

Every option (output format, view, action, indent, type language) has a star icon. Click it to pin the item to the top toolbar. Pinned items persist in your session (stored in localStorage).

You can also pin/unpin from the command palette → "Pin current view" / "Pin current format".

---

## Privacy & Local-First

formaty runs entirely in your browser. **Your data stays on your screen** — no input or output is sent to any server except when you explicitly click Share. Session state (pinned items, theme, etc.) is stored in localStorage. Shared links can be disabled at any time.


## Input & Output Formats

| Format | Support |
|--------|---------|
| **JSON** | Parse, format, validate, minify |
| **XML** | Parse and convert to/from other formats |
| **YAML** | Parse and convert |
| **TOML** | Parse and convert |
| **CSV** | Parse and convert (array of objects) |

Input format is auto-detected when you paste or import. Override it via the status bar dropdown (bottom left). Output format is selected in the Transform config or toolbar.

## Transform Actions

| Action | Description |
|--------|-------------|
| **Beautify** | Pretty-print with indentation |
| **Format** | Pretty-print with configurable indent (0–10 spaces) |
| **Minify** | Remove whitespace and newlines |
| **Flatten** | Convert nested objects to dot-notation keys (e.g. `a.b.c`) |
| **Unflatten** | Expand dot-notation keys back to nested objects |
| **Schema** | Generate JSON Schema from sample data |
| **Validate** | Validate input against a JSON Schema (paste schema in modal) |
| **Diff** | Compare two JSON documents side-by-side with highlighting |

## Output Views

- **Raw** - Code editor with syntax highlighting, line numbers, copy
- **Tree** - Expandable tree view of the structure
- **Graph** - Interactive graph visualization (all formats)

Use the star icon next to any view to pin it to the toolbar for quick switching.

## Type Generation

Generate type definitions from your JSON data. Supported languages:

TypeScript, Java, C#, Python, Go, Protobuf, Kotlin, Swift, Rust, SQL

Star languages in the Transform config to pin them to the output toolbar. Each starred language appears as its own button for one-click generation.

## Format Options

- **Indent** - 0–10 spaces. Use − / + buttons or reset to default (2)
- **Quote style** - Double or single quotes for JSON strings
- **Sort keys** - Alphabetize object keys in output
- **Remove empty** - Strip null and empty values

## Toolbar & Pinning

Click the star icon next to any option (output format, view, action, indent, type language) to pin it to the top toolbar. Pinned items persist in your session (stored in localStorage).

This lets you customize the toolbar with your most-used actions for faster workflow.

## Share & Export

- **Share** - Save your playground to the cloud and get a short link (`/playground?id=...`). Anyone with the link sees the same input, output, view mode (raw/graph/table/tree/query), format, and settings. Your local preferences are not overwritten when viewing a shared link.
- **Copy** - Copy output to clipboard
- **Download** - Download output as a file with the appropriate extension

## Keyboard & Input

- **Undo / Redo** - Ctrl+Z, Ctrl+Shift+Z
- **Paste** - Paste from clipboard (auto-detects format)
- **Import** - Drop or select .json, .yaml, .xml, .toml, .csv files
- **Live Transform** - Toggle in status bar to auto-transform on input change

## Privacy & Local-First

formaty runs entirely in your browser. **Your data stays on your screen** - no input or output is sent to servers except when you explicitly share a link. Session state (pinned items, theme, etc.) is stored in localStorage. Shared links are stored temporarily; you can disable them at any time.

## Transform Config

Click the chevron next to the Transform button to open the config panel. From there you can select output format, view, run actions, adjust indent, set quote style, toggle sort keys/remove empty, and generate types. Use the star icon to pin options to the toolbar.

## Schema & Validate

**Schema** generates a JSON Schema from your input. **Validate** checks your input against a schema - paste the schema in the modal and run. Errors show in the status bar.

## Diff

Diff compares two JSON documents. Paste the second document in the modal and run. Output shows a side-by-side view with additions and removals highlighted.

## Share URL

Share saves your playground to the cloud and generates a short link at `/playground?id={id}`. Anyone with the link sees:

- Input and output
- View mode (raw, tree, graph, query, table)
- Output format (JSON, XML, YAML, etc.) and type language (TypeScript, Java, etc.) when applicable
- Split ratio and live-transform setting

Your own settings (theme, pinned items, etc.) are not changed when you open a shared link. To stop sharing, click the disable icon next to the link - the link is removed and others will see a "not found" message.
