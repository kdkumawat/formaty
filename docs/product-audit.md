# FORMATY — COMPLETE PRODUCT AUDIT

*Research-only audit. No code was modified. Every claim below was verified against the actual source (`src/`, `public/`, `package.json`, configs). Status markers: ✅ IMPLEMENTED · 🟡 PARTIALLY IMPLEMENTED · ❌ NOT IMPLEMENTED · ❓ UNKNOWN.*

---

## 1. Executive Summary

Formaty (v2.0.1) is a **static, local-first, single-page developer workspace** — not a collection of separate tools. All routes render the same `<WorkspaceContent>` component (`src/components/WorkspaceContent.tsx`, ~5,100 lines) inside three "tools" that share one chrome:

1. **Transform** — left input → right output: format/validate/convert/query/types/views.
2. **Compare** — Document diff (Monaco line-diff) or List/Set compare with SQL exports.
3. **Utils** — 18 standalone developer utilities (UUID, Base64, JWT, hash, etc.).

Everything is processed client-side in a **single Web Worker** (`src/workers/json.worker.ts`) and persisted to **localStorage** (`formaty-session`). The site is a Next.js 16 static export with a cache-first service worker, so it works offline after first visit.

**Strongest capabilities:** the five-format conversion engine (JSON/XML/YAML/TOML/CSV ↔ everything), multi-language type generation (12 targets incl. SQL DDL+seed), JSON graph visualization, list compare with SQL IN/VALUES export, and a genuinely deep keyboard layer + command palette.

**Biggest product gaps:** list comparison is powerful but has **no standalone SEO page**; there is **no diff export that users can paste back**; the JSON **search engine exists in the worker but has zero UI** (dead code); the cURL tool is a thin fetch wrapper (no environments, variables, response headers display, or auth beyond Basic); and the JSON→SQL generator is the strongest hidden differentiator that is barely marketed.

**Notable claims vs. reality:** "your data never leaves the browser" is true for transform/compare/utils but has four documented exceptions (Share, cURL execution, feedback, GitHub star badge), and the app's own docs and UI text admit this ("Share is the only action that can leave your device").

---

## 2. Tech Stack

| Layer | Choice | Purpose |
|---|---|---|
| Framework | **Next.js 16.3.0** (App Router, `output: "export"`, Turbopack) | Static site generation; all 40+ pages pre-rendered to `out/` |
| Language | **TypeScript 5.9** (strict) + React 19.2.8 | App code; JSX server+client components |
| Build | `next build` → static export; `eslint`; Turbopack | CI build (`bun run build`) |
| Package manager | **Bun** (`bun.lock`) | Install/dev/scripts |
| UI framework | **shadcn/ui on Radix UI** (checkbox, dialog, dropdown-menu, label, popover, select, separator, slot, switch, tooltip) + hand-rolled `workspace/*` components | All dialogs/menus/inputs |
| Icons | **@heroicons/react** (workspace), **lucide-react** (landing; also installed in package.json) | Iconography |
| Styling | **Tailwind CSS v4** + CSS-variable theming (`--workspace-*`, `--primary` etc., injected inline pre-hydration) | Theme system (dark/light/system) |
| Animation | **framer-motion** | Command palette, dialogs, landing |
| Editor | **@monaco-editor/react** (+ monaco via peer) | Input/output editors, JSON diff editor, query result |
| CSV | **papaparse** | CSV → JSON parsing (header mode) |
| YAML | **js-yaml** | YAML parse/dump |
| TOML | **@iarna/toml** | TOML parse/stringify (dates → ISO strings) |
| XML | **fast-xml-parser** | XML parse (attributes `@_` prefixed) + XML build |
| Query | **jsonpath-plus**, **jmespath** | JSONPath & JMESPath evaluation |
| Schema | **ajv** | JSON Schema validation (in worker, `allErrors`) |
| Graph | **jsoncrack-react** | Interactive JSON graph (zoom/pan/layout/search) |
| Image export | **html2canvas** | Graph PNG/JPG fallback renderer |
| Share encoding | **lz-string** | URL-hash state compression |
| **Web Worker** | `src/workers/json.worker.ts` | All parse/transform/schema/type/convert/validate off the main thread |
| WASM | — | ❌ None |
| State mgmt | React `useState`/context; **zustand installed but unused** | Local component state only |
| Storage | **localStorage** (`formaty-session`, `formaty-query-history`, `formaty-output-action-visibility`, `formaty-ga-consent`, `formaty-gh-stars`, `formaty-onboarded`); **sessionStorage** (admin token) | Session persistence, prefs |
| Database | ❌ None (static export). Optional external **Cloudflare Worker** (`FORMATY_API_URL`, e.g. `api.formaty.pages.dev`) | Playground share-link persistence + feedback inbox (D1-backed, per `src/lib/feedback.ts` comment) |
| Analytics | **GA4** via gtag, consent-gated (`NEXT_PUBLIC_GA_MEASUREMENT_ID`), `anonymize_ip` | Page views + events (copy/share/convert/theme) |
| Error tracking | ❌ None | — |
| Hosting | Static export → **Cloudflare Pages** (`SITE_URL=https://formaty.pages.dev` in `.env.example`); canonical defaults to `formaty.dev` | Deployment |
| PWA/Offline | `src/app/manifest.ts` + `public/sw.js` (cache-first, `formaty-v1`), `ServiceWorkerRegister.tsx` (prod only) | Installable, offline after first visit |
| Browser APIs | Web Workers, `localStorage`/`sessionStorage`, Clipboard API (`writeText`, `ClipboardItem`), Web Crypto (`crypto.subtle.digest`, `randomUUID`, `getRandomValues`), `fetch`, Fullscreen API, `matchMedia`, `Blob`+`URL.createObjectURL`, `btoa/atob`, `TextEncoder/TextDecoder` | Everything above |

**Dead/underused dependencies (verified unused in `src/`):** `zustand`, `reactflow` — installed, never imported. `searchJson` (JSON search engine, incl. key/value/type/jsonpath modes + a worker `search` action) is implemented but **never invoked from any component** — dead code with real product value.

---

## 3. Complete Feature Inventory

### 3.1 Format engine (Transform tool) — `WorkspaceContent.tsx`, `src/lib/formats/*`, `src/lib/json/core.ts`, worker

**Format detection** (`src/lib/formats/detect.ts`): auto-detects JSON, XML, YAML, TOML, CSV, cURL by first characters/regex. ✅ Manual input-format override in status bar. ✅

**JSON (src/lib/json/core.ts)**
- Formatting/beautify with indent 0–12, single- or double-quote style, recursive key sort ✅
- Minify ✅
- Loose-JSON acceptance: single quotes, trailing commas (custom tokenizer `normalizeLooseJson`) ✅
- Flatten to dot-notation (`a.b.c`) ✅ / Unflatten ✅
- Recursive key sort ✅; Recursive array sort ✅; Deep remove-empty ✅; Deep array dedup (by `JSON.stringify` identity) ✅
- JSON Schema inference (`inferJsonSchema` — types, required, array items) ✅
- Validate data against a pasted JSON **or YAML** schema via AJV (modal) ✅
- Type generation → **12 targets** (below) ✅
- JSONPath/JMESPath querying ✅ (Query view)
- Tree / Table / Graph / Raw views ✅
- JSON search (key/value/type/jsonpath) — 🟡 engine only, **no UI**

