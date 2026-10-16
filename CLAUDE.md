# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Formaty is a local-first, browser-only developer data workspace: format/convert/compare/query JSON, XML, YAML, TOML, CSV, and generate SQL, types, and schemas from data. No backend — all data processing runs client-side. The site is statically exported for SEO, while `/playground` hosts the single interactive workspace.

## Commands

This project uses **Bun** as its package manager (`bun.lock`, not `package-lock.json` / `yarn.lock`). Do not use `npm`/`yarn` here.

```bash
bun install              # install dependencies
bun run dev              # dev server → http://localhost:3000
bun run build            # static export to out/ (Next.js `output: "export"`)
bun run lint             # eslint (flat config, eslint.config.mjs)
bun run test             # run all vitest tests once
bun run test -- <path>   # run a single test file, e.g. bun run test -- src/lib/json/core.test.ts
node scripts/gen-og.mjs  # regenerate OG share cards (real browser screenshots of each route; requires `bun run build` first), public/og.png (the home page hero, same way) and PNG favicons from SVG sources. Runs under Node or Bun; on Windows use Node (Bun 1.3.14 times out launching Playwright's Chromium).
```

Tests use **Vitest** (node environment), colocated as `src/**/*.test.ts`. The `@` alias is wired in `vitest.config.ts` (not just `tsconfig.json`).

## Architecture

### Routing & tools are data-driven, not file-driven

Every tool page (`/json-formatter`, `/compare-lists`, `/json-to-sql`, etc.) renders from a **single** dynamic route `src/app/[tool]/page.tsx`. The actual tool definitions live in **`src/lib/seo.ts`**:

- `TOOL_PAGES` — per-tool SEO config (title, h1, description, `inputExample`/`outputExample`, `useCases`, `relatedTools`).
- `ToolRoute` / `ALL_TOOL_ROUTES` — the canonical route list.
- `SEO_KEYWORDS` — per-tool keyword arrays.
- `TOOL_REDIRECTS` — removed routes mapped to their replacement (old URL redirects instead of 404ing).
- `TOOL_PRESETS` — workspace state applied when a tool links into `/playground`.

**Adding or editing a tool = edit `src/lib/seo.ts`. Do not create new page files.** `generateStaticParams` + `dynamicParams = false` are set because the build is a static export: every route must be pre-rendered, and unknown paths must 404.

Other App Router routes are mostly static/SEO surfaces: `src/app/playground` (the workspace), `src/app/tools`, `src/app/utils/[slug]`, `src/app/guides/[slug]`, `src/app/docs`, `src/app/changelog`.

### All heavy processing happens in a Web Worker

`src/workers/json.worker.ts` is the execution boundary. The React hook **`src/hooks/useJsonWorker.ts`** posts `{ id, action, payload }` messages and correlates responses by `id` (crypto.randomUUID). Data never leaves the device.

The worker is a thin dispatcher — the actual logic is pure functions in **`src/lib/json/core.ts`** (the core module: `formatJson`, `minifyJson`, `sortKeysDeep`, `flattenJson`/`unflattenJson`, `searchJson`, `generateTypeScript`, `generateTypes`, `generateSql`, `inferJsonSchema`, `toYaml`/`toXml`/`toCsv`, table/OpenAPI output). Pure functions here are unit-tested directly; the worker is not.

### Format adapters

`src/lib/formats/` defines a pluggable `FormatAdapter` interface (`types.ts`) with `parse`/`stringify`, implemented per format: `jsonParser`, `xmlParser`, `yamlParser`, `tomlParser`, `csvParser`. `detect.ts` sniffs input format (including cURL detection). `index.ts` exposes `getAdapter` / `parseInput` / `stringifyOutput`. Formats are `json | xml | yaml | toml | csv`; input may also be `curl`.

### Compare / diff / list logic

`src/lib/json/` holds the compare subsystem, separate from the JSON core:

- `listCompare.ts` — parse two lists, compute set operations (common/left-only/right-only/union/symmetric/duplicates), and format exports (`sql-in`, `sql-not-in`, `sql-values`, `sql-array`, JSON/CSV/Markdown/Go slice, etc.).
- `csvCompare.ts` — CSV comparison by key column.
- `diff.ts` — document diff (order-insensitive array comparison).

cURL parsing and client-code generation live in `src/lib/curl/` (`parseCurl.ts`, `codegen.ts` → fetch/Axios/Python/Go).

### Instant — timezone / world-time tool

`/utils/instant` is the timezone comparison page. It is **not** in `TOOL_PAGES` or `UTIL_PAGES` — it has its own dedicated route (`src/app/utils/instant/page.tsx`) and its own SEO config (`src/lib/seoInstant.ts` → `INSTANT_PAGE`). The page can also be embedded inside the workspace's Utils tab (`UtilsPanel.tsx` → `<InstantApp embedded />`).

Code layout under `src/lib/instant/`:

