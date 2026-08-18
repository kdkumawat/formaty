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
bun scripts/gen-og.mjs   # regenerate og.png + PNG favicons from SVG sources
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

### Shareable state

`src/lib/shareState.ts` serializes the workspace state (`WorkspaceState`) into a URL hash — `j:` + encoded JSON for small state, `e:` + lz-string for large. Shared links rehydrate state from the hash.

### State management & components

No global store is used — `src/components/WorkspaceContent.tsx` (a large `"use client"` component) owns workspace state via React `useState`/`useRef`. Zustand is a listed dependency but not the state mechanism. Key components:

- `src/components/workspace/` — the workspace shell (EditorPanel, Header, StatusBar, OutputActionBar, panels).
- `src/components/ui/` — shadcn/ui primitives (Radix-based; `components.json` + Tailwind v4).
- `src/components/landing/` — marketing page sections (`index.ts` re-exports them).
- `src/components/` root — workspace feature components (JsonEditor, JsonDiffEditor, ListComparePanel, SingleListPanel, QueryView, TreeView, GraphView, TableView, CommandPalette, GuidedTour, etc.).

### Config & conventions

- **Path alias** `@/*` → `./src/*` (`tsconfig.json`; replicated in `vitest.config.ts`).
- **`next.config.ts`**: `output: "export"`, `transpilePackages: ["jsoncrack-react"]`, and env pass-through (`FORMATY_API_URL`, `SITE_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`). Env vars are optional — see `.env.example`. `SITE_URL` defaults to `https://formaty.dev`.
- **Lint** uses Next.js 16 flat config (`eslint.config.mjs`); several React Compiler `react-hooks/*` rules are intentionally disabled (hand-written memoization, ref access during render). Do not re-enable without reason.
- React 19, Tailwind CSS v4, Next.js 16, Monaco Editor, ReactFlow.
