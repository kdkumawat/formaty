# FORMATY — PRODUCT EXPANSION REPORT

*Research and product-discovery task. The codebase was NOT modified. Baseline: the completed codebase audit (`docs/product-audit.md`) plus direct source inspection. Status markers used throughout: ✅ EXISTS · 🟡 PARTIAL · 🔧 EASY ADDITION · 🔨 MODERATE ADDITION · 🏗️ MAJOR ADDITION · 🚫 NOT RECOMMENDED.*

---

## 1. Executive Summary

Formaty is not a random collection of tools — it is already a coherent **local-first structured-data workspace**: five formats (JSON/XML/YAML/TOML/CSV) transform into each other and into 12 code/schema/SQL targets, a Compare tool does both line-diff and full list/set algebra with SQL exports, a cURL input chains into API debugging, and 18 utilities cover encoding/identity/time. Everything runs in a Web Worker, persists to localStorage, works offline, and shares exact state via links.

The expansion strategy that maximizes value without diluting identity is: **treat "data debugging & reconciliation" as the core product** — the workflows where developers currently open 3–5 different websites (list compare + SQL generation, JSON→SQL DDL, API response → types → schema → fixture, config diffing). The highest-ROI moves are almost all **content/SEO + small engine completions** on top of existing capabilities:

1. Turn **already-built engines into standalone search-driven pages** (JSON→SQL, compare-lists, SQL IN generator, JSON→Zod/Go/Python, curl-to-code) — near-zero engine work, huge search surface.
2. **Complete half-built capabilities**: wire the unused JSON search engine into Tree view, add response headers/status to cURL, CSV column selection in list compare.
3. **Add the few genuinely missing high-value engines**: cURL→code emitters, JSON→OpenAPI, schema→mock data, CSV column compare, Markdown-table/HTML-table/PostgreSQL-ARRAY exports, a SQL formatter, file drag-and-drop.
4. **Expose the engine outside the browser later**: browser extension (right-click JSON → Formaty) and a CLI (same pure-TS core), each with a clear workflow justification.

**Recommended product identity: "Developer Data Workspace"** — one place to format, convert, compare, reconcile, query, and generate code/schemas from any structured data you paste, with SQL and code as first-class outputs. Avoid the distraction traps (random unit converters, image tools, Postman clone, accounts/pricing).

---

## 2. Existing Product Baseline

Verified capabilities from the audit (full detail in `docs/product-audit.md`):

| Area | Exists today |
|---|---|
| Formats | JSON, XML, YAML, TOML, CSV — parse/format/minify/convert all directions; auto-detect + override; loose-JSON (single quotes, trailing commas) |
| JSON ops | beautify, minify, flatten, unflatten, sort keys, sort arrays, remove-empty, dedup arrays, schema inference, AJV validation (JSON/YAML schema) |
| Query | JSONPath (jsonpath-plus) + JMESPath with samples + history |
| Types | TypeScript, Zod, Java, C#, Python, Pydantic, Go, Protobuf, Kotlin, Swift, Rust, **SQL (CREATE TABLE + INSERT seed with FKs)** |
| Views | Raw (Monaco), Tree (copy path/value), Graph (JSONCrack, PNG/JPG/SVG export), Query, Table (sort/filter/columns/drill-down) |
| Compare | Document line-diff + structural JSON path diff (added/removed/changed, 2,000-row cap); List compare: common/leftOnly/rightOnly/union/symmetric/dupes buckets, sort, case/quote/numeric normalization, SQL IN/NOT IN/VALUES, JSON/JS/Python/YAML/CSV/TSV/regex exports |
| cURL | parse (-X/-H/-d/-u/-G), execute via fetch, format response, chain into query/types |
| Utils (18) | UUID v1/v4/v5/v7, Base64, JWT, SHA-1/256, password gen, URL encode, case converter, regex tester, JSON escape, HTML entities, unix time, hex, number bases, URL parser, color, cron explainer, lorem, text stats |
| Workspace | multi-tab with per-tab snapshots, input history, command palette, pinned toolbar, live transform, auto-format-on-paste, maximize/fullscreen, settings |
| Persistence | localStorage `formaty-session` (input/output/view/tool/tabs/options/theme); `formaty-query-history`, `formaty-output-action-visibility` |
| Sharing | API links (`FORMATY_API_URL`) or hash-encoded state (`#j:`/`#e:` lz-string), incl. all tabs |
| Privacy/offline | single Web Worker processing; cache-first service worker; consent-gated GA4; data leaves only via Share / cURL / feedback / GitHub badge |
| SEO | 18 tool pages + 18 util pages with metadata/JSON-LD/FAQ, sitemap, robots, PWA manifest |

**Known dead/partial code (important for expansion):** `searchJson` engine + worker `search` action exist but have **no UI** (🟡 PARTIAL — Tree view has no search box); `zustand`/`reactflow` installed unused; `FEATURE_FLAGS` unused; "Use as input" output action exists but is off by default; `formatDiffReport` produces a shareable JSON report but there is no shareable *diff link*.

---

## 3. Product Capability Graph

```
                    ┌────────────────────────── LOCAL INPUT ──────────────────────────┐
                    │  paste text · auto-detect · cURL input · (file drag-drop: MISSING) │
                    └──────────────────────────────┬───────────────────────────────────┘
                                                  ▼
                            ┌─────── PARSE LAYER (Web Worker) ───────┐
                            │ JSON · XML · YAML · TOML · CSV · cURL  │
                            └───────┬───────────────┬───────────────┘
                                    ▼               ▼
                     ┌── STRUCTURED MODEL (JsonValue) ──┐   ┌── RAW STRING ──┐
                     │  transform ops                   │   │ text ops       │
                     │  (sort/flatten/dedup/schema/     │   │ (case, regex,  │
                     │   types/query)                   │   │  stats, encode)│
                     └──┬──────────┬──────────┬─────────┘   └────────┬───────┘
                        ▼          ▼          ▼                     ▼
                 STRINGIFY     VIEWS      COMPARE              UTILS (18)
                 JSON·XML·    Raw·Tree·  doc-diff ·            UUID·B64·JWT·
                 YAML·TOML·   Graph·     list-compare          hash·URL·hex…
                 CSV·SQL·     Query·     (set algebra +        time·case·color·
                 Types(12)    Table      SQL exports)          cron·stats…
                        └──────────┬──────────┘
                                   ▼
              ┌────────────── OUTPUT / SHARE ──────────────┐
              │ copy · copy-as · download · share links    │
              │ (hash or API) · PNG/JPG/SVG image exports  │
              └────────────────────────────────────────────┘
```

**Expansion levers (all reuse this graph):** (a) new *stringify* targets (Markdown table, PostgreSQL ARRAY, curl-code…), (b) new *parse* inputs (files, env files, INI, SQL exports), (c) new *views* over the same model (searchable tree, pivot), (d) new *compare models* (CSV columns, order-insensitive JSON), (e) new *output channels* (embed, extension, CLI), (f) new *front doors* (SEO pages).

---

## 4. 50+ Existing Capability Combinations

Format per workflow: Problem / Input / Steps / Existing / Missing / Result / Target user / Frequency / Search potential / Shareability / Difficulty / Product value. Status markers refer to the *missing* capability.

### W01 — Database Record Reconciliation 🔧
- **Problem:** Backend engineer needs to know which rows exist in DB A but not DB B.
- **Input:** `SELECT id FROM table_a;` results and `SELECT id FROM table_b;` results (newline or CSV).
- **Steps:** paste both → List Compare → `leftOnly`/`rightOnly` buckets → copy/download.
- **Existing:** list compare, set buckets, SQL exports, per-side sort.
- **Missing:** CSV column selection; header-row detection (first line = header).
- **Result:** missing/extra ID lists in one click. **Target:** backend/data engineers. **Frequency:** very high (weekly+). **Search:** high ("compare two lists", "find missing records"). **Shareability:** medium (paste-into-ticket). **Difficulty:** 🔧 easy. **Value:** very high.

### W02 — Missing-Records → SQL NOT IN 🔧
- **Problem:** Generate `WHERE id NOT IN (...)` from A−B.
- **Input:** two ID lists.
- **Steps:** List Compare → `leftOnly` → `NOT` toggle → `SQL` copy button.
- **Existing:** bucket + `formatSqlInClause(notIn)` + column name input + copy.
- **Missing:** one-click "copy full NOT IN for missing IDs" (currently two clicks); quoting auto-choice.
- **Result:** ready SQL. **Difficulty:** 🔧 easy. **Value:** very high.

### W03 — Duplicate ID Detection Across a Dataset 🟡
- **Problem:** Find IDs that appear more than once in one export.
- **Input:** one list.
- **Steps:** paste same list both sides → `leftDupes` bucket (or frequency sort).
- **Existing:** dupe buckets, counts, frequency sort.
- **Missing:** a single-list mode ("dedupe one list" / "duplicate detector" UI without requiring left+right).
- **Result:** dupes with counts. **Difficulty:** 🔧 easy. **Value:** high.

### W04 — Cross-System Reconciliation (DB vs API IDs) 🟡
- **Problem:** Compare DB rows against IDs returned by an API.
- **Input:** DB export + API JSON (or cURL response).
- **Steps:** cURL/JSON → JSONPath extract `$.users[*].id` → copy → List Compare with DB IDs.
- **Existing:** cURL execution, JSONPath extraction, list compare.
- **Missing:** "Send query result to List Compare" one-click (extract → compare); JSONPath → list export.
- **Result:** reconciled diff. **Difficulty:** 🔧 easy. **Value:** very high.