- `catalog.ts` — curated city list (`CITY_CATALOG`), IANA zone utilities (`listIanaZones`, `searchIanaZones`, `resolveZoneToken`, `isValidIana`, `detectLocalIana`, `detectTimeFormat`). Re-exports the country search helpers from `./countries`. `listIanaZones` prefers `Intl.supportedValuesOf("timeZone")` for a full IANA list, falling back to the curated set on older runtimes.
- `countries.ts` — ISO 3166-1 country list (`COUNTRY_CATALOG`) with capital + primary IANA per country. Powers the "Countries" section of the LocationPicker so searches like `Brazil` or `jp` surface a country-level result.
- `engine.ts` — `projectInstant` (instant → zoned wall-time via `temporal-polyfill`), `resolveLocalDateTime` (handles DST nonexistent/ambiguous), `formatLocalTime`/`formatLocalDate`/`isoUtc`/`unixSeconds`.
- `parse.ts` — `parseInstantInput` — smart parser for Unix seconds/ms, ISO 8601, "10:30 Asia/Kolkata", "Mar 9 10:30", "10:30 UTC+05:30". Bare clock inputs default to **real today** (not the currently displayed day) so `10:30` always means "today at 10:30".
- `url.ts` — URL query serialization for sharing an Instant state (`?at=…&tz=…&locations=…&fmt=…&sec=…`).
- `timeline.ts` — `defaultWindow`, `maybePanWindow`, `hourMarkers` for the horizontal hour-strip board.
- `persist.ts` — localStorage prefs (`locations`, `primaryTimezone`, `timeFormat`, `showSeconds`, `spanHours`) + onboard flag.
- `settingsBus.ts` — module-level pub/sub so the workspace settings panel (`SettingsPanel.tsx`, its Instant group shown while the Instant tool is open) can read and write Instant's `spanHours` / `timeFormat` / `showSeconds` without lifting state out of `InstantApp`. The standalone `/utils/instant` page renders the same controls inline (no duplicate gear) since it has no settings panel.
- `locations.ts` — builders for `Location` from a catalog row, custom input, or IANA id.
- `types.ts` — `Location`, `ZonedProjection`, `TimeFormat`, `TimelineSpanHours`, `InstantMode`.
- `copy.ts` — clipboard text emitters (`copyHuman` builds the multi-zone summary).

Components: `src/components/instant/InstantApp.tsx` (one toolbar row: unified smart input + hidden `<input type="datetime-local">` fallback, ‹ Live/Now › hour steps, and on the standalone page only the display options plus theme/share/reset/copy; then the hero clock with day nav and Instant/Range), `src/components/instant/LocationPicker.tsx` (modal that surfaces countries first, then curated cities + the full IANA zone list grouped by region; matches by country, city, country code, or raw IANA id). `TimelineBoard.tsx` is the only list of locations (there is no separate chip row): the home row first, per-row hover actions (copy, make home, remove), drag a row label to reorder, night shading and an amber working-hours bar on every strip, arrow keys on a focused strip, and the "Add location" button in its footer.

### Shareable state

`src/lib/shareState.ts` serializes the workspace state (`WorkspaceState`) into a URL hash — `j:` + encoded JSON for small state, `e:` + lz-string for large. Every link carries `tabs` + `tabSnapshots` (one tab or all), so Compare and Utils tabs open as themselves. Opening a link adds the shared tab(s) next to the visitor's saved session (`sharedTabEntries` + the merge effect after the restore effect in `WorkspaceContent.tsx`) and strips the hash; it never replaces their tabs. Short links (`src/lib/playgroundApi.ts`) only show when `FORMATY_API_URL` is set.

### State management & components

No global store is used — `src/components/WorkspaceContent.tsx` (a large `"use client"` component) owns workspace state via React `useState`/`useRef`. Key components:

- `src/components/workspace/` — the workspace shell (Header with typed tabs, NewTabMenu, PaneHeaders, OutputPicker, CompareBar, DocumentCompare, ShareDialog, SettingsPanel, StatusBar, EditorPanel, OutputActionBar).
- `src/components/ui/` — shadcn/ui primitives (Radix-based; `components.json` + Tailwind v4).
- `src/components/landing/` — marketing page sections (`index.ts` re-exports them).
- `src/components/` root — workspace feature components (JsonEditor, JsonDiffEditor, ListComparePanel, SingleListPanel, QueryView, TreeView, GraphView, TableView, CommandPalette, GuidedTour, etc.).

### Config & conventions

- **Path alias** `@/*` → `./src/*` (`tsconfig.json`; replicated in `vitest.config.ts`).
- **`next.config.ts`**: `output: "export"`, `transpilePackages: ["jsoncrack-react"]`, and env pass-through (`FORMATY_API_URL`, `SITE_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`). Env vars are optional — see `.env.example`. `SITE_URL` defaults to `https://formaty.dev`.
- **Lint** uses Next.js 16 flat config (`eslint.config.mjs`); several React Compiler `react-hooks/*` rules are intentionally disabled (hand-written memoization, ref access during render). Do not re-enable without reason.
- React 19, Tailwind CSS v4, Next.js 16, Monaco Editor, jsoncrack-react (graph view).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
