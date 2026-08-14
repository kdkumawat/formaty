# formaty Feature Guide

## Overview

formaty is a local-first data toolkit for working with JSON, XML, YAML, TOML, and CSV. All processing runs in your browser - no data is sent to any server unless you explicitly share a link.

Three workspace tools share one chrome: **Transform** (format / convert / views / types), **Compare** (document or list/set), and **Utils** (UUID, Base64, JWT, hash, time, URL, and more). Query with JSONPath or JMESPath. Paste cURL commands to fetch API responses. Generate types for TypeScript, Zod, Python, Pydantic, Go, Java, and more.

---

## Workspace tools

| Tool | Description |
|------|-------------|
| **Transform** | Left input / right output - format, convert, views, types |
| **Compare** | Full-width Document diff or List/Set compare (Document \| Lists on the same toolbar row) |
| **Utils** | Full-width developer helpers; tool tabs (UUID, Base64, …) sit on the same row as Transform \| Compare \| Utils |

On parse errors, use **Clear** or **Load table sample** in the error panel. JSON accepts common loose forms (single quotes, trailing commas) when possible.

---

## Input & Output Formats

| Format | Support |
|--------|----------|
| **JSON** | Parse, format, validate, minify (loose single-quoted form accepted when possible) |
| **XML** | Parse and convert to/from other formats |
| **YAML** | Parse and convert |
| **TOML** | Parse and convert |
| **CSV** | Parse and convert (array of objects); configurable delimiter |
| **cURL** | Paste a curl command; formaty executes it and renders the API response |

Input format is auto-detected when you paste or import. Override it via the input format dropdown in the status bar. Empty workspace includes a **Table** sample (array of objects).

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

Compare and Utils are first-class tools (not nested under Actions).

---

## Output Views

| View | Description |
|------|-------------|
| **Raw** | Code editor with syntax highlighting, line numbers, copy |
| **Tree** | Expandable tree - copy path/value, expand/collapse all |
| **Graph** | Interactive graph visualization (best for medium payloads) |
| **Query** | JSONPath / JMESPath playground with samples, history, promote result |
| **Table** | Tabular view for **arrays of objects** - sort, search, hide columns |

Use **Use output as input** (toolbar arrow) to chain workflows (e.g. convert → types → query).

---

## Type Generation

Supported targets:

TypeScript, **Zod**, Java, C#, Python, **Pydantic**, Go, Protobuf, Kotlin, Swift, Rust, SQL

Star languages in settings to pin them when using the expanded toolbar.

---

## Format Options

| Option | Description |
|--------|-------------|
| **Indent** | 0-10 spaces |
| **Quote style** | Double or single quotes for JSON strings |
| **Sort keys** | Alphabetize object keys in output |
| **Remove empty** | Strip null and empty values |
| **CSV delimiter** | Comma, Tab, Semicolon, or Pipe |
| **Line wrap** | Wrap long lines in the editor |
| **Floating actions** | Optional draggable Share/Copy chip (default is toolbar - never covers text) |

---

## Diff & Compare

### Document mode
Compares two text/JSON documents full-width.

- Side-by-side / Inline layout
- Hunk counts, +/− lines, JSON path totals
- Trim WS, swap, beautify, export report
- Reset clears both sides (same toolbar style as Utils)

### List / Set mode
Compare two lists for common / only-left / only-right.

- Parse: auto, newline, comma, semicolon, pipe, whitespace, or JSON array
- Export: SQL `IN` / `NOT IN`, JSON, CSV, YAML, JS/Python lists, regex

---

## Utils

Developer helpers that run entirely in the browser. Each tool has its own input/output state and a **Sample** button.

| Tool | Description |
|------|-------------|
| **UUID** | Generate v4 UUIDs (count 1-50), copy per id, or NIL |
| **Base64** | Encode / decode (auto or forced) |
| **JWT** | Decode header + payload (no verify) |
| **Hash** | SHA-256 / SHA-1 hex |
| **Time** | Unix ↔ ISO; empty = now |
| **URL** | Percent-encode / decode |
| **Case** | snake, kebab, camel, pascal, constant, slug, … |
| **Hex** | Text ↔ hex |
| **Number** | Dec / hex / binary / octal |
| **Escape** | JSON string escape / unescape |
| **HTML** | Entity encode / decode |
| **Password** | Cryptographically random passwords |
| **Stats** | Lines, words, characters, bytes |