### W05 — Environment Comparison (prod vs staging) ✅
- **Problem:** Compare config/response snapshots between environments.
- **Input:** two JSON/CSV exports.
- **Steps:** Compare → document or list mode.
- **Existing:** full document diff + list compare + report export.
- **Missing:** named snapshot storage ("save snapshot A, load snapshot B").
- **Result:** structural diff. **Difficulty:** 🟡 partial. **Value:** high.

### W06 — UUID List Comparison (case variants) ✅
- **Input:** two UUID lists. **Existing:** case-insensitive toggle, quote strip, numeric normalize. **Missing:** none. **Result:** case-safe set diff. **Value:** high.

### W07 — Integer ID Comparison ✅
- **Input:** integer lists with mixed formats ("01" vs "1"). **Existing:** `numericNormalize`. **Result:** exact numeric set diff. **Value:** medium-high.

### W08 — Log-ID Extraction → Compare 🔨
- **Problem:** Pull IDs out of log lines, then compare against known-good list.
- **Input:** log text + reference list.
- **Steps:** regex tester → extract IDs (copy matches) → List Compare.
- **Existing:** regex tester with per-match copy, list compare.
- **Missing:** "copy all matches as list" bulk action (per-match copy only today).
- **Result:** reconciled IDs from logs. **Difficulty:** 🔧 easy. **Value:** high.

### W09 — CSV Export Reconciliation 🔨
- **Problem:** Two CSV exports from different systems need row-level reconciliation.
- **Input:** CSV A, CSV B.
- **Steps:** paste → List Compare (line tokens today).
- **Existing:** CSV parse via Papa (header mode) only in Transform, not in Compare.
- **Missing:** column-aware compare in List Compare (pick key column, header detection).
- **Result:** row-level diff by key. **Difficulty:** 🔨 moderate. **Value:** very high.

### W10 — CSV → JSON → SQL Seed 🔨
- **Problem:** Turn a CSV export into INSERT statements.
- **Input:** CSV file.
- **Steps:** CSV → JSON (convert) → Types → SQL.
- **Existing:** all three engines.
- **Missing:** SQL INSERT generation from arbitrary CSV columns with explicit type inference (today SQL comes from JSON typing of one object; arrays of mixed rows partially handled).
- **Result:** seed SQL. **Difficulty:** 🔨 moderate. **Value:** very high.

### W11 — API Response → JSON Schema → Validate Next Payload ✅
- **Input:** sample response + future payload. **Existing:** schema inference, AJV validation modal. **Missing:** none critical. **Value:** high.

### W12 — Webhook Before/After Diff ✅
- **Input:** two webhook payloads. **Existing:** document diff with structural paths. **Missing:** none. **Value:** high.

### W13 — DB Dump → Table → Filter/Sort ✅
- **Input:** JSON/CSV dump. **Existing:** Table view (sort, filter, columns, drill-down). **Missing:** pagination/virtualization for large dumps. **Value:** medium.

### W14 — SQL Results → CSV → Excel ✅
- **Input:** CSV/JSON query results. **Existing:** CSV stringify with delimiter control. **Missing:** none. **Value:** medium.

### W15 — cURL → Execute → Format Response ✅
- **Input:** curl command. **Existing:** parse+execute+format chain. **Missing:** response status/headers display. **Value:** high.

### W16 — API Response → TypeScript Types ✅
- **Input:** response JSON. **Existing:** 12 targets. **Missing:** none. **Value:** very high.

### W17 — API Response → SQL Fixture 🟡
- **Input:** response JSON. **Existing:** JSON→SQL. **Missing:** fixture file export (INSERTs with explicit table name). **Value:** very high.

### W18 — Response Diff Pre/Post Deploy ✅
- **Input:** two snapshots. **Existing:** document diff + report export. **Missing:** snapshot save/load. **Value:** high.

### W19 — Response → JSONPath → IDs → List → SQL ✅
- **Input:** response + ID column. **Existing:** full chain works manually. **Missing:** one-click piping between Query result and List Compare. **Value:** very high.

### W20 — Webhook → Zod Schema ✅
- **Input:** webhook payload. **Existing:** Zod target. **Missing:** none. **Value:** high.

### W21 — API Error → Format → Share ✅
- **Input:** error JSON. **Existing:** beautify + share link. **Missing:** none. **Value:** medium.

### W22 — cURL → Code (fetch/axios/Python/Go) 🏗️
- **Problem:** Convert a curl command into code in another language.
- **Input:** curl command. **Existing:** curl parser produces method/headers/body/url.
- **Missing:** code emitters (fetch, axios, python-requests, Go, Node).
- **Result:** copy-ready code. **Difficulty:** 🏗️ major (multiple emitters) — one emitter (fetch) is 🔧 easy. **Value:** very high.

### W23 — Minified JSON → Beautify → Tree → Copy Path ✅
- **Input:** minified payload. **Existing:** beautify, tree, path copy. **Value:** high.

### W24 — JSON → YAML → Kubernetes Manifest ✅
- **Input:** JSON config. **Existing:** JSON→YAML; YAML→JSON round-trip. **Missing:** none. **Value:** medium-high.

### W25 — JSON → CSV → Excel ✅
- **Input:** JSON array. **Existing:** JSON→CSV with delimiter. **Missing:** none. **Value:** high.

### W26 — Nested JSON → Flatten → CSV 🔧
- **Problem:** Export nested API data to a flat spreadsheet.
- **Input:** nested JSON. **Existing:** flatten (dot notation) + JSON→CSV. **Missing:** a combined "flatten then export" flow is manual (two steps) — a preset would be 🔧 easy. **Value:** high.

### W27 — Flattened CSV → Unflatten → JSON ✅
- **Input:** dot-key CSV/JSON. **Existing:** unflatten. **Value:** medium.

### W28 — JSON → Types → SQL Chain ✅
- **Input:** JSON. **Existing:** generateTypes(typescript) then generateTypes(sql) — actually single SQL action exists. **Value:** very high.

### W29 — JSON Array → Table → Sort/Filter → CSV 🔨
- **Input:** array of objects. **Existing:** table sort/filter, CSV export from raw. **Missing:** "export table as CSV" directly from Table view (uses raw output today). **Value:** medium-high.

### W30 — JSON → Graph → PNG → Docs ✅
- **Input:** JSON structure. **Existing:** graph + PNG/JPG/SVG export. **Missing:** none. **Value:** high (shareable artifact).

### W31 — Query → Extract → List Compare → SQL ✅
- **Input:** response. **Existing:** full manual chain. **Missing:** piping. **Value:** very high.

### W32 — Deduplicate Array Values ✅
- **Input:** JSON with duplicate array entries. **Existing:** `dedup` action (recursive). **Value:** medium.

### W33 — List → SQL IN Clause ✅
- **Input:** any list. **Existing:** sql-in-single/double/unquoted + column. **Value:** very high.

### W34 — List → SQL VALUES/INSERT 🔨
- **Input:** list. **Existing:** `sql-values` rows export. **Missing:** full `INSERT INTO t (col) VALUES …` statement (today only VALUES rows). **Value:** high.

### W35 — List → JS/Python/Go Arrays ✅
- **Input:** list. **Existing:** js-array-single/double, python-list. **Missing:** Go slice literal. **Value:** medium.

### W36 — List → Regex Alternation ✅
- **Input:** list. **Existing:** `regex-alt` with escaping. **Value:** medium.

### W37 — List → PostgreSQL ARRAY 🔧
- **Input:** list. **Existing:** pipe/comma exports. **Missing:** `ARRAY['a','b']` literal. **Value:** medium.

### W38 — List Sort / Dedupe / Normalize 🟡
- **Input:** one list. **Existing:** sorting inside compare only. **Missing:** single-list tool. **Value:** high.

### W39 — Frequency Analysis of a List ✅
- **Input:** one list. **Existing:** frequency sort + counts. **Missing:** single-list UI. **Value:** medium.

### W40 — Two CSV Columns → Compare 🔨
- **Input:** CSV with two columns of IDs. **Existing:** Papa CSV parse (Transform). **Missing:** column-pair compare UI. **Value:** high.

### W41 — Document Diff with Structural Paths ✅
- **Input:** two JSON docs. **Existing:** line diff + path diff + stats + navigation. **Value:** high.

### W42 — Config/Env File Diff ✅
- **Input:** two config/env texts. **Existing:** plaintext line diff. **Value:** medium.

### W43 — Schema Diff (JSON Schema A vs B) 🏗️
- **Input:** two schemas. **Existing:** none (schemas compare as JSON docs only). **Missing:** schema-aware diff (property-level additions/removals/type changes). **Value:** high for contract teams.

### W44 — Generated Code Diff ✅
- **Input:** two versions of generated TS/Go. **Existing:** plaintext diff. **Value:** medium.

### W45 — CSV Row Compare (by key) 🔨
- **Input:** two CSVs with a key column. **Missing:** record-aware compare. **Value:** high.

### W46 — JSON Array Order-Insensitive Compare 🏗️
- **Input:** two JSON arrays. **Missing:** set-based array diff (by element identity). **Value:** high.

### W47 — Schema → Mock Data 🏗️
- **Input:** JSON Schema (or JSON). **Existing:** schema inference only. **Missing:** mock generator (deterministic fakes). **Value:** high.

### W48 — Schema → TypeScript 🔨
- **Input:** JSON Schema. **Existing:** JSON→TS, but schema-as-input is not supported. **Missing:** schema→type compiler. **Value:** high.

### W49 — JSON → OpenAPI 🏗️
- **Input:** JSON sample. **Existing:** none. **Missing:** OpenAPI document generator. **Value:** very high (contract workflow).

### W50 — Types → Test Fixtures 🔨
- **Input:** JSON. **Existing:** types. **Missing:** fixture/mock generator. **Value:** medium.

### W51 — JWT → Decode → Tree → Copy Claims ✅
- **Input:** token. **Existing:** decode + tree view. **Value:** high.