**XML (`xmlParser.ts`)**: parse (attributes → `@_key`, auto-unwraps single root), format/beautify, minify, convert to/from everything via shared JSON model. ✅

**YAML (`yamlParser.ts`)**: parse (`js-yaml.load`), dump with indent control, minify (collapses blank lines). ✅

**TOML (`tomlParser.ts`)**: parse (dates → ISO strings), stringify (arrays wrapped as `{ data }`), minify. ✅

**CSV (`csvParser.ts`)**: parse via Papa Parse (header mode, skipEmptyLines, strings kept), stringify via `toCsv` (all cells double-quoted, configurable delimiter). ✅

**cURL (`src/lib/curl/parseCurl.ts`)**: detect, parse (`-X/--request`, `-H/--header`, `-d/--data/--data-raw/--data-ascii`, `-u/--user` → Basic auth, `-G/--get`, URLs, multiline `\` continuations), **execute via `fetch`**, auto Content-Type for JSON bodies. ✅ (details in §10)

### 3.2 Transform actions (`OPERATION_ACTIONS` + palette)
Beautify · Minify · Flatten · Unflatten · Sort keys · Sort array items · Remove empty · Deduplicate arrays · Generate JSON Schema · Validate against Schema · Generate Types (12 langs) · Convert (5 formats × directions). ✅ All run in the worker, live-debounced.

### 3.3 Compare tool (`JsonDiffEditor.tsx`, `ListComparePanel.tsx`, `src/lib/json/diff.ts`, `src/lib/json/listCompare.ts`)
- **Document diff**: Monaco side-by-side or inline line diff; left/right editable; swap; beautify sides; clear; ignore-whitespace toggle; structural path diff (added/removed/changed with `$.a.b[0]` paths, 2,000-row cap); line-hunk stats (added/removed/modified); change navigation (prev/next); filter by change type; export report JSON; copy left/right/paths/report. ✅
- **List compare**: full set algebra below (§5). ✅

### 3.4 Utils tool — 18 tools (`UtilsPanel.tsx`, `src/lib/utils/devtools.ts`)

| # | Tool | Capabilities |
|---|---|---|
| 1 | UUID | v4/v1/v7/v5 (SHA-1 namespace+name), NIL, batch 1–50 with per-card copy, v5 name input, append/trim on count change |
| 2 | Base64 | encode/decode, Unicode-safe, **bidirectional editing** (edit encoded → decodes) |
| 3 | JWT | decode header/payload/signature, raw/tree view, signature truncated preview |
| 4 | Hash | SHA-256 / SHA-1 hex via WebCrypto |
| 5 | Password | length 4–128, char-set toggles, batch 1–50, entropy strength meter |
| 6 | URL Encode | percent-encode/decode (plus-sign handling), bidirectional |
| 7 | Case | camel/Pascal/snake/kebab/CONSTANT/slug/title/upper/lower/reverse/trim; camel-splitter |
| 8 | Regex | live match list with index, groups, flags; per-match copy |
| 9 | Escape | JSON string escape/unescape, bidirectional |
| 10 | HTML | HTML entity encode/decode (DOM-based decode), bidirectional |
| 11 | Time | unix s/ms ↔ ISO, auto-detect, live "now" |
| 12 | Hex | text ↔ hex, `0x`/whitespace tolerant, bidirectional |
| 13 | Number | dec/hex/bin/oct with `0x`/`0b`/`0o` prefixes |
| 14 | URL Parse | protocol/user/pass/host/port/path/query params/hash |
| 15 | Color | HEX 3/6/8, rgb(), hsl(), CMYK output, CSS color names (offscreen probe), preview swatch |
| 16 | Cron | 5/6-field explainer to plain English (steps, ranges, weekday names) |
| 17 | Lorem | words/sentences/paragraphs + random alnum/hex/numeric lines |
| 18 | Text Stats | lines/words/chars/chars-no-space/bytes |

All util I/O is **per-tool, per-tab state**, persisted in the session.

### 3.5 Views (Raw / Tree / Graph / Query / Table)
Covered in §10/§12/§13.

### 3.6 Workspace features
Multi-tab (new/close/rename, per-tab full snapshots, T/C/U letter badges) ✅ · input history (undo stack, ⌥↑/↓ stepping, persisted) ✅ · command palette (grouped, searchable, recents) ✅ · settings panel (pinning, diff prefs, output-action visibility, format options) ✅ · pinned toolbar (menu-first chrome, star pins) ✅ · live transform toggle ✅ · first-run hint/toasts ✅ · maximize output pane + fullscreen ✅ · sample data per format + GitHub/Stripe/K8s/OpenAPI examples ✅ · **auto-format on paste** ✅ · split-input mode (two inputs, ratio slider) 🟡.

---

## 4. JSON Capability Matrix

| Capability | Input | Output | UI location | Modifies data? | Local | Offline | Practical max | Library | Shortcut | Export | Share |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Format/Beautify | JSON/XML/YAML/TOML/CSV text | formatted text | Transform toolbar | No (new output) | ✅ worker | ✅ | ~2 MB (live auto-off >2 MB) | core.js + worker | ⌘⇧B | Copy/Download | via link |
| Minify | any format text | minified | toolbar | No | ✅ | ✅ | same | core.js | ⌘⇧M | Copy/Download | via link |
| Validate (syntax) | text | valid/invalid + error | status bar (live) | No | ✅ | ✅ | live | parse in worker | — | — | — |
| Validate vs Schema | data + schema | valid + errors JSON | modal | No | ✅ (AJV in worker) | ✅ | schema-size bound | ajv | — | copy output | — |
| Flatten | JSON | dot-notation object | toolbar | No | ✅ | ✅ | worker | core.js | — | Copy/Download | via link |
| Unflatten | dot-notation | nested JSON | toolbar | No | ✅ | ✅ | worker | core.js | — | Copy/Download | — |
| Sort keys | JSON | key-sorted JSON | palette/beautify opt | No | ✅ | ✅ | worker | core.js | — | Copy | — |
| Sort array items | JSON | arrays sorted | palette | No | ✅ | ✅ | worker | core.js | — | Copy | — |
| Remove empty | JSON | cleaned | beautify opt/palette | No | ✅ | ✅ | worker | core.js | — | Copy | — |
| Dedup arrays | JSON | deduped | palette | No | ✅ | ✅ | worker | core.js | — | Copy | — |
| JSON Schema gen | JSON | JSON Schema | toolbar | No | ✅ | ✅ | worker | core.js | — | Copy/Download | via link |
| Validate gen'd schema | schema | AJV result | modal | No | ✅ | ✅ | worker | ajv | — | — | — |
| Types (12 langs) | JSON | code | Types menu | No | ✅ | ✅ | worker | core.js | — | Copy/Download | via link |
| JSON→YAML/XML/CSV/TOML | JSON | target text | Convert menu | No | ✅ | ✅ | worker | yaml/fxp/core | — | Copy/Download | via link |
| Tree view | parsed | expandable tree | ⌘2 | No | ✅ | ✅ | 200-child preview cap | custom | ⌘2 | copy path/value | — |
| Graph view | parsed | interactive graph | ⌘3 | No | ✅ | ✅ | `maxRenderableNodes=1200` | jsoncrack-react | ⌘3 | PNG/JPG/SVG/JSON | — |
| Query (JSONPath/JMESPath) | parsed + query | result JSON | ⌘4 | No | ✅ | ✅ | data-size bound | jsonpath-plus/jmespath | ⌘4 | Copy/Download (query result) | via link |
| Table view | array-of-objects | sortable/filterable table | ⌘5 | No | ✅ | ✅ | DOM-bound (no virtualization) | custom | ⌘5 | — (via raw) | — |
| Search (key/value/type/jsonpath) | parsed | matches | **no UI** | No | ✅ | ✅ | 5,000 cap | core.js | — | — | — |
| cURL import | curl cmd | response JSON | input format | No (fetches) | **network needed** | ❌ offline | response-bound | fetch | — | Copy/Download | via link |

*Every capability above is main-thread-free (worker), and none of them modify the user's input (output is a new pane; "Use as input" is explicit).*

---

## 5. List Capabilities (arbitrary lists/collections)

**Where:** Compare tool → List mode (`ListComparePanel.tsx`, `src/lib/json/listCompare.ts`).

**Parsing input** — delimiter auto-detect (newline / comma / semicolon / pipe / whitespace / **JSON array** incl. object fallback), manual delimiter override; trim; ignore-empty; **case-insensitive matching**; **strip outer quotes** (`' " \``); **numeric normalization** (`"01"`≡`1` when both parse as numbers). ✅

| Capability | Status | Notes |
|---|---|---|
| Compare two lists | ✅ | left vs right panes |
| Common / intersection | ✅ | `common` bucket |
| Only in left | ✅ | `leftOnly` bucket |
| Only in right | ✅ | `rightOnly` bucket |
| Union | ✅ | `union` bucket |
| Symmetric difference | ✅ | `symmetric` bucket |
| Duplicate detection | ✅ | `leftDupes`/`rightDupes` buckets (shown when >0) |
| Duplicate counts | ✅ | `count` per item, frequency sort |
| Sorting | ✅ | none/asc/desc/numeric-asc/numeric-desc/frequency on **result**, left, and right panes (snapshot-restore on unsort) |
| Deduplication | 🟡 | implicit via set keys (dupes only reported, not removed from a *single* list; a standalone "dedupe one list" action is not exposed) |
| Case sensitivity | ✅ | toggle (`caseInsensitive`) |
| Whitespace normalization | ✅ | `trim` |
| Empty-line handling | ✅ | `ignoreEmpty` |
| Order preservation | ✅ | first-seen order; sorts optional |
| Numeric vs string comparison | ✅ | numeric sort + numeric key normalization |
| CSV column comparison | ❌ | CSV rows parse as a single-token-per-line only (no column picker) |
| JSON array comparison | ✅ | auto-detected JSON arrays |
| ID comparison | ✅ | any token incl. UUIDs, ints, strings |
| Set operations | ✅ | full bucket algebra above |
| **Copy as comma-separated** | ✅ | `comma`, `comma-space` |
| **Copy as newline-separated** | ✅ | `newline`, `raw` |
| **Copy as JSON array** | ✅ | `json-array`, `json-array-numbers` |
| **Copy as SQL IN clause** | ✅ | single/double/unquoted + `NOT IN` + column name |
| Additional exports | ✅ | `sql-values`, `pipe`, `tsv`, `csv-quoted`, `yaml-list`, `regex-alt`, `js-array-single/double`, `python-list` |
| Swap sides | ✅ | swap button |
| Paste into pane | ✅ | clipboard read button |
| Download | ✅ | via shared OutputActionBar (`formaty-list-<bucket>.txt`) |

**Explicitly NOT IMPLEMENTED:** multi-column CSV comparison, CSV-column selector, SQL `VALUES` with column mapping, one-list-only dedupe/sort tool (sort exists only inside compare; `sortListText` is list-compare-scoped), list of objects/records comparison, "only in A but also count" weighting (multiset ≠ set semantics — counts are tracked but buckets use set membership).

---

## 6. Database Debugging Use Cases

Developer pastes `SELECT id FROM table_a` output (left) and `SELECT id FROM table_b` output (right):

| Workflow step | Status | How |
|---|---|---|
| Compare record IDs | ✅ | paste both, `common` bucket |
| Find missing records (in A not B) | ✅ | `leftOnly` bucket |
| Find extra records (in B not A) | ✅ | `rightOnly` bucket |
| Find common records | ✅ | `common` bucket |
| Find duplicate IDs | ✅ | `leftDupes`/`rightDupes` buckets |
| Generate SQL IN clause | ✅ | `SQL IN ('…')` + column name + copy button |
| Generate SQL NOT IN clause | ✅ | `NOT` checkbox |
| Generate SQL VALUES | ✅ | `sql-values` export (`('a'),\n('b')`) |
| Export missing IDs | ✅ | copy/download `leftOnly`/`rightOnly` as any export format |
| Preserve IDs exactly | ✅ | string tokens kept verbatim (numeric normalize is opt-in) |
| Compare UUIDs | ✅ | strings; case-insensitive toggle available |
| Compare integers | ✅ | string or numeric-normalize mode |
| Compare strings | ✅ | with case/quote options |
| Compare database exports | ✅ | newline/CSV/JSON arrays auto-detected |
| Compare CSV query results | 🟡 | only as line/JSON tokens — **no column-aware comparison** |

**Smallest missing-capability set to make this genuinely excellent (not implemented):**
1. **Column-aware CSV/SQL export parsing** (pick the ID column; ignore header row automatically) — the single highest-value gap.
2. **One-click "copy all differences" SQL NOT IN for missing IDs** (currently two clicks: bucket → SQL → copy).
3. **COUNT-weighted exports** (dedupe counts, "IDs appearing N times").
4. **Preserve paste header-strip option** (first line = header for CSV exports).
5. A **standalone SEO page** for this workflow (`/compare-lists`, `/sql-in-clause-generator`).

---

## 7. API / cURL Capabilities

**Implementation:** `src/lib/curl/parseCurl.ts` + input-format `curl` in `detect.ts`; cURL is an **input format**, not a full API client.

| Capability | Status | Details |
|---|---|---|
| Parse cURL | ✅ | flags: `-X/--request`, `-H/--header`, `-d/--data/--data-raw/--data-ascii`, `-u/--user` (Basic b64), `-G/--get`, URLs, backslash-newline continuation |
| Detect method | ✅ | `-X`, else GET, auto-POST on body |
| Detect URL | ✅ | first `http(s)://` arg |
| Detect headers | ✅ | into fetch `headers` |
| Detect body | ✅ | string body; auto `Content-Type: application/json` if JSON-looking |
| Execute requests | ✅ | browser `fetch` (same-origin policy applies — **CORS-bound**) |
| Display status | 🟡 | non-OK → error `HTTP <status>: <body slice>`; success status not displayed |
| Display response headers | ❌ | not surfaced |
| Display response body | ✅ | body text → auto-format pipeline |
| Format response | ✅ | detected JSON/XML/… formatted in output pane |
| Query response | ✅ | chain into Query view |
| Diff response | 🟡 | manual (copy response, use Compare) |
| Save request | 🟡 | persisted in session/tabs only; no request library |
| Repeat request | ✅ | re-run via input; response cached per input (`curlCacheRef`) |
| Modify request | ✅ | edit the curl text |
| Add authentication | 🟡 | Basic only via `-u`; **no Bearer/API-key field** |
| Use variables / environments | ❌ | none |
| Export request | 🟡 | copy curl text |
| Share request | ✅ | share encodes curl text (hash/API) |
| Handle CORS | ❌ | no proxy; cross-origin requests fail in browser |
| Handle large responses | 🟡 | no cap, but no streaming; formatted on main thread after fetch (worker parse) |

**Limitations:** no proxy → most real-world APIs are blocked by CORS in-browser; no response headers/status display; no timeout handling; no streaming.

---

## 8. Diff / Comparison

**Two modes** (Compare tool):

1. **Document diff** — Monaco line diff. Text-based at the line level; for JSON inputs additionally **structural path diff** (`diffJson`/`summarizeDiff` walks objects by key, arrays by index; reports `added`/`removed`/`changed` with paths, capped at 2,000 rows). Order-sensitive (array index-based), key-aware for objects. 🟡 Comparison is structural only when **both sides parse as JSON**; otherwise plaintext line diff. `ignoreTrimWhitespace` option. **No order-insensitive/set-based document diff.**
2. **List compare** — set-based, order-insensitive, key-aware via normalization options (case, numeric, quotes, trim). ✅

**What users can compare:** JSON documents ✅, plain text ✅, lists ✅, CSV (as tokens only) 🟡, XML/YAML/TOML — only as plaintext lines 🟡 (no structural XML/YAML diff).

**Missing:** JSON array order-insensitive diff (e.g. reordered rows), XML/YAML structural diff, diff of CSV rows as records, unified-diff text export, inline merge.

---

## 9. Querying / Extraction

| Capability | Status | Behavior |
|---|---|---|
| JSONPath | ✅ | `jsonpath-plus`, `resultType: "value"`; live re-run; sample chips (`$`, `$..*`, `$..[0]`, `$..name`) |
| JMESPath | ✅ | `jmespath.search`; samples (`@`, `keys(@)`, `values(@)`) |
| Search/filter (document-wide) | 🟡 | Table view row search + column filter; **JSON key/value/type search engine (`searchJson`) is dead code with no UI** |
| Extract (path-based) | ✅ | JSONPath/JMESPath results shown as formatted JSON |
| Flatten/nested extraction | ✅ | Flatten action + JSONPath |
| Array filtering | ✅ | JSONPath `?(@…)` / JMESPath `?…` |
| Copy path | ✅ | Tree view per-node "copy path" (`$.a.b[0]`) |
| Copy JSONPath | ✅ | same as above (paths are JSONPath syntax) |
| Query result export | ✅ | result lifted to toolbar: copy/download (`formaty-query-result.json`)/share |
| Query history | ✅ | last 12 queries in localStorage (`formaty-query-history`) |

---

## 10. Visualization

| View | Input | Interactions | Zoom | Search | Expand/collapse | Copy | Export | Node selection | Large-data behavior |
|---|---|---|---|---|---|---|---|---|---|
| **Raw** | any text | Monaco editing, find (⌘F), line nav | font zoom ⌘± | Monaco find | folding | Copy/Download | file | cursor pos | live-transform auto-off >2 MB |
| **Tree** (`TreeView.tsx`) | parsed JSON | per-node expand; click key=copy path; click value=copy value; hover copy buttons; expand/collapse all | — | **no search box** | ✅ | path/value per node | — | click-to-copy | 200-child preview + "Show all"; "Large file – expand carefully" |
| **Graph** (`GraphView.tsx`) | parsed JSON | pan, zoom (JSONCrack), layout rotate (DOWN/RIGHT/UP/LEFT), focus root, fit, grid toggle | ✅ | node-text search w/ highlight + match count | collapsible nodes | PNG/JPG/SVG clipboard | PNG/JPG download, SVG copy, JSON copy | node focus | `maxRenderableNodes=1200` (silent cap) |
| **Query** | parsed JSON + query | live re-run, lang switch, samples, history | — | query box | — | result copy/download | file | — | worker-independent, main-thread JSONPath (can jank on huge docs) |
| **Table** (`TableView.tsx`) | array-of-objects (falls back: single object → 1 row; primitives → index/value) | sort (numeric-aware), row filter, column show/hide, **nested drill-down breadcrumbs** | — | row search | nested cells open as new tables | per-cell tooltip only | — | — | **no virtualization** (DOM-bound); headers sticky |

---

## 11. Code Generation

**Input:** parsed JSON. **Targets (`TYPE_LANGUAGES`):**

| Target | Output | Notes |
|---|---|---|
| TypeScript | `export interface …` | rootName, nested interfaces, arrays, quoted keys |
| Zod | `z.object(...)` schemas + inferred types | nested schemas emitted before parents |
| Java | public classes, public fields | `List<T>`, `double` |
| C# | classes w/ properties, PascalCase, `List<T>` | `using System.Collections.Generic` |
| Python | dataclasses | `list[...]` |
| Pydantic | `BaseModel` classes | `Optional`, `Any` |
| Go | structs + `json:"..."` tags, PascalCase fields | `float64`, `[]T` |
| Protobuf | `message` + `repeated`, field numbers | proto3 |
| Kotlin | data classes | `List<T>`, `Double` |
| Swift | `struct …: Codable` | `[T]` |
| Rust | `#[derive(Serialize, Deserialize)]` structs | `Vec<T>`, serde import |
| **SQL** | **CREATE TABLE (with FKs, id INTEGER PK) + INSERT seed rows** | nested objects → FK columns; arrays → child tables; primitive arrays → JSON TEXT column; snake_case identifiers; escaped values |

**Qualities:** null → `null`/`None`/`Any?`/`object?` etc. per language; arrays typed from first element (`unknown[]` when empty); no naming-collision handling beyond suffixing (`Type`, `Type2`); optional/nullable inference is **not** present (only explicit `null` literals map to optional-ish types); **no configuration UI** beyond language picker (root name fixed to `JsonData`, no PascalCase option toggle, no "export interface vs type" choice).

**Obvious missing high-value targets:** Dart/Flutter, PHP, Ruby, Elixir/Ecto, GraphQL SDL, OpenAPI 3, PostgreSQL-specific DDL (only generic SQL), Avro/Parquet schema, JSON Schema as a type target (exists separately as "Generate JSON Schema").

---

## 12. Conversion Matrix (every input → every output)

All conversions go through a shared JSON model: parse(input fmt) → stringify(target fmt).

```text
JSON   → YAML ✅  → XML ✅  → CSV ✅ (delimiter option)  → TOML ✅  → Types(12) ✅  → Schema ✅  → SQL ✅(via types)
XML    → JSON ✅  → YAML ✅  → TOML ✅  → CSV ✅ (round-trip via JSON)   → Types ✅
YAML   → JSON ✅  → XML ✅  → TOML ✅  → CSV ✅                           → Types ✅
TOML   → JSON ✅  → XML ✅  → YAML ✅  → CSV ✅                           → Types ✅
CSV    → JSON ✅ (Papa, header mode)  → XML ✅  → YAML ✅  → TOML ✅      → Types ✅
cURL   → (execute) → any of the above ✅
```

**Missing/obvious additions (not implemented):** JSON↔JSON path/query pipelines, CSV→CSV delimiter/quote reformat, XML→XML minify already exists (part of format options), **URL-encoded form data ↔ JSON**, **base64 ↔ file**, **Markdown table ↔ CSV**, **INI ↔ TOML/YAML**, **properties files ↔ YAML**, **SQL INSERT ↔ CSV**. All of these are "easy" (pure string/object transforms on the existing model). "Significant work": XML↔JSON with attribute fidelity options, schema-aware conversions, streaming conversions for huge files.

---

## 13. Workspace / Persistence / State (audited very carefully)

**Storage:** single `localStorage` key `formaty-session` (debounced/effect-based writes in `WorkspaceContent.tsx` ~line 1680) + per-feature keys: `formaty-query-history`, `formaty-output-action-visibility`, `formaty-ga-consent`, `formaty-gh-stars`, `formaty-onboarded`. Admin token in `sessionStorage`.

| State | Survives refresh | Survives tab close/restart | Stored where |
|---|---|---|---|
| Input text | ✅ | ✅ (localStorage, same origin) | `formaty-session` |
| Output text | ✅ | ✅ | `formaty-session` |
| Active tool (Transform/Compare/Utils) | ✅ | ✅ | `activeOperation` |
| Diff left/right + diff prefs | ✅ | ✅ | per-tab snapshot |
| Utils tab + per-tool I/O | ✅ | ✅ | `utilTab`, `utilsByTool` snapshot |
| View (raw/tree/graph/query/table) | ✅ | ✅ | `rightView` |
| Format options (indent/quote/sort/removeEmpty) | ✅ | ✅ | `formatOptions` |
| Theme (system/light/dark) | ✅ | ✅ | `themeMode` (also read by inline layout script pre-hydration) |
| Type language | ✅ | ✅ | `typeLanguage` |
| Editor font size, line wrap, live transform | ✅ | ✅ | session (lineWrap is NOT persisted — 🟡 reset on reload) |
| Panel split % | ✅ | ✅ | `split` |
| Tabs (open tabs, active tab, renames, per-tab snapshots) | ✅ | ✅ | `tabs`, `tabSnapshots` |
| Pinned toolbar items | ✅ | ✅ | `pinnedItems` |
| Output-action visibility | ✅ | ✅ | `formaty-output-action-visibility` |
| Query history | ✅ | ✅ | `formaty-query-history` |
| **Scroll position** | ❌ | ❌ | not persisted |
| **Cursor position in editor** | ❌ | ❌ | not persisted |
| **First-run hint dismissal** | ✅ | ✅ | `formaty-onboarded` |
| Shared-link state (when viewing a link) | 🟡 | deliberately not persisted (shared view is transient; `isViewingSharedRef` skips writes) | — |

**Unexpected losses:** line-wrap preference resets on reload; scroll/cursor positions reset; the "shared" session is never persisted locally (by design); `undoStack` trimmed to 20 entries on persist. On a fresh tool preset (`?tool=`), the *previous* session is replaced rather than merged.

---

## 14. Keyboard / Power-User UX

**Shortcuts** (`src/lib/shortcuts.ts` + handler in `WorkspaceContent.tsx`, rendered per-platform ⌘ vs Ctrl):

- Global: `⌘K`/`⌘⇧P` palette · `⌘/` `?` shortcuts overlay · `⌘↵` parse/transform · `⌘⇧E` share · `⌥N`/`⌥W` new/close tab · `Esc` close
- Transform: `⌘⇧B` beautify · `⌘⇧M` minify · `⌘⇧D` compare · `⌘⇧U` utils · `⌘⇧L` live transform
- Views: `⌘1`–`⌘5` raw/tree/graph/query/table
- Editing: `⌘C` copy output · `⌘Z`/`⌘⇧Z`/`⌘Y` undo/redo (routed to diff panes in Compare) · `⌥↑/⌥↓` input history · `⌘V` paste-into-empty · `⌘F` find · `⌘⇧S` download
- Focus/zoom: `⌥1`/`⌥2` focus panes · `⌥Z` line wrap · `⌥M` maximize · `⌥T` theme · `⌘+/⌘−/⌘0` font size

**Command palette:** grouped (Recent/Workspace/Utils/Actions/Convert/View/Types/Samples/Settings/Theme), fuzzy text match, keyboard navigation, recents tracked. ✅

**Context/right-click:** Monaco native context menu in editors (copy/paste/find); **no custom right-click menu**. Drag/drop: **none** (no file drag-in). Copy shortcuts: `⌘C` + per-format "Copy as…" dropdown (base64/escaped/URI/data-URI/quotes/comma/JSON array/newline/SQL IN). Download: `⌘⇧S`, format-aware extension; graph PNG/JPG.

**Missing shortcuts that would materially help:** jump-to-diff-change while focused (only buttons), toggle compare mode list/document, cycle view with a single key, "re-run query", go-to-tab `⌘1..9`, find-in-tree, Ctrl+Enter in diff panes.

---

## 15. Sharing

**Two mechanisms** (`shareWorkspace` in `WorkspaceContent.tsx`; `savePlayground`/`encodeState`):

1. **API mode** (when `FORMATY_API_URL` set): POST `/playground` → server returns id → URL `/playground?id=<id>`; re-share PUTs to same id; `deletePlayground` exists for deletion. Load path handles `not_found`/`rate_limit`/`error`.
2. **Hash mode** (default, no API): `#j:<encodeURIComponent(JSON)>` for ≤100 KB, else `#e:<lz-string compressed>` — **state is encoded in the URL**.

| Aspect | Behavior |
|---|---|
| What is encoded | input, output, convertToFormat, liveTransform, outputFormat/Language, typeLanguage, viewMode, activeOperation, split, diff inputs/kind, utilTab; **all tabs** when "Share all tabs" |
| Where data is stored | server (API) or URL hash (no storage) |
| Does data leave browser | ✅ yes — explicitly, on Share (API POST or link contains raw data) |
| URL format | `/playground?id=…` or `/playground#j:…`/`#e:…` |
| Max payload | hash: 100 KB uncompressed threshold → compressed; API: server-side limit (unknown) |
| State preserved | ✅ input/output/options |
| View preserved | ✅ `viewMode` |
| Queries preserved | 🟡 query *text* is not in `WorkspaceState` (only `viewMode:"query"`); result not preserved |
| Theme preserved | ❌ not part of `WorkspaceState` |
| Tool selection preserved | ✅ `activeOperation` |
| Permanent? | ✅ API mode persists until deleted; hash links are permanent URLs but only as long as the link exists |
| Links expire/revocable | 🟡 API: `deletePlayground` exists but no UI to delete a shared link; no expiry |
| Sensitive data accidentally shared | ⚠️ **yes possible** — Share button copies a link containing the full input/output; UI warns ("Share is the only action that can leave your device"), and the Share dialog is confirm-gated, but there is no scrub/expiry |

---

## 16. Privacy / Security Audit

**Requests made (network traffic):**
1. GA4 gtag (`googletagmanager.com`) — **only if** `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set **and** user accepts consent (`formaty-ga-consent=accepted`); `anonymize_ip: true`; consent defaults to denied. ✅
2. GitHub API `api.github.com/repos/kdkumawat/formaty` (star badge, 1 h cache) — landing page only; no user data. ✅
3. cURL execution via `fetch` — **only when the user pastes a curl command and runs it**; sends the user's headers/body to the target host. ✅ (documented)
4. Share API POST/PUT/DELETE to `FORMATY_API_URL` — **only on explicit Share**; contains full input/output. ✅ (documented)
5. Feedback POST to `FORMATY_API_URL/feedback` — only when submitted; includes message + optional email + `page` + `browser` UA; honeypot field. ✅
6. Google Fonts via `next/font/google` — fetched at build; at runtime fonts are self-hosted by Next (no runtime request). ✅

**Storage:** localStorage (session, query history, visibility, consent, star cache, onboarding), sessionStorage (admin token). **No cookies** set by the app itself (GA sets analytics cookies only after consent). **No IndexedDB.**

**"Your data never leaves your browser" — accuracy check:**
- Transform/format/convert/validate/query/type-gen/diff/list-compare/utils/views: ✅ **TRUE** (worker-local).
- cURL: ❌ **FALSE** — requests are executed from the browser to the target URL (this is the feature's purpose; disclosed).
- Share: ❌ **FALSE** — link may be API-persisted or embedded in a URL; disclosed ("Share is the only action that can leave your device — use it on purpose").
- Feedback: ❌ FALSE — message/email sent when submitted; disclosed.
- GitHub star badge: sends repo name to api.github.com; not user data.
- Landing/SEO claims ("No uploads", "runs 100% locally") are technically accurate for the core tooling, with the above exceptions.

**Security notes:** share tokens are the API id (unauthenticated read); feedback admin uses a bearer token read from `?token=` then moved to sessionStorage and stripped from URL (good practice); `dangerouslySetInnerHTML` used only for JSON-LD and theme CSS (safe); HTML-decoding util uses a DOM textarea (safe); no eval of user input; regex tester uses `new RegExp` (user-controlled but sandboxed to the page); XML parser is `fast-xml-parser` (no DTD/XXE risk — JS parser); no CSP header is emitted in the static export (⚠️ worth noting).

---

## 17. Performance

**Workers:** ✅ all heavy work in `src/workers/json.worker.ts` (single shared worker via `useJsonWorker`). Main-thread work remaining: JSONPath/JMESPath query evaluation (`runQuery` — no worker), graph rendering (JSONCrack), table rendering (DOM), diff line-computation (Monaco), file-size `Blob` computations on every keystroke (`getSizeFormatted`, `new Blob([input]).size`).

**Large-payload handling:** soft cap 400 KB / hard cap 2 MB (`LARGE_INPUT_BYTES`/`HUGE_INPUT_BYTES`); live transform **auto-disables >2 MB** with a toast; tree caps at 200 children preview; graph caps at 1,200 renderable nodes; diff caps at 2,000 structural rows; search caps 5,000 matches.

**Known bottlenecks (not fixed, per instructions):**
- `Blob([input]).size` + `detectFormat` on every input change (main thread, O(n)).
- Live transform re-parses the whole doc on each keystroke (worker, but serializes full text each postMessage).
- Table view renders all rows (no virtualization) — large arrays will freeze the DOM.
- Graph view serializes the full JSON for search (`JSON.stringify(normalizedData).toLowerCase()` per keystroke) — O(n²)-ish on large docs.
- `formatDiffReport` slices 2,000-char previews; structural diff recursion is synchronous in the main thread (not worker) for the *stats* path.
- Query result formatting uses `formatJson` on main thread.
- Monaco loads regardless of active view (always mounted for output pane).

**Bundle:** `out/` is ~14 MB; largest JS chunk ~2.5 MB (Monaco), next ~1.4 MB (likely jsoncrack/reactflow graph stack + framer-motion). Heavy deps: `@monaco-editor/react`, `jsoncrack-react`, `framer-motion`, `html2canvas`. `zustand`/`reactflow` add weight only if bundled (unused). No route-level lazy split for Monaco/diff (both always present on playground).

---

## 18. SEO / Routing

**Routes** (all static, `output: "export"`, `dynamicParams = false`):

| Route | Purpose | Search intent | SEO quality |
|---|---|---|---|
| `/` | Marketing landing (15 sections, JSON-LD: ItemList, Breadcrumb, Organization) | brand + broad tool terms | Strong |
| `/playground` | Full workspace | "JSON playground", tool chain | Strong (meta+FAQ) |
| `/docs` | Searchable feature guide | "formaty guide" | Medium (single page) |
| `/changelog` | Versions | "formaty changelog" | Low intent |
| `/admin/feedback` | Feedback triage (robots disallowed) | — | Blocked from index |
| `/[tool]` × **18** | Tool landing pages (h1, description, examples, use cases, WebApplication + FAQPage JSON-LD, breadcrumbs, related tools, "Try" CTA → `?tool=` preset) | "json formatter", "json to yaml", etc. | Strong per-page |
| `/utils/[slug]` × **18** | Util landing pages (same template) | "uuid generator", "base64 encoder", "jwt decoder"… | Strong per-page |

**Metadata:** per-route title/description/keywords, canonical URLs (`SITE_URL` + path), OpenGraph (1200×630 og.png), Twitter summary_large_image, robots meta (index/follow), sitemap.xml (4 base + 18 tools + 18 utils), robots.txt (allows `/`, disallows `/admin`), manifest.webmanifest (PWA), theme-color, verification tags. ✅

**Missing high-value tool pages:** there are **18 format/JSON pages but zero pages for list-compare, SQL IN generator, JSON→SQL, JSON→Zod, cURL→fetch, JSON schema validator (input+upload), CSV column tools, base64→file, timestamp ranges, XML formatter alternatives, JSON-to-Python/Go pages** (type gen pages only exist for TS). The 12 type-generation targets have exactly one page (`/json-to-typescript`).

---

## 19. Competitive Capability Gaps

Based only on actual implementation, capabilities that make Formaty meaningfully stronger than a generic JSON formatter/viewer/toolbox/API client:

1. **JSON → SQL DDL+seed generator** (unique among browser tools; only one other major competitor does this) — *exists, under-marketed.*
2. **List compare with SQL IN/NOT IN/VALUES** — *exists, no dedicated page.*
3. **12-language type generation incl. Zod/Pydantic/Protobuf/SQL** — *exists.*
4. **Offline + session persistence + exact-state share links** — *exists, strong moat.*
5. **Multi-tab per-tool snapshots** — *exists, rare in this class.*
6. **JSON graph with image export** — *exists (but silently caps at 1,200 nodes).*
7. **Full keyboard layer + command palette** — *exists.*
8. **cURL→response chain** (fetch → format → query → types → share) — *exists but CORS-limited.*

**Gaps that would genuinely differentiate (fit existing architecture):**
- **Searchable JSON tree** (engine already built — wire `searchJson` into Tree view). Trivial, high value.
- **Schema validation with a file upload + "validate as you type"** (AJV already in worker).
- **CSV column-aware list compare** (papaparse already parses headers).
- **Base64/hex ↔ file + image preview** (workers + existing codecs).
- **JSON↔form-data/query-string** conversions (pure transforms).
- **Diff URL hash comparison** (`#left=`/`#right=`) — shareable diffs without an API.

---

## 20. "Magic Moment" Discovery

All verified against implementation:

1. **Two DB ID lists → compare → missing IDs → SQL NOT IN.** User pastes two `SELECT` results; gets `leftOnly` bucket + one-click `id NOT IN (...)` copy. Faster than manual diffing. (Compare→List)
2. **JSON → TypeScript → copy.** Paste API response, pick TS, `⌘⇧B`-class flow, copy. (Transform→Types)
3. **JSON → SQL schema + seed data.** Paste a JSON row(s), get CREATE TABLE + INSERTs with FKs — minutes of DDL work in one click. (Types→SQL)
4. **cURL → fetch → formatted response → JSONPath query → copy result.** Full API inspection without leaving the page. (cURL chain)
5. **Minified webhook JSON → ⌘⇧B beautify → ⌘1 tree to find a key → copy path.** Debugging loop in seconds. (Transform)
6. **Two JSON configs → Compare → structural path diff** showing `$.spec.template.spec…` changes with counts. (Compare→Document)
7. **JWT → decode → tree view of claims.** Paste token, read claims without base64 gymnastics. (Utils→JWT)
8. **UUID batch of 20 → paste into test fixtures.** Generate 5–50, click-to-copy each. (Utils→UUID)
9. **Stripe webhook JSON → generate Zod schema → copy** into a TS project for typed SDKs. (Types→Zod)
10. **Duplicate array values → "Remove duplicate items"** (recursive). (Transform)
11. **JSON → CSV for Excel.** Export API data to spreadsheet-ready CSV with delimiter control. (Transform→Convert)
12. **Share exact workspace with a teammate → they open link with same tabs.** Collaboration without accounts. (Share)

*Not supported (labeled):* diff-sharing via link (only API mode), CSV column compare, query text sharing, JSON search UI.

---

## 21. Viral / Shareable Capabilities

| What gets shared | Why | Recipient | What brings them back |
|---|---|---|---|
| **Graph PNG/JPG/SVG** of a JSON structure | docs, architecture diagrams, "look at this API shape" | teammates on Slack/X | the copy-as-image workflow |
| **JSON→SQL/DDL output** | paste-ready schema for a review | backend devs | type-gen menu, SQL target |
| **Generated TS/Zod types** | review type contracts | frontend devs | other 11 languages |
| **SQL IN/NOT IN clauses** from list compare | debugging ticket artifacts | data engineers | bucket copy formats |
| **Diff report JSON** | audit trail of config changes | reviewers | Compare tool reuse |
| **Shared workspace link** (exact tabs) | reproduce a bug/report | any dev | no-account, instant load |
| **Beautified/validated response** | debugging discussions | anyone | paste-and-format habit |
| **UUID/password batches** | seeding/fixtures | testers | click-to-copy cards |

---

## 22. SEO Opportunity Map (proposed standalone pages — NOT built)

| Page | User problem | Search intent | Existing capability | Missing capability | Difficulty | Viral | Dev relevance |
|---|---|---|---|---|---|---|---|
| `/compare-lists` | find diff between two ID lists | "compare two lists online" | ✅ list compare | column picker | Low | High | High |
| `/sql-in-clause-generator` | build `IN (...)` from values | "sql in clause generator" | ✅ export | page wrapper | Low | High | High |
| `/json-to-sql` | JSON→DDL+seeds | "json to sql" | ✅ type→SQL | page | Low | Med | Very high |
| `/json-to-zod` | runtime schema from JSON | "json to zod" | ✅ zod target | page | Low | Med | High |
| `/json-to-go` `/json-to-python` … | per-lang types | "json to go types" | ✅ all 12 | pages (only TS exists) | Low | Med | High |
| `/json-schema-validator` | validate data vs schema | "json schema validator" | ✅ AJV | upload UI | Low | Med | High |
| `/jsonpath-tester` | test JSONPath | exists already ✅ | ✅ | — | — | — | — |
| `/csv-column-compare` | compare CSV columns | "compare csv columns" | 🟡 token compare | column-aware compare | Med | High | Med |
| `/base64-to-image` | decode data URIs | "base64 to image" | 🟡 base64 codec | file/image UI | Low-Med | Med | Med |
| `/json-flattener` | flatten nested JSON | "flatten json" | ✅ flatten | page | Low | Med | Med |
| `/curl-to-fetch` | convert curl to code | "curl to fetch" | 🟡 parses curl | code emitter | Low | High | Very high |
| `/uuid-bulk-generator` | many UUIDs | "bulk uuid generator" | ✅ batch | page | Low | Med | Med |
| `/json-diff` | exists ✅ | — | ✅ | — | — | — | — |
| `/xml-to-json` etc. | exists ✅ | — | ✅ | — | — | — | — |

---

## 23. Feature Prioritization

**A. Already excellent (market heavily):** 5-format convert-all engine · 12-language type gen (esp. SQL + Zod) · list compare + SQL exports · graph visualization + image export · JSONPath/JMESPath query · cURL→response chain · offline + session persistence · share links · keyboard layer · 18 utils.

**B. Small improvements (big ROI, low effort):** wire `searchJson` into Tree view (search box) · add `/json-to-sql`, `/compare-lists`, `/sql-in-clause-generator` pages (pure content pages over existing features) · CSV column picker in list compare · persist line-wrap + scroll · response headers/status in cURL view · Bearer-token field · per-language type-gen pages · table virtualization for 5k+ rows · add JSON search/filter to Table view.

**C. Major opportunities (positioning-changing):** **JSON→SQL as the flagship differentiator** (own "json to sql online") · **shareable diffs & queries in hash** (query text + diff sides) · **cURL→code (fetch/axios/Python/Go) generator** (huge search traffic, trivial over existing parser) · **schema-first workflow** (paste schema → generate forms/types/fixtures/mock data) · **CSV column compare + reconciliation** (targets data engineers) · **workspace templates/recipes** ("compare DB exports" presets) · API-proxy mode for cURL to kill the CORS limitation.

Ranking (user value / frequency / search potential / differentiation / effort / shareability):
1. JSON→SQL pages (high/high/high/high/low/high)
2. Tree search UI (high/high/med/med/trivial/med)
3. cURL→code (high/med/very high/med/low/high)
4. List-compare SEO pages (high/high/very high/med/low/high)
5. CSV column compare (med/high/med/med/med/med)
6. Diff/query sharing (med/med/med/med/med/med)

---

## 24. Technical Debt

- **Dead code:** `searchJson` + worker `search` action (no caller); `zustand`, `reactflow` deps unused; `FEATURE_FLAGS` map unused (all flags hardcoded true, no reads).
- **Duplicated logic:** `formatCopyAsText` vs `formatListItems` overlap (quote/CSV/SQL formats implemented twice); `isStaleDiffOutput`/`cleanSessionOutput` heuristics to repair historical bad persists (signals prior migration debt); `EXT_BY_FORMAT`/`LANGUAGE_BY_TYPE_TARGET`/`TYPE_LANGUAGES` partially overlapping.
- **Overly coupled monolith:** `WorkspaceContent.tsx` ~5,100 lines holding all state + shortcuts + persistence + share + rendering; tab snapshotting manually mirrors ~30 state fields.
- **Fragile state:** per-tab snapshots stored in a `Map` ref and copied into localStorage on every change; restore-once effect keyed on `searchParams`; stale-diff-output scrubbing heuristics.
- **Hardcoded behavior:** `MAX_DIFF_ROWS=2000`, `maxRenderableNodes=1200`, 100 KB share threshold, `formaty-v1` cache, sample data strings, `SITE_URL` fallback `formaty.dev` vs `.env.example` `formaty.pages.dev` mismatch.
- **Missing tests:** ❌ zero test files in the repo; no unit tests for the parsing/type-gen/diff/list-compare engines (highest-risk surface).
- **Performance risks:** Blob sizing + detectFormat per keystroke; table without virtualization; graph JSON.stringify-per-search; full-document worker round-trips on every keystroke.
- **Accessibility:** dialogs use Radix (good); but tree/graph/table rely on custom interactive elements with limited ARIA; `?` shortcut hijacks typing only outside editable targets (fine); color contrast relies on CSS vars; keyboard nav in Table is minimal; the graph search label lacks aria-live.
- **Security:** no CSP header in static export; share API unauthenticated read; feedback token in sessionStorage (acceptable); no rate-limit client-side on share.
- **SEO:** 22 of 40+ capabilities lack dedicated pages; one sitemap priority tier; docs is a single page; no `/utils/*` JSON-LD FAQ duplication risk (FAQ JSON-LD repeated on all util pages with near-identical text).

---

## 25. Raw File / Component Map

| Area | Files |
|---|---|
| Workspace shell | `src/components/WorkspaceContent.tsx` (5.1k lines), `workspace/Header.tsx`, `workspace/StatusBar.tsx`, `workspace/OutputActionBar.tsx`, `workspace/EditorPanel.tsx`, `workspace/Dropdown.tsx`, `workspace/menuStyles.tsx`, `workspace/NumberStepper.tsx`, `workspace/PanelHeader.tsx` |
| Editors | `JsonEditor.tsx`, `JsonDiffEditor.tsx`, `lib/utils/monacoThemes.ts` |
| Views | `TreeView.tsx`, `TableView.tsx`, `GraphView.tsx`, `QueryView.tsx` |
| Compare | `ListComparePanel.tsx`, `lib/json/listCompare.ts`, `lib/json/diff.ts` |
| Utils | `UtilsPanel.tsx`, `lib/utils/devtools.ts` |
| Format engine | `lib/formats/*` (index/types/detect + 5 adapters), `lib/json/core.ts` (format/convert/types/schema/flatten/search) |
| Worker | `workers/json.worker.ts`, `hooks/useJsonWorker.ts` |
| cURL | `lib/curl/parseCurl.ts` |
| Share/API | `lib/shareState.ts` (lz-string hash), `lib/playgroundApi.ts` (server), `lib/feedback.ts` |
| UX | `CommandPalette.tsx`, `KeyboardShortcutsOverlay.tsx`, `lib/shortcuts.ts`, `Toast.tsx`, `FeedbackDialog.tsx`, `ConsentBanner.tsx`, `Analytics.tsx`, `ServiceWorkerRegister.tsx`, `GitHubStars.tsx`, `hooks/useTheme.ts`, `DocsThemeProvider.tsx` |
| SEO/routing | `app/[tool]/page.tsx`, `app/utils/[slug]/page.tsx`, `app/playground/page.tsx` + `layout.tsx`, `app/page.tsx`, `lib/seo.ts`, `lib/seoUtils.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, `app/layout.tsx`, `app/not-found.tsx`, `components/ToolPage.tsx` |
| Landing | `components/HomePage.tsx`, `components/landing/*` (15 sections) |
| Other pages | `app/docs/page.tsx` + `layout.tsx`, `app/changelog/page.tsx`, `app/admin/feedback/page.tsx` + `layout.tsx` |
| Infra | `public/sw.js`, `public/og.png/og.svg/icons`, `next.config.ts` (`output:"export"`, env, transpile jsoncrack), `package.json`, `bun.lock`, `docs/guide.md`, `docs/launch-checklist.md`, `scripts/gen-og.mjs` |

---

## 26. Recommended Product Direction (synthesis)

1. **Own "JSON → SQL"**: add `/json-to-sql`, `/sql-in-clause-generator`, `/compare-lists` pages now — zero new engine work, biggest SEO+differentiation win.
2. **Finish the built-but-hidden features**: wire `searchJson` into the tree (search box), add response headers/status to cURL, persist line-wrap.
3. **Curl→code generator** (fetch/axios/curl-export) — reuses the parser, huge long-tail search.
4. **Column-aware CSV compare** to win the data-reconciliation niche.
5. **Market the moat**: "offline, no signup, exact-state share links, 12-language types, SQL seeds" is a genuinely differentiated bundle vs generic formatters.

---

*Audit complete — no files were modified. Status markers: ✅ IMPLEMENTED · 🟡 PARTIALLY IMPLEMENTED · ❌ NOT IMPLEMENTED · ❓ UNKNOWN.*