Most tools update **live** as you type (no Run button). UUID / Password regenerate when you change count/length or press **New**. Sample and Reset live in the input header.

Each workspace tab keeps its own Utils tool selection and I/O. Document vs Lists for Compare is also remembered per tab.

---

## Share

Share always asks for confirmation. With multi-tab enabled, a **Share all tabs** checkbox includes every tab’s transform input/output, Compare sides, and Utils state.

---

## Command Palette (`⌘K` / `Ctrl+K`)

Search and run any action without the mouse.

| Category | Examples |
|----------|----------|
| **Actions** | Beautify, Minify, Flatten, Diff… |
| **Convert to** | JSON, YAML, XML, TOML, CSV |
| **View as** | Raw, Tree, Graph, Query, Table |
| **Generate Types** | TypeScript, Zod, Go, Pydantic… |
| **Samples** | Load sample formats, API examples |
| **Settings** | Sort keys, indent, line wrap, menus |
| **Workspace** | Copy, Copy as…, Download, Share, Use output as input, History |

---

## Output actions (toolbar)

Share, Copy, Copy as (Base64 / escaped / URL / Data URI), Download, Maximize, and **Use output as input** sit on the **right side of the output toolbar** so they never cover editor text. Optionally enable a **draggable floating bar** in Settings.

**Share** always asks for confirmation - it is the only path that can leave your device.

---

## Input History

- **Undo / Redo** - `Ctrl+Z` / `Ctrl+Shift+Z`
- **Browse history** - Command palette → “Browse input history”
- **Export history** - Download undo stack as JSON

---

## Keyboard Shortcuts

The workspace is keyboard-first. Press **`?`** (or **`⌘/` / `Ctrl+/`**) any time to open the full shortcuts reference - or click the **`?` icon in the bottom status bar**.

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Command palette |
| `⌘⇧P` / `Ctrl+Shift+P` | Command palette (Mac; `⌘K` works everywhere) |
| `?` · `⌘/` / `Ctrl+/` | Keyboard shortcuts reference |
| `⌘↵` / `Ctrl+Enter` | Parse and transform |
| `⌘⇧B` / `Ctrl+Shift+B` | Beautify |
| `⌘⇧M` / `Ctrl+Shift+M` | Minify |
| `⌘⇧D` / `Ctrl+Shift+D` | Toggle Compare mode |
| `⌘⇧U` / `Ctrl+Shift+U` | Toggle Utils mode |
| `⌘⇧L` / `Ctrl+Shift+L` | Toggle live transform |
| `⌘⇧E` / `Ctrl+Shift+E` | Share workspace |
| `⌘1` – `⌘5` | Views: Raw · Tree · Graph · Query · Table |
| `⌘C` / `Ctrl+C` | Copy output (when focus isn't in an editor) |
| `⌘F` / `Ctrl+F` | Find in focused pane |
| `⌘⇧S` / `Ctrl+Shift+S` | Download output |
| `⌘+` / `⌘−` | Increase / decrease editor font size |
| `⌘0` | Reset editor font size |
| `⌥1` / `⌥2` | Focus input / output pane |
| `⌥Z` / `Alt+Z` | Toggle line wrap |
| `⌥M` / `Alt+M` | Maximize / restore output pane |
| `⌥T` / `Alt+T` | Toggle theme (light / dark / system) |
| `⌥N` / `Alt+N` · `⌥W` / `Alt+W` | New / close tab |
| `⌥↑` / `Alt+↑` · `⌥↓` / `Alt+↓` | Step through input history |
| `⌘Z` / `Ctrl+Z` | Undo input |
| `⌘⇧Z` · `⌘Y` / `Ctrl+Y` | Redo input |
| `⌘V` / `Ctrl+V` | Paste from clipboard (empty input) |
| `ESC` | Close palette / dialogs / panels |

---

## Toolbar & Pinning

Default chrome uses **compact menus** (Format · View · Actions · Types). Uncheck “Compact menus” in Settings to pin favorites on the toolbar. Pins persist in `localStorage`.

---

## Large files

- **~400KB+**: tree shows a caution; graph warns about performance
- **~2MB+**: tree/graph disabled; live transform auto-off - use Raw + Query

---

## Privacy & Local-First

formaty runs in your browser. **Your data stays on screen** unless you click Share and confirm. Session prefs (theme, pins, menus) use `localStorage`. Shared links can be disabled from the status bar.