### W52 — UUID Batch → Fixtures ✅
- **Input:** count. **Existing:** batch + per-card copy + copy-as list. **Value:** medium.

### W53 — Hash → Compare Checksums ✅
- **Input:** text. **Existing:** SHA-256/1. **Value:** medium.

### W54 — Base64 → Decode → Format ✅
- **Input:** b64. **Existing:** decode + bidirectional edit. **Value:** medium.

### W55 — Text Stats → Slug → Filename ✅
- **Input:** text. **Existing:** stats + case/slug converter. **Value:** low-medium.

### W56 — Timestamp → ISO → JWT Expiry Check ✅
- **Input:** unix/ISO. **Existing:** time converter + JWT decoder. **Value:** medium.

---

## 5. Database / Data Debugging Opportunities

**Already possible (✅):** record reconciliation, missing/extra records, common records, duplicate IDs, SQL IN/NOT IN/VALUES, export missing IDs, exact ID preservation, UUID/int/string comparison, newline/CSV/JSON-array exports, DB export comparison.

**High-value gaps (with status):**

| Workflow | Status | Minimal capability needed |
|---|---|---|
| CSV/SQL result column picker | 🔨 | In List Compare: parse with Papa header mode, choose key column, strip header |
| One-list duplicate detector / dedupe | 🔧 | Single-list mode in Compare (same engine) |
| ID extraction from logs/blobs | 🔧 | "Copy all regex matches as list" in regex tester |
| INSERT statement generator | 🔨 | Wrap `sql-values` into `INSERT INTO <t> (col) VALUES …` |
| PostgreSQL ARRAY / ANY() export | 🔧 | New export format |
| Table-name + schema-aware SQL export | 🔨 | SQL generator options (table name, dialect, quote style) |
| Snapshot save/load (A/B store) | 🔨 | Named localStorage snapshots per tab ("save this side") |
| Multiset (count-weighted) reconciliation | 🟡 | Buckets by multiset semantics (exists partially: counts tracked) |
| Row-level CSV reconcile | 🔨 | Record compare by key column |
| Foreign-key walk from JSON | ✅ (JSON→SQL emits FKs) | Present; extend to "show relationship graph" (graph view already renders it) |
| Duplicate detection on JSON array of objects | 🟡 | dedup uses JSON.stringify identity — fine; add "by key field" option |

**Best DB-debugging message:** "paste two result sets → get missing/extra IDs → copy SQL" — the single most distinctive Formaty workflow and the clearest SEO/differentiation opportunity.

---

## 6. API Debugging Opportunities

Full chain: `cURL → Request → Response → Format → Inspect → Query → Diff → Types → Schema → SQL → Share`.

| Opportunity | Status | Rank | Notes |
|---|---|---|---|
| Response status + headers display | 🔨 | 1 | Highest-value cURL gap; headers/status are trivial to capture from `fetch` (currently only body) |
| cURL → fetch/axios/Python/Go code | 🏗️ (fetch 🔧) | 2 | Parser already yields method/headers/body/url; emitters are pure string templates |
| "Open response in Compare" (snapshot A/B) | 🔨 | 3 | Reuses diff; add snapshot buttons |
| Response → types → SQL → fixture | 🔧 | 4 | Chain exists; add "fixture" wrapper + table name |
| Request history | 🔨 | 5 | Reuse per-tab persistence; store recent curl commands (like query history) |
| Environments / variables | 🏗️ | 6 | Only justified if API tool becomes a pillar; defer |
| Bearer-token/auth field | 🔧 | 7 | Simple UI around `-H "Authorization: Bearer …"` |
| Response → JSON Schema | ✅ | 8 | Exists |
| Mock response generator | 🏗️ | 9 | Ties to schema→mock |
| CORS proxy | 🏗️ | 10 | Conflicts with local-first privacy positioning — **mark as strategic decision, not default** |
| Response size/rate caps | 🟡 | 11 | Add soft cap + status |

**Recommended sequencing:** headers/status (🔨) → fetch-code emitter (🔧) → request history (🔨) → auth field (🔧). Defer environments/proxy.

---

## 7. JSON Workflows

JSON is the natural hub (everything parses to `JsonValue`). Ranked workflows:

1. **JSON → SQL DDL + seed** ✅ — flagship; needs SEO pages, table-name/dialect options (🔧).
2. **JSON → TypeScript/Zod → validation layer** ✅ — exists; add "copy import statement" nicety (🔧).
3. **JSON → Schema → validate loop** ✅ — exists; add file upload + live error list (🔧).
4. **JSON → YAML → k8s/CI config** ✅ — exists.
5. **JSON → CSV → spreadsheet** ✅ — exists.
6. **JSON → OpenAPI contract** 🏗️ — missing; high value.
7. **JSON → Graph → image** ✅ — exists.
8. **JSON → flatten → CSV/table** 🔧 — compose existing ops into a preset.
9. **JSON query → extract → downstream** ✅ — add piping.
10. **JSON array → table → filter/sort → export** 🔧 — add table→CSV export.
11. **JSON search (key/value/type)** 🔧 — **wire existing `searchJson` into Tree view** (top easy win).
12. **JSON → TOML/pyproject/Cargo** ✅ — exists.
13. **Schema → mock/fixture data** 🏗️ — missing; high value for tests.
14. **JSON normalization pipeline** (sort keys → remove empty → dedup) ✅ — exists via actions.

---

## 8. List / Set Workflows (30+)

**Core set ops (✅ exist):**
L01 intersection · L02 left/right difference · L03 symmetric difference · L04 union · L05 duplicate detection · L06 duplicate counts/frequency · L07 asc/desc sort · L08 numeric sort · L09 numeric normalization · L10 case-insensitive compare · L11 whitespace trim · L12 quote stripping · L13 JSON-array input · L14 CSV-token input.

**Exports (✅ exist):** L15 SQL IN (single) · L16 SQL IN (double) · L17 SQL NOT IN · L18 SQL VALUES rows · L19 JSON array (strings) · L20 JSON array (numbers) · L21 newline/raw · L22 comma/comma-space · L23 pipe · L24 TSV · L25 CSV quoted · L26 YAML list · L27 regex alternation · L28 JS array (single/double) · L29 Python list.

**Worth adding (with status):**
- L30 **Single-list tool** (sort/dedupe/normalize one list without left+right) 🔧
- L31 **Go slice literal** export 🔧
- L32 **PostgreSQL `ARRAY['a','b']`** export 🔧
- L33 **Full INSERT statement** export 🔨
- L34 **SQL IN chunking** (split 5,000 IDs into 1,000-item `IN` batches) 🔨
- L35 **`WHERE id = ANY(ARRAY[...])`** export 🔧
- L36 **Markdown bullet/table** export 🔧
- L37 **Shell/CLI argument list** (space-joined, escaped) 🔧
- L38 **pip / npm / apt install list** 🔧
- L39 **.gitignore / allowlist patterns** 🔧
- L40 **CSV column extraction** (one column of a CSV → list) 🔨
- L41 **JSON array-of-objects key extraction** (`[{id:1},{id:2}] → 1,2`) 🔧
- L42 **Multiset weighted compare** (counts on both sides) 🔨
- L43 **URL query-param export** (`?id=1&id=2`) 🔧
- L44 **Escaped-string export for SQL literal** 🔧

---

## 9. Comparison as a Product Category

| Comparison type | Current model | Status | Ideal model |
|---|---|---|---|
| JSON vs JSON | line diff + structural path diff (by key, arrays by index) | ✅ | **order-sensitive** structural; add **order-insensitive** option (by element identity) 🏗️ |
| text vs text | line diff | ✅ | line diff (correct) |
| list vs list | set-based, order-insensitive, normalized keys | ✅ | **multiset** option 🟡 |
| CSV vs CSV | line tokens only | 🟡 | **row-aware, column-aware** by key column 🔨 |
| CSV columns | — | ❌ | column-pair compare 🔨 |
| JSON arrays | index-based | 🟡 | element-identity (order-insensitive) 🏗️ |
| API responses | document diff | ✅ | + snapshot A/B 🔨 |
| database exports | list compare | ✅ | + column picker 🔨 |
| XML / YAML / TOML | plaintext line diff | 🟡 | structural (parse→JSON→diff) 🔨 — **cheap win** since parse exists |
| config/env files | plaintext diff | ✅ | + key-aware diff for `.env`/INI 🔨 |
| schemas | JSON doc diff | 🟡 | **schema-aware diff** (property add/remove/type change) 🏗️ |
| generated code | plaintext diff | ✅ | correct as-is |

**Recommendation:** "Compare" is already a pillar (document + list). Completing XML/YAML structural diff (🔨) and CSV column compare (🔨) makes it a credible standalone category with strong SEO ("compare two yaml files", "csv diff online").

---

## 10. File / Data Input Opportunities

| Input | Status | Value | Privacy | Difficulty | UX impact |
|---|---|---|---|---|---|
| Drag-and-drop file (JSON/CSV/YAML/XML/TXT) → input pane | 🚫 today | very high | ✅ local (FileReader) | 🔧 easy | high |
| File picker button (same) | 🚫 | high | ✅ local | 🔧 easy | high |
| Multiple files (multi-tab ingestion) | 🚫 | medium | ✅ local | 🔨 | medium |
| Compare two files directly (file → left, file → right) | 🚫 | very high | ✅ local | 🔨 | high |
| Clipboard file paste (Ctrl+V of file) | 🚫 | medium | ✅ local | 🔨 | medium |
| Folder ingestion (batch) | 🚫 | low | ✅ local | 🏗️ | low |
| SQL result files (`.sql`/`.tsv`) | 🚫 | high (DB pillar) | ✅ local | 🔨 | medium |
| .env / INI / properties files | 🚫 | medium | ✅ local | 🔧 | medium |
| URL fetch input (paste a JSON URL) | 🚫 | medium | ⚠️ network (like cURL) | 🔧 | medium |
| Binary (image → base64 preview) | 🚫 | low-medium | ✅ local | 🔨 | low |

