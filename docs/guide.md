# jsonix Feature Guide

## Overview

jsonix is a local-first data toolkit for working with JSON, XML, YAML, TOML, and CSV. All processing runs in your browser — no data is sent to any server.

Use it to format, validate, transform, diff, and convert between data formats. Generate type definitions for TypeScript, Python, Go, Java, and more. View data as a tree or interactive graph.

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
| **Format** | Pretty-print with configurable indent (0–10 spaces) |
| **Minify** | Remove whitespace and newlines |
| **Flatten** | Convert nested objects to dot-notation keys (e.g. `a.b.c`) |
| **Unflatten** | Expand dot-notation keys back to nested objects |
| **Schema** | Generate JSON Schema from sample data |
| **Validate** | Validate input against a JSON Schema (paste schema in modal) |
| **Diff** | Compare two JSON documents side-by-side with highlighting |

## Output Views

- **Raw** — Code editor with syntax highlighting, line numbers, copy
- **Tree** — Expandable tree view of the structure
- **Graph** — Interactive graph visualization (JSON only)

Use the star icon next to any view to pin it to the toolbar for quick switching.

## Type Generation

Generate type definitions from your JSON data. Supported languages:

TypeScript, Java, C#, Python, Go, Protobuf, Kotlin, Swift, Rust, SQL

Star languages in the Transform config to pin them to the output toolbar. Each starred language appears as its own button for one-click generation.

## Format Options

- **Indent** — 0–10 spaces. Use − / + buttons or reset to default (2)
- **Quote style** — Double or single quotes for JSON strings
- **Sort keys** — Alphabetize object keys in output
- **Remove empty** — Strip null and empty values

## Toolbar & Pinning

Click the star icon next to any option (output format, view, action, indent, type language) to pin it to the top toolbar. Pinned items persist in your session (stored in localStorage).

This lets you customize the toolbar with your most-used actions for faster workflow.

## Share & Export

- **Share** — Generate a URL with input/output encoded (compressed)
- **Copy** — Copy output to clipboard
- **Download** — Download output as a file with the appropriate extension

## Keyboard & Input

- **Undo / Redo** — Ctrl+Z, Ctrl+Shift+Z
- **Paste** — Paste from clipboard (auto-detects format)
- **Import** — Drop or select .json, .yaml, .xml, .toml, .csv files
- **Live Transform** — Toggle in status bar to auto-transform on input change

## Privacy & Local-First

jsonix runs entirely in your browser. No data is sent to external servers. Your input, output, and session state stay on your device. Session state (including pinned items) is stored in localStorage for convenience.

## Transform Config

Click the chevron next to the Transform button to open the config panel. From there you can select output format, view, run actions, adjust indent, set quote style, toggle sort keys/remove empty, and generate types. Use the star icon to pin options to the toolbar.

## Schema & Validate

**Schema** generates a JSON Schema from your input. **Validate** checks your input against a schema — paste the schema in the modal and run. Errors show in the status bar.

## Diff

Diff compares two JSON documents. Paste the second document in the modal and run. Output shows a side-by-side view with additions and removals highlighted.

## Share URL

Share encodes your input and output into a compressed URL. Anyone with the link can open the same state.