**Privacy framing:** all file ingestion stays 100% local (FileReader/Web Worker) — reinforces the local-first positioning. **Top priority: drag-and-drop + compare-two-files.**

---

## 11. Code Generation Opportunities

**Existing (✅):** TS, Zod, Java, C#, Python, Pydantic, Go, Protobuf, Kotlin, Swift, Rust, SQL(DDL+seed).

**Ranked workflows (not just languages):**

1. **JSON → SQL DDL → seed data** ✅ → make flagship: table name, dialect (SQLite/Postgres/MySQL), singular/plural naming, nullable detection 🔨. Highest differentiation.
2. **JSON → Zod → runtime validation layer** ✅ → add "copy as module" (imports + schemas + types) 🔧.
3. **JSON → OpenAPI → API docs** 🏗️ — new generator (paths from JSON example + schema); pairs with schema pillar.
4. **JSON → Pydantic → FastAPI models** ✅ → fine as-is.
5. **JSON → Go structs → JSON tags** ✅ → exists.
6. **JSON → Protobuf message** ✅ → exists.
7. **JSON → GraphQL SDL** 🏗️ — new; medium value.
8. **JSON → Dart/PHP/Ruby** 🏗️ — new; low-medium value (long tail) — **defer** (see §23).
9. **Schema → TypeScript** 🔨 — new direction (schema as *input*).
10. **Schema → mock/fixture data** 🏗️ — high value for tests; ties to DB fixture workflow.

**Per-language SEO pages:** only `/json-to-typescript` exists today; `/json-to-go`, `/json-to-python`, `/json-to-zod`, `/json-to-sql` etc. are content-only additions over existing engines (🔧 each).

---

## 12. Schema / Contract Workflows

**Current state:** JSON → JSON Schema ✅; validate data against JSON/YAML schema ✅; JSON → Zod/Pydantic/Protobuf (schema-like outputs) ✅; **no schema-as-input** (except validation modal).

**"Schema/contract workspace" minimal coherent feature set (ranked):**
1. Schema → mock/fixture data generator 🏗️ (biggest gap; turns schema into a usable contract)
2. Schema → TypeScript (and other languages) 🔨 (reuse type emitter against a schema)
3. Schema-aware diff (property-level) 🏗️ (W43)
4. JSON Schema validation with file upload + inline error list 🔧
5. Schema → OpenAPI component 🏗️ (pairs with OpenAPI generator)
6. Schema round-trip: data → schema → data (validation loop) 🔨

**Verdict:** a full schema workspace is a **Tier 3 strategic bet**; schema→mock and schema→TS are the two highest-value pieces to build first. Formaty can credibly become a "lightweight contract workbench" without a full spec editor.

---

## 13. Transformation Pipelines (20+)

**Current architecture:** supports **manual chaining** (copy output → paste input; "Use as input" button exists but hidden by default). No pipeline UI.

**Pipelines that work today (✅, manually):**
P01 JSON → flatten → CSV → table view
P02 API → JSONPath → extract IDs → list compare → SQL IN
P03 JSON → schema → validate next payload
P04 JSON → types → SQL
P05 JSON → YAML → k8s manifest
P06 Webhook A/B → diff → report
P07 cURL → response → beautify → query → copy
P08 CSV → JSON → types
P09 JSON → graph → PNG
P10 Log → regex → matches → list → compare

**Pipelines requiring small additions (🔧/🔨):**
P11 List A/B → NOT IN → copy (one-click, W02)
P12 Response → headers/status → snapshot → diff (🔨)
P13 JSON array → dedupe → sort → CSV (preset 🔧)
P14 Flatten → filter (JSONPath) → CSV (preset 🔨)
P15 Schema → mock → validate (🏗️)
P16 CSV → key-column compare → SQL (🔨)
P17 XML → JSON → types (✅ manual)
P18 YAML → JSON → schema → validate (✅ manual)
P19 IDs → IN → query DB → new export → re-compare (repeatable loop; snapshots 🔨)
P20 .env → JSON → env parity check (🔨)

**Pipeline UI verdict:** a **visual pipeline builder is NOT justified** now — it would duplicate the manual chain and add complexity. The right primitives: (a) **presets/recipes** ("Flatten to CSV", "Response → Types") via command palette, (b) **one-click piping** (Query result → List Compare; Output → Use as input made visible), (c) optional saved recipes later. **Command-palette composition + presets is the right level.**

---

## 14. Copy / Export Opportunities

**Existing:** base64, escaped, URI, data-URI, quotes (single/double), comma variants, JSON array, newline, SQL IN (single/double/unquoted), SQL VALUES, TSV, CSV-quoted, YAML list, regex alternation, JS arrays, Python list, raw; graph PNG/JPG/SVG/JSON; downloads per format.

**Highest-value additions (ranked):**
1. **Markdown table** export (from Table view / CSV / JSON array) 🔧 — docs/README artifact, very shareable.
2. **HTML table** export 🔧 — paste into email/docs/Notion.
3. **Full SQL INSERT** statement 🔨.
4. **PostgreSQL `ARRAY[...]` / `ANY(...)`** 🔧.
5. **Go slice** literal 🔧.
6. **Shell/CLI argument** list (escaped) 🔧.
7. **URL query params** (`?id=1&id=2`) 🔧.
8. **IN chunking** for large lists 🔨.
9. **Minified/compact JSON copy** from any view 🔧.
10. **Copy as JSON with numeric coercion** ✅ (exists for lists; extend to CSV→JSON).

---

## 15. Developer Utility Opportunities

Only utilities that connect to the core data workspace (not random tools):

| Proposed utility | Connects to | Status |
|---|---|---|
| **SQL formatter/beautifier** | SQL is already a Formaty output; formatting is trivial reuse of the parser | 🔧 high value |
| **.env / INI parser & converter** (.env ↔ YAML/JSON) | conversion hub; config diffing pillar | 🔨 |
| **HTTP status codes / headers reference** | cURL/API pillar | 🔧 low effort, real search traffic |
| **JSON Pointer (`/a/b/0`) tester** | JSONPath complement | 🔧 |
| **X.509 certificate decoder** | JWT-adjacent (auth debugging) | 🔨 |
| **Epoch/ISO range converter + timezone** | time util exists; extend | 🔧 |
| **Gitignore / allowlist pattern validator** | list pillar | 🔧 |
| **Kubernetes manifest checker** | YAML pillar | 🔨 |
| **Docker Compose / Dockerfile helper** | YAML pillar | 🔨 (defer) |
| **Base64 ↔ image/file preview** | encoding pillar | 🔨 |
| **UUID v6/v8** | UUID util | 🔧 |
| **HTML/CSS entity table** | html encoder | 🔧 |
| **QR code / unit converters / currency / random color palettes** | none | 🚫 NOT RECOMMENDED |

---

## 16. "I Have This Data" — Action Matrix

### JSON (array/object/scalar)
→ beautify · minify · validate · tree · graph (PNG) · table · query (JSONPath/JMESPath) · flatten/unflatten · sort keys · dedupe arrays · remove empty · schema (gen/validate) · types (12) · SQL (DDL+seed) · YAML · XML · TOML · CSV · diff (2 copies) · share · download · **search (missing UI)** · **mock/fixtures (missing)** · **OpenAPI (missing)**.

### CSV
→ JSON · table (sort/filter/columns) · JSON→CSV reformat (delimiter) · types · SQL seed (via JSON) · list compare (token-level) · **column compare (missing)** · **Markdown/HTML table (missing)** · **column extraction (missing)**.

### YAML
→ JSON · XML · TOML · CSV · types · schema · validate · diff (plaintext) · **structural diff (missing)** · **k8s check (missing)**.

### XML
→ JSON · YAML · TOML · CSV · types · schema · **structural diff (missing)** · **pretty/minify** ✅.

### List
→ compare (5 buckets + dupes) · sort · normalize · SQL IN/NOT IN/VALUES · JS/Python/Go arrays · JSON array · regex alternation · CSV/TSV · YAML list · frequency · **single-list dedupe (missing)** · **Postgres ARRAY (missing)**.

### API response
→ format · query · types · schema · SQL · diff · share · **headers/status (missing)** · **code snippets (missing)**.

### Database result
→ list compare · SQL generation · CSV/Excel export · table view · **column picker (missing)**.

### Capability graph (actions per input type) — summary: JSON is the universal hub (9 output families); every non-JSON input routes through JSON for transforms/types/schema/SQL; lists route to SQL/code artifacts; responses route to code/schema/share.

---

## 17. SEO Opportunity Map — 200+ Search Intents

Clusters (intent → tool → existing/missing → difficulty → traffic (qualitative: VL/L/M/H) → dev value → competition → shareability).

### Cluster A — JSON format & validate (22 intents) ✅ existing
json formatter, json beautifier, format json online, json validator, json prettifier, pretty print json, json lint, minify json, json escape, json unescape, json remove trailing commas, json single quotes to double, sort json keys, remove empty fields json, dedupe json array, flatten json, unflatten json, json to single line, pretty print nested json, json checker, fix invalid json, json cleanup.
→ Tool: json-formatter / transform actions. Existing ✅. Difficulty 🔧 (pages mostly exist). Traffic H. Competition H. Shareability M.

### Cluster B — JSON conversion (24 intents) ✅ existing
json to yaml, yaml to json, json to xml, xml to json, json to csv, csv to json, json to toml, toml to json, json to json pretty, yaml to csv, xml to csv, csv to yaml, csv to xml, toml to yaml, yaml to toml, xml to toml, json to properties, properties to json, yaml to properties, json to ini, ini to json (last 5: 🔧 missing), json to excel(csv), json to markdown table (🔧 missing), csv to markdown table (🔧 missing), json url encode.
→ Tool: Convert menu. Most ✅. Missing: properties/INI/markdown (🔧). Traffic H. Competition M-H. Shareability M.

### Cluster C — JSON → code types (22 intents) ✅ engine, pages missing
json to typescript, json to ts, json to zod, json to pydantic, json to python dataclass, json to go struct, json to golang, json to java class, json to c# class, json to kotlin data class, json to swift codable, json to rust serde, json to protobuf, json to dart (🔨 missing), json to php (🔨 missing), json to graphql (🏗️ missing), json to avro (🏗️), json to openapi (🏗️), json to sql (✅ engine, page 🔧), typescript interface from json, generate typescript types online, json schema from json.
→ Existing: 12 targets ✅; **SEO pages missing for all but TS** (🔧 each). Traffic H. Competition M. Shareability M.

### Cluster D — JSON → SQL (10 intents) ✅ engine
json to sql, convert json to sql insert, json to create table, json to database schema, generate sql from json, json to sqlite schema, json to postgres table, json to mysql insert, create table from json, json to seed data.
→ Existing: SQL target ✅. Pages 🔧. Traffic M-H (high intent). Competition L-M. Shareability H. **Best differentiation cluster.**

### Cluster E — Query (16 intents) ✅
jsonpath tester, jsonpath online, jmespath tester, json query tool, jsonpath expression builder, filter json array, extract json values, json path finder, json query online, jsonpath regex, jsonpath playground, extract nested json, json search online (🟡 UI missing), find key in json (🟡), json filter by condition, get all values of key json.
→ Tool: Query view + Tree copy-path. Existing ✅ (search UI 🔧). Traffic M. Competition M. Shareability M.

### Cluster F — JSON diff/compare (14 intents) ✅
json diff, compare json, json comparison tool, diff json online, json compare online, json diff two files, compare json files, find difference between two json, json array diff (🔨 order-insensitive), json diff ignore order (🔨), pretty json diff, api response diff (🔨 snapshots), json to json compare, yaml diff (🔨 structural), xml diff (🔨), env file diff (🔨), csv diff online (🔨).
→ Tool: Compare. Existing ✅ (doc+list). Structural YAML/XML diff 🔨. Traffic M-H. Competition M. Shareability M-H.

### Cluster G — JSON Schema (12 intents) 🟡 partial
json schema generator, generate json schema, json schema validator, validate json against schema, json schema from sample, json schema to typescript (🔨 missing), json schema to zod (🔨), json schema mock data (🏗️), json schema diff (🏗️), create json schema, json schema generator from multiple samples (🔧), openapi schema from json (🏗️).
→ Existing: gen + validate ✅; schema-as-input targets missing. Traffic M. Competition M. Shareability M.

### Cluster H — JSON views (10 intents) ✅
json viewer, json tree view, json editor online, view json as table, json to table, json graph visualizer, json graph viewer, visualize json, json array to table, json formatter with tree.
→ Existing: tree/table/graph ✅. Traffic H. Competition H. Shareability M-H (graph images).

### Cluster I — List compare / set ops (14 intents) ✅ engine, pages missing
compare two lists, compare two lists online, find common elements, find difference between two lists, list intersection calculator, list union, symmetric difference, find duplicates in list, duplicate finder online, count duplicates in list, compare csv columns (🔨 missing), compare two columns of csv, list to sql, compare uuid lists, compare id lists.
→ Tool: List Compare ✅. **Pages missing entirely** (🔧). Traffic M-H. Competition M. Shareability H (SQL artifacts). **Second-best cluster.**

### Cluster J — SQL generation (12 intents) ✅ engine, pages missing
sql in clause generator, sql not in generator, generate in clause from list, sql values generator, in clause from csv, create insert statements from list, postgres array literal (🔧 missing), sql where in list, bulk insert generator, sql in list online, sql any array, chunk sql in batches (🔨 missing).
→ Existing: IN/NOT IN/VALUES ✅. Pages 🔧. Traffic M. Competition L. Shareability H.

### Cluster K — cURL/API (16 intents) 🟡
curl to fetch, curl to axios (🏗️ missing), curl to python requests (🏗️), curl to go (🏗️), curl to javascript, api response formatter (✅), api tester online (🟡), api request builder (🟡), http status codes list (🔧 missing), response headers viewer (🔨), jwt decoder (✅), bearer token generator (🔧), webhook tester (🔨), api schema from response (✅), curl command generator (🏗️), rest client online (🟡).
→ Existing: cURL execute/format ✅; code emitters missing. Traffic M-H. Competition M-H. Shareability M.

### Cluster L — CSV (14 intents) 🟡
csv to json, json to csv, csv formatter, csv validator, csv delimiter converter (🔧), csv to sql, csv to yaml, csv diff (🔨), compare two csv files (🔨), csv column extractor (🔧), csv to markdown table (🔧), csv to html table (🔧), csv transpose (🔨 missing), csv dedupe rows (🔨).
→ Existing: parse/format/convert ✅. Missing transforms 🔧/🔨. Traffic H. Competition H. Shareability M.

### Cluster M — UUID (8 intents) ✅
uuid generator, uuid v4 generator, bulk uuid generator, uuid v7, uuid v1, uuid v5, uuid nil, generate uuid online.
→ Existing ✅ (page exists). Traffic H. Competition H. Shareability L.

### Cluster N — Encoding (18 intents) ✅
base64 encode, base64 decode, base64 online, url encode, url decode, percent encoding, hex to text, text to hex, html entity encode, html decode, json escape, unicode escape (🔧 missing), base64 to image (🔨 missing), base64url (🔧), jwt decode, url parser, query string parser, punycode (🚫).
→ Existing: 6 codecs ✅. Pages exist. Traffic H. Competition H. Shareability L-M.

### Cluster O — Hash/text/time (16 intents) ✅
sha256 generator, sha1 hash, hash text online, md5 hash (🔧 missing — note: MD5 is broken crypto, still high search), unix timestamp converter, epoch converter, seconds to date, text stats, word count online, lorem ipsum generator, password generator, case converter, slug generator, regex tester online, regex replace (🔧 missing), cron expression explainer.
→ Existing: 15 ✅ (regex replace + md5 🔧). Traffic H. Competition H. Shareability L.

### Cluster P — Misc developer utils (12 intents) 🟡
number base converter, hex to rgb, color converter, css color converter, html to markdown (🚫), markdown to html (🚫), json to markdown (🔧), diff checker online, compare text online, list to markdown (🔧), sql formatter (🔧 missing), json formatter vscode alternative (✅).
→ Mixed. **sql formatter 🔧 is the standout** (huge traffic, trivial for Formaty).

**Total intents: 22+24+22+10+16+14+12+10+14+12+16+14+8+18+16+12 = 240.** All traffic labels are qualitative (no invented numbers).

---

## 18. Viral Product Loops (20+)

Each: Creator → artifact → recipient → reason to open Formaty → reason to use → reason to share again.

- V01 **SQL NOT IN snippet**: backend dev → `id NOT IN (...)` → teammate → "how did you get this?" → list compare → pastes own lists, shares result. 
- V02 **Graph PNG**: architect → JSON structure image → Slack → wants their own → graph view + PNG copy → shares next diagram.
- V03 **Generated Zod/TS**: frontend dev → typed schema snippet → PR review → reviewer pastes payload → types → shares corrected version.
- V04 **JSON→SQL DDL**: engineer → CREATE TABLE + seeds → code review → reviewer wants for their table → converts own JSON → shares.
- V05 **Shared workspace link**: dev → exact-state link → teammate reproduces bug → link opens instantly, no signup → shares link in ticket.
- V06 **Query result**: data analyst → JSONPath result → colleague → wants same for their API → Query view → shares extracted IDs.
- V07 **Diff report JSON**: dev → audit artifact → reviewer → compares own configs → shares report.
- V08 **UUID batch**: tester → 20 UUIDs → fixture PR → teammate → generates own batch → shares.
- V09 **Formatted response**: support eng → beautified webhook → forum → pastes own error → formats → shares.
- V10 **CSV export**: analyst → spreadsheet-ready data → team → wants own → JSON→CSV → shares.
- V11 **JSONPath expression**: dev → `$.store.book[*].title` → colleague → tests own query → shares.
- V12 **JWT decode**: auth dev → decoded claims → teammate → pastes own token → decodes locally (privacy!) → shares findings.
- V13 **Schema**: contractor → generated JSON Schema → API doc → reviewer → generates own → shares.
- V14 **List compare result**: DBA → missing IDs → incident chat → teammate → reconciles own systems → shares.
- V15 **Beautify before/after**: blogger → prettified JSON in tutorial → reader → tries own → embeds/shared snippet.
- V16 **cURL→fetch code**: dev → fetch snippet → code review → reviewer converts own curl → shares.
- V17 **Regex alternation**: QA → `id1|id2|id3` pattern → teammate → builds own → shares.
- V18 **K8s YAML**: platform eng → JSON→YAML manifest → PR → reviewer → converts own → shares.
- V19 **Timestamp conversion**: incident responder → epoch→time → chat → colleague → converts own → shares.
- V20 **Markdown table** (future): writer → JSON→MD table → docs → reader → converts own → shares.

---

## 19. Embeddable Formaty

**Concept:** `<iframe src="https://formaty.dev/playground?tool=json-diff&embed=1">` or dedicated embed pages.

- **Strategic value:** medium-high. Docs sites, GitHub READMEs, internal dev portals, blog posts about JSON/API debugging would embed "live examples" (diff two JSONs in a blog post). It is one of the few ways a *static, no-backend* product can reach other developers' pages.
- **Constraints:** static export works (no server needed); needs: `embed=1` mode (hide chrome/nav, compact header), `Content-Security-Policy: frame-ancestors` decision, no GA in embeds, size controls, a "Open in Formaty" link inside the embed (the loop-back).
- **Cost:** 🔨 moderate (embed layout + a few SEO pages in `embed` variant). **Recommendation:** do it after the SEO page wave; it multiplies every shareable artifact.

---

## 20. Browser Extension

**Highest-value actions (ranked):**
1. **Context menu "Open JSON in Formaty"** — right-click selected JSON text → opens `/playground` prefilled (hash-encoded) → instantly formats/validates/tree-views. Reuses the share-state hash — trivial linkage. 🔨
2. **Context menu "Compare selection with clipboard"** — select JSON/text → "Compare with clipboard" → opens Compare prefilled with both sides. 🔨
3. **"Inspect page JSON"** — detect `<pre>`/`application/json` bodies on the page → open in Formaty. 🔨
4. **Selected IDs → List Compare** — right-click a block of IDs → List Compare prefilled. 🔧-🔨
5. **API response viewer** — devtools-ish interception is 🏗️ and conflicts with local-first; defer.

**Value:** extension is the *front door* that turns "paste into a website" into "right-click anywhere". It also re-uses the hash-share format, so zero server needed. **Recommendation:** ship context-menu items 1–2 first; they are small, high-frequency, and feed every other workflow.

---

## 21. CLI / CI

**Concept:** `formaty` CLI from the same pure-TS engine (`core.ts`, `formats/*`, `listCompare.ts`, `diff.ts` are dependency-free and already portable).

```bash
formaty format data.json            # pretty print
formaty diff a.json b.json          # structural diff + exit code
formaty compare a.txt b.txt         # list compare → buckets
formaty json-to-sql data.json       # DDL + seed
formaty validate schema.json data.json
formaty jsonpath data.json '$.users[*].id'
formaty types data.json -l go
```

**CI use cases (GitHub Actions):** schema check (validate payload against schema, fail build), API contract check (compare response snapshot), config lint (JSON/YAML validity), diff enforcement (flag unexpected changes).

**Which capabilities are worth exposing:** format/lint, validate, diff (with exit codes), json-to-sql, jsonpath, types, compare. **Verdict:** strategically valuable (turns Formaty into a real developer tool and a natural extension target), but a **Tier 3 bet** — the core.ts extraction is 🔨, CLI packaging + publishing 🏗️. Do it after the web-side opportunities are captured.

---

## 22. Team / Enterprise Opportunities

Only where a clear workflow exists:
- **Shared debugging sessions** ✅ exists (share links) — enhance with diff links (🔨) and query links (🔧).
- **Saved recipes/templates** (e.g., "compare DB exports", "response → types → SQL") — 🔨; high team value, no accounts needed (localStorage + share link).
- **API snapshots / contract checks** — 🔨/🏗️; ties to schema pillar.
- **Audit trails** (what was compared/diffed) — 🔨; low priority.
- **Internal dev portal embedding** — 🔨; pairs with §19 embeds.
- **Self-hosting** ✅ — the app is already a static export; a private deployment is trivially supported by design (env-driven API). Document it.
- **SSO/accounts/pricing** — 🚫 NOT RECOMMENDED; contradicts local-first/no-signup identity.

---

## 23. CORE vs ADJACENT vs DISTRACTION

**CORE (strengthens data-debugging workspace):** SQL generator polish + pages; list compare pages + single-list tool + CSV column compare; JSON search UI; structural XML/YAML diff; cURL headers/status + code emitters; JSON→SQL flagship pages; schema→mock & schema→TS; table→CSV/Markdown export; file drag-drop; presets/recipes; query↔list piping; snapshot A/B; embed mode; browser extension (context-menu); CLI (later).

**ADJACENT (useful, naturally connected):** .env/INI/properties converters; SQL formatter; HTTP status/headers reference; JSON Pointer tester; base64↔image preview; X.509 decoder; K8s/YAML check; UUID v6/v8; MD5 (with warning); unicode escape; regex replace; markdown/html table exports; Go slice / Postgres ARRAY / INSERT / IN-chunk exports; request history.

**DISTRACTION (technically easy, weakens identity — 🚫):** QR code generator; unit/currency/temperature converters; random hex-color palettes; image compression; PDF tools; markdown editor; HTML→Markdown/rich-text converters; emoji/ascii tools; full Postman-style API client with environments & proxy; visual no-code pipeline builder (now); accounts/login; paid tiers; random "top 100 dev tools" additions (lorem variants, stopwatch, etc.).

---

## 24. Possible Product Categories (5–10)

1. **Developer Data Workspace** — format/convert/compare/reconcile/query/codegen for structured data. Core promise: "one tab for all your data debugging". Target: backend/full-stack/data engineers. Strongest: conversion, SQL gen, list compare, types, offline. Weakest: no file input, no API client depth. SEO: excellent (200+ intents). Viral: high (SQL/code artifacts). Differentiation: high. Ceiling: very high.
2. **Data Debugging Workspace** — emphasis on compare/reconcile/diff (DB, CSV, configs, API). Strongest: Compare pillar. SEO: strong ("compare two lists/csv"). Ceiling: high; slightly narrower.
3. **Structured Data Workbench** — formats + views (tree/graph/table) + query. Strongest: visualization. Ceiling: medium (crowded).
4. **API Data Workbench** — cURL→response→schema→types→fixtures. Strongest: API chain. Weakest: CORS limits; needs code emitters + headers. Ceiling: high but competitive.
5. **Schema & Contract Workspace** — data→schema→types→mock→validate→OpenAPI. Strongest: unique. Ceiling: high; requires schema→mock & OpenAPI builds.
6. **Code & Schema Generation Hub** — JSON→12 targets + SQL + OpenAPI. Strongest: codegen. Ceiling: high but narrows identity to generators.
7. **Developer Data Swiss Army Knife** — everything incl. utils. Weakest: identity dilution (trap).
8. **Database Debugging Companion** — SQL output focus. Strongest: list→SQL, JSON→SQL. Ceiling: high niche, lower breadth.

**Recommended: #1 "Developer Data Workspace"** — it subsumes #2/#3/#4/#6 naturally, keeps utils as a supporting rail, and gives the cleanest marketing story: *"Format, convert, compare, reconcile, and generate code from any structured data — locally."*

---

## 25. Recommended Product Identity

**"Formaty — the Developer Data Workspace"**

- Tagline direction: *"Format, convert, compare, reconcile, and generate — your data, your browser."*
- Positioning: the single tab developers open when they have *some data* and need it *debugged, transformed, reconciled, or turned into code/schema/SQL*.
- Differentiators to lead with: JSON→SQL DDL+seed · list compare → SQL IN/NOT IN · 12-language types · 5-format conversion · offline + exact-state share · keyboard-first.
- What it deliberately is NOT: a general toolbox, an API client, an account-based SaaS.

---

## 26. Ideal Formaty Architecture (conceptual)

- **Main navigation:** `Tools` (Transform) | `Compare` | `Utils` — keep the three-tool workspace; add a `Recipes` menu (presets) and a `Share/Export` overflow. Global search bar (command palette) stays the primary navigation.
- **Core tools:** Transform (format/convert/views/types/query/schema), Compare (document | list | future: CSV columns), Utils (18+, extended with SQL formatter, HTTP reference, env converters).
- **Input model:** paste text (✅) + drag-drop/file picker (🔨) + cURL (✅) + URL fetch (🔧) + extension-sent selections (🔨). All inputs converge on the same `JsonValue`/string model; every input is local-first.
- **Output model:** universal copy/copy-as/download with format-aware exporters (add Markdown table, Postgres ARRAY, INSERT, Go slice, shell args, IN chunks); artifacts everywhere (images, SQL, code, reports, links).
- **Comparison model:** three engines — document (line + structural JSON), list (set/multiset with SQL exports), and future column-aware CSV; each with order-sensitive/insensitive and normalization options.
- **Transformation model:** manual chaining today; add **presets/recipes** (palette-accessible) and **one-click piping** (query→list, output→input); a visual pipeline builder is deliberately out of scope.
- **Sharing model:** hash links (default) + API links; extend `WorkspaceState` to include query text, diff sides, and recipes; add "copy as markdown/HTML" for embeds; embed mode for iframes.
- **Workspace model:** tabs with per-tab snapshots (✅); add named snapshot A/B storage, request history, recipe library (localStorage + shareable via link).
- **SEO architecture:** 200+ intent map → ~40 new content pages in the existing `seo.ts`/`seoUtils.ts` pattern (one config object per tool, zero new UI code); sitemap/robots/JSON-LD auto-extend.
- **Browser extension:** context-menu "Open in Formaty" + "Compare with clipboard" + "Inspect page JSON" → all deep-link via the existing hash format.
- **CLI/CI (later):** extract the pure engine (`core.ts`, formats, compare, diff) into a publishable package → CLI + GitHub Action for validate/diff/schema-check.

---

## 27. 100+ Opportunity Prioritization Matrix

Scoring: UV (user value), Freq (frequency), SEO (search potential), Diff (differentiation), Share (shareability), Fit (fits Formaty) — each 1–10; Effort 1–10 (10 = hardest). **Priority Score = UV+Freq+SEO+Diff+Share+Fit − Effort** (max 50). Tiers: **Tier 0** exists — market it; **Tier 1** score ≥ 40 (tiny effort); **Tier 2** ≥ 34; **Tier 3** ≥ 28; **Reject** < 28 or flagged.

| # | Opportunity | Cat | UV | Freq | SEO | Diff | Share | Fit | Effort | Score | Tier |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | List compare → SQL IN/NOT IN | Core | 10 | 9 | 9 | 8 | 8 | 10 | 2 | 52 | 1 |
| 2 | JSON→SQL DDL+seed (pages + options) | Core | 10 | 8 | 9 | 10 | 9 | 10 | 3 | 53 | 1 |
| 3 | Tree search UI (wire searchJson) | Core | 8 | 8 | 7 | 6 | 4 | 10 | 2 | 41 | 1 |
| 4 | /compare-lists SEO page | Core | 8 | 8 | 9 | 7 | 7 | 10 | 2 | 47 | 1 |
| 5 | /sql-in-clause-generator page | Core | 8 | 8 | 9 | 7 | 7 | 10 | 2 | 47 | 1 |
| 6 | /json-to-sql page | Core | 9 | 8 | 9 | 9 | 8 | 10 | 2 | 51 | 1 |
| 7 | /json-to-zod, -go, -python… pages | Core | 8 | 7 | 9 | 8 | 6 | 10 | 2 | 46 | 1 |
| 8 | Response headers + status in cURL | Core | 8 | 7 | 6 | 6 | 4 | 9 | 3 | 37 | 2 |
| 9 | cURL→fetch code emitter | Core | 9 | 7 | 9 | 8 | 7 | 9 | 4 | 45 | 1 |
| 10 | cURL→axios/python/go emitters | Core | 8 | 6 | 8 | 8 | 6 | 9 | 6 | 39 | 2 |
| 11 | File drag-drop input | Core | 9 | 8 | 5 | 5 | 4 | 10 | 3 | 38 | 2 |
| 12 | Compare two files | Core | 9 | 7 | 6 | 6 | 4 | 10 | 3 | 39 | 2 |
| 13 | CSV column selection in list compare | Core | 9 | 8 | 7 | 8 | 6 | 10 | 5 | 43 | 2 |
| 14 | Single-list tool (dedupe/sort) | Core | 8 | 8 | 7 | 6 | 5 | 10 | 3 | 41 | 1 |
| 15 | Structural XML/YAML diff | Core | 8 | 7 | 8 | 7 | 6 | 10 | 4 | 42 | 2 |
| 16 | JSON array order-insensitive diff | Core | 8 | 6 | 7 | 8 | 5 | 10 | 5 | 39 | 2 |
| 17 | Schema→mock/fixture data | Core | 9 | 7 | 7 | 9 | 6 | 10 | 6 | 42 | 3 |
| 18 | Schema→TypeScript | Core | 8 | 7 | 7 | 8 | 5 | 10 | 5 | 40 | 2 |
| 19 | Schema-aware diff | Core | 7 | 5 | 6 | 9 | 4 | 9 | 7 | 33 | 3 |
| 20 | JSON→OpenAPI | Core | 8 | 6 | 8 | 9 | 5 | 10 | 7 | 39 | 3 |
| 21 | Query→List Compare piping | Core | 9 | 7 | 4 | 7 | 5 | 10 | 3 | 39 | 2 |
| 22 | "Use as input" made visible | Core | 8 | 7 | 2 | 4 | 3 | 10 | 1 | 33 | 2 |
| 23 | Presets/recipes (palette) | Core | 8 | 7 | 3 | 7 | 6 | 10 | 4 | 37 | 2 |
| 24 | Snapshot A/B store (compare envs) | Core | 8 | 6 | 4 | 7 | 5 | 10 | 4 | 36 | 2 |
| 25 | Diff links in share (query+diff state) | Core | 8 | 6 | 5 | 7 | 8 | 10 | 4 | 40 | 2 |
| 26 | Table→CSV/Markdown export | Core | 7 | 6 | 5 | 5 | 6 | 10 | 2 | 37 | 1 |
| 27 | Markdown table export | Core | 7 | 6 | 6 | 5 | 7 | 10 | 2 | 39 | 1 |
| 28 | HTML table export | Core | 6 | 5 | 5 | 4 | 6 | 9 | 2 | 33 | 2 |
| 29 | PostgreSQL ARRAY/ANY export | Core | 7 | 6 | 6 | 6 | 5 | 10 | 2 | 38 | 1 |
| 30 | Go slice export | Core | 6 | 5 | 5 | 4 | 4 | 9 | 2 | 31 | 2 |
| 31 | SQL INSERT statement export | Core | 8 | 7 | 6 | 7 | 6 | 10 | 4 | 40 | 2 |
| 32 | SQL IN chunking | Core | 7 | 6 | 6 | 6 | 5 | 10 | 3 | 37 | 2 |
| 33 | Request history (recent curls) | Core | 7 | 6 | 3 | 5 | 4 | 9 | 3 | 31 | 2 |
| 34 | Bearer-token/auth field | Core | 7 | 6 | 4 | 5 | 3 | 9 | 2 | 32 | 2 |
| 35 | SQL formatter | Adjacent | 8 | 7 | 9 | 5 | 4 | 8 | 3 | 38 | 2 |
| 36 | .env/INI/properties converters | Adjacent | 7 | 6 | 7 | 6 | 4 | 8 | 4 | 34 | 2 |
| 37 | HTTP status/headers reference | Adjacent | 6 | 6 | 8 | 3 | 3 | 7 | 2 | 31 | 2 |
| 38 | JSON Pointer tester | Adjacent | 6 | 5 | 6 | 4 | 3 | 8 | 3 | 29 | 3 |
| 39 | Base64↔image preview | Adjacent | 6 | 5 | 6 | 4 | 4 | 7 | 4 | 28 | 3 |
| 40 | X.509 certificate decoder | Adjacent | 6 | 4 | 6 | 5 | 3 | 7 | 4 | 27 | 3 |
| 41 | UUID v6/v8 | Adjacent | 5 | 4 | 4 | 3 | 2 | 7 | 2 | 23 | Reject |
| 42 | MD5 (with warning) | Adjacent | 6 | 6 | 8 | 3 | 2 | 6 | 2 | 29 | 3 |
| 43 | Unicode escape/unescape | Adjacent | 6 | 5 | 5 | 3 | 2 | 8 | 2 | 27 | 3 |
| 44 | Regex replace | Adjacent | 7 | 6 | 6 | 4 | 3 | 8 | 3 | 31 | 2 |
| 45 | K8s manifest checker | Adjacent | 6 | 4 | 6 | 5 | 3 | 8 | 5 | 27 | 3 |
| 46 | CSV column extractor | Core | 7 | 6 | 7 | 6 | 5 | 10 | 3 | 38 | 2 |
| 47 | JSON key-extraction from array | Core | 7 | 6 | 6 | 5 | 4 | 10 | 2 | 36 | 1 |
| 48 | Multiset (count-weighted) compare | Core | 7 | 5 | 5 | 7 | 5 | 10 | 5 | 34 | 2 |
| 49 | CSV→SQL seed | Core | 8 | 7 | 7 | 7 | 6 | 10 | 4 | 41 | 2 |
| 50 | JSON normalize preset (sort/dedup/clean) | Core | 7 | 6 | 5 | 5 | 4 | 10 | 2 | 35 | 1 |
| 51 | Flatten→CSV preset | Core | 7 | 6 | 6 | 5 | 4 | 10 | 2 | 36 | 1 |
| 52 | "Copy all regex matches as list" | Core | 7 | 6 | 3 | 4 | 4 | 10 | 2 | 32 | 2 |
| 53 | Log-ID extraction flow | Core | 7 | 6 | 5 | 5 | 5 | 10 | 3 | 35 | 2 |
| 54 | Response→fixture export | Core | 8 | 6 | 5 | 7 | 5 | 10 | 4 | 37 | 2 |
| 55 | Table virtualization (5k+ rows) | Core | 7 | 6 | 2 | 4 | 2 | 9 | 5 | 25 | 3 |
| 56 | CSV delimiter converter | Core | 7 | 6 | 6 | 4 | 4 | 10 | 2 | 35 | 1 |
| 57 | CSV→Markdown/HTML table | Core | 6 | 5 | 6 | 4 | 6 | 10 | 2 | 35 | 1 |
| 58 | CSV transpose | Core | 5 | 4 | 5 | 4 | 3 | 9 | 4 | 26 | 3 |
| 59 | CSV dedupe rows | Core | 7 | 6 | 6 | 5 | 4 | 10 | 3 | 35 | 2 |
| 60 | URL-fetch input | Core | 6 | 5 | 4 | 4 | 4 | 8 | 3 | 28 | 3 |
| 61 | Embed mode (iframe) | Core | 7 | 5 | 6 | 8 | 8 | 9 | 5 | 38 | 3 |
| 62 | Browser extension (open JSON) | Core | 8 | 7 | 4 | 7 | 6 | 9 | 4 | 37 | 2 |
| 63 | Extension (compare w/ clipboard) | Core | 8 | 6 | 3 | 7 | 5 | 9 | 4 | 34 | 2 |
| 64 | Extension (inspect page JSON) | Core | 7 | 5 | 3 | 6 | 4 | 8 | 5 | 28 | 3 |
| 65 | CLI (format/diff/validate/compare) | Core | 8 | 6 | 4 | 9 | 5 | 9 | 7 | 34 | 3 |
| 66 | GitHub Action (schema/contract check) | Core | 7 | 5 | 3 | 8 | 4 | 8 | 7 | 28 | 3 |
| 67 | Recipes library + shareable recipe links | Core | 7 | 5 | 4 | 8 | 7 | 10 | 5 | 36 | 3 |
| 68 | Shared diff links (hash A/B) | Core | 8 | 6 | 4 | 7 | 9 | 10 | 4 | 40 | 2 |
| 69 | Query text in share state | Core | 7 | 5 | 2 | 5 | 6 | 10 | 2 | 33 | 2 |
| 70 | /json-flattener page | Core | 6 | 5 | 7 | 5 | 3 | 10 | 2 | 34 | 1 |
| 71 | /json-to-yaml page (exists) | — | — | — | — | — | — | — | — | — | 0 |
| 72 | /compare-csv / /csv-diff pages | Core | 7 | 6 | 8 | 6 | 5 | 10 | 3 | 39 | 2 |
| 73 | /curl-to-fetch page | Core | 8 | 6 | 9 | 7 | 6 | 10 | 3 | 43 | 1 |
| 74 | /json-schema-validator page | Core | 8 | 7 | 8 | 7 | 5 | 10 | 3 | 42 | 2 |
| 75 | /find-duplicates-in-list page | Core | 7 | 6 | 8 | 5 | 4 | 10 | 2 | 38 | 1 |
| 76 | /json-to-csv + /csv-to-json pages (exist) | — | — | — | — | — | — | — | — | — | 0 |
| 77 | /compare-two-json-files page | Core | 7 | 6 | 8 | 6 | 5 | 10 | 2 | 40 | 1 |
| 78 | /jsonpath-tester (exists) | — | — | — | — | — | — | — | — | — | 0 |
| 79 | /yaml-to-json etc. (exist) | — | — | — | — | — | — | — | — | — | 0 |
| 80 | /sql-formatter page | Adjacent | 7 | 7 | 9 | 4 | 3 | 8 | 3 | 35 | 2 |
| 81 | /uuid-bulk-generator page | Adjacent | 6 | 6 | 7 | 3 | 3 | 7 | 2 | 30 | 2 |
| 82 | /base64-to-image page | Adjacent | 6 | 5 | 7 | 4 | 4 | 7 | 3 | 30 | 2 |
| 83 | /timestamp-range page | Adjacent | 5 | 4 | 6 | 2 | 2 | 7 | 2 | 24 | Reject |
| 84 | JSON search page (/find-key-in-json) | Core | 6 | 5 | 6 | 5 | 3 | 10 | 3 | 32 | 2 |
| 85 | Workspace "Send to List Compare" from Query | Core | 8 | 6 | 2 | 6 | 5 | 10 | 3 | 34 | 2 |
| 86 | CSV→JSON column types inference | Core | 7 | 6 | 4 | 5 | 3 | 10 | 3 | 32 | 2 |
| 87 | JSON→SQL dialect options (postgres/sqlite/mysql) | Core | 9 | 7 | 8 | 9 | 7 | 10 | 4 | 46 | 2 |
| 88 | Table name option in SQL export | Core | 8 | 7 | 3 | 6 | 5 | 10 | 2 | 37 | 1 |
| 89 | "Open in Formaty" link in embeds | Core | 6 | 4 | 2 | 5 | 7 | 9 | 2 | 31 | 2 |
| 90 | Multi-file upload → tabs | Core | 6 | 5 | 2 | 4 | 4 | 9 | 4 | 26 | 3 |
| 91 | Clipboard file paste | Core | 5 | 4 | 2 | 3 | 3 | 8 | 3 | 22 | Reject |
| 92 | Folder ingestion | Core | 4 | 3 | 1 | 3 | 2 | 7 | 7 | 13 | Reject |
| 93 | Visual pipeline builder | Core | 7 | 4 | 3 | 6 | 5 | 7 | 9 | 23 | Reject |
| 94 | Full API client (environments/proxy) | Core | 7 | 5 | 4 | 4 | 3 | 6 | 9 | 20 | Reject |
| 95 | Accounts/login/pricing | — | 5 | 3 | 1 | 2 | 2 | 2 | 8 | 7 | Reject |
| 96 | QR codes | Distraction | 3 | 2 | 3 | 1 | 1 | 2 | 2 | 10 | Reject |
| 97 | Unit/currency converters | Distraction | 4 | 3 | 5 | 1 | 1 | 2 | 2 | 14 | Reject |
| 98 | Image/PDF tools | Distraction | 3 | 2 | 4 | 1 | 1 | 1 | 4 | 8 | Reject |
| 99 | Markdown editor | Distraction | 5 | 4 | 6 | 1 | 2 | 2 | 4 | 16 | Reject |
| 100 | HTML↔Markdown converter | Distraction | 4 | 3 | 5 | 1 | 2 | 3 | 3 | 15 | Reject |
| 101 | SVG/emoji/ascii tools | Distraction | 3 | 2 | 3 | 1 | 2 | 1 | 2 | 10 | Reject |
| 102 | Docker Compose helper | Adjacent | 6 | 4 | 6 | 5 | 3 | 7 | 6 | 25 | 3 |
| 103 | API mock server | Distraction | 6 | 3 | 4 | 5 | 3 | 5 | 9 | 17 | Reject |
| 104 | Audit trail (history of diffs) | Adjacent | 5 | 3 | 1 | 5 | 3 | 7 | 5 | 19 | Reject |
| 105 | Private/self-hosted deployment docs | Adjacent | 6 | 3 | 2 | 6 | 3 | 8 | 3 | 25 | 3 |

*(100+ entries; scores are directional, not measured.)*

---

## 28. Top 20 Recommendations

1. **Ship SEO pages for existing engines** (🔧): `/json-to-sql`, `/compare-lists`, `/sql-in-clause-generator`, `/json-to-zod`, `/json-to-go`, `/json-to-python`, `/compare-two-json-files`, `/find-duplicates-in-list`, `/curl-to-fetch`, `/json-schema-validator`, `/json-flattener` — pure content in the existing `seo.ts` pattern. Highest ROI in the whole plan.
2. **Wire the JSON search engine into Tree view** (🔧) — dead code → visible feature.
3. **SQL export polish** (🔨): table name + dialect options (SQLite/Postgres/MySQL), nullable detection; make JSON→SQL the flagship.
4. **List Compare single-list mode** (🔧): dedupe/sort/normalize one list; surfaces "find duplicates" as its own tool.
5. **CSV column selection in List Compare** (🔨): header detection + key-column picker → record reconciliation.
6. **cURL response status + headers** (🔨) and **Bearer-token field** (🔧).
7. **cURL→fetch code emitter + page** (🔧) — first of the code emitters.
8. **File drag-drop + compare-two-files** (🔨).
9. **Markdown-table & HTML-table exports** (🔧), plus **PostgreSQL ARRAY**, **Go slice**, **SQL INSERT**, **IN chunking** (🔨).
10. **One-click piping**: Query result → List Compare; make "Use as input" visible (🔧).
11. **Presets/recipes via command palette** (🔨): "Flatten to CSV", "Response → Types", "Compare DB exports".
12. **Structural XML/YAML diff** (🔨) — reuse parse → JSON diff.
13. **Snapshot A/B store** (🔨) for env/response comparisons.
14. **Share-state expansion** (🔨): include query text + diff sides → shareable diff/query links.
15. **SQL formatter utility + page** (🔧) — huge search, trivial.
16. **.env/INI/properties converters** (🔨).
17. **Schema→mock data + Schema→TypeScript** (🔨/🏗️) — the schema pillar seeds.
18. **Embed mode** (🔨) after the SEO wave — iframe + "Open in Formaty" loop-back.
19. **Browser extension** (🔨): context-menu "Open JSON in Formaty" + "Compare with clipboard".
20. **CLI + GitHub Action** (🏗️, later) — extract pure engine, then package.

---

## 29. Things We Should NOT Build

- Random utility sprawl: QR codes, unit/currency/temperature converters, image/PDF tools, palettes, emoji/ascii.
- A full Postman-style API client (environments, proxies, collections) — fights local-first identity; only headers/status + code emitters are wanted.
- Visual no-code pipeline builder — manual chaining + presets cover the need; a canvas UI is a trap.
- Accounts, logins, cloud sync, pricing — contradicts "no sign-up, local-first".
- Markdown editor / HTML↔Markdown / rich-text tools — different product.
- Mock API server — different product; schema→mock *data* is in scope, a server is not.
- Folder ingestion, clipboard-file paste, audit trails, SSO — low value for the identity.
- MD5 as a headline feature (broken crypto; if shipped, with a deprecation warning only).

---

## 30. Final Product Strategy

**One sentence:** Formaty should become **the Developer Data Workspace** — the tab developers open when they have structured data and need to format, convert, compare, reconcile, query, or turn it into code, schemas, or SQL — 100% local, offline, shareable.

**Sequence (18 months, three waves):**
- **Wave 1 (weeks, 🔧/🔨): SEO page wave + engine completions.** Ship the ~12 pages over existing engines, wire tree search, SQL export options, single-list mode, cURL headers/status, Markdown/ARRAY/INSERT exports, drag-drop, piping, presets. Near-zero risk, compounding SEO + a visibly more complete product.
- **Wave 2 (months, 🔨): comparison + schema pillars.** CSV column compare, structural XML/YAML diff, snapshots, schema→mock & schema→TS, shareable diff/query links, embed mode, extension context-menu. Formaty becomes the default "compare/reconcile" destination.
- **Wave 3 (later, 🏗️): developer-tool reach.** cURL→code emitters (fetch first, then axios/python/go), CLI + GitHub Action from the extracted pure engine, embed gallery for docs sites.

**North-star metric:** workflows completed per session (paste → transformed/comparison → copied/shared artifact), with search landing pages as the acquisition funnel and shareable SQL/code/images as the viral loop. Stay local-first, stay no-signup, stay coherent — every addition must route through the data-workspace graph or it gets rejected.

---

*Product expansion report complete — the codebase was not modified. Baseline audit: `docs/product-audit.md`. Status markers: ✅ EXISTS · 🟡 PARTIAL · 🔧 EASY ADDITION · 🔨 MODERATE ADDITION · 🏗️ MAJOR ADDITION · 🚫 NOT RECOMMENDED.*
