# formaty - Product Requirement

Design and build the most powerful JSON tool on the internet, with a local-first architecture and professional-grade UX.

## 1) Product Vision

formaty is the all-in-one workspace for JSON engineering: inspect, query, transform, validate, generate types, compare versions, and automate repeatable workflows from a single interface.

This should feel like:
- The speed of a native desktop app
- The depth of a developer platform
- The usability of a modern productivity tool

## 2) Non-Negotiable Constraints

- Tech stack: Next.js (App Router) + TypeScript
- Runtime model: fully client-side (no backend required)
- Data privacy: all JSON processing happens locally in browser
- Large payloads: must handle large files (10MB+) without freezing UI
- Extensibility: plugin-ready architecture from day one
- Quality bar: production-grade architecture, testing, and DX

## 3) Core Experience Pillars

- **Power**: rich tooling for real-world JSON workflows
- **Performance**: responsive even for deeply nested or large documents
- **Precision**: trustworthy parsing, validation, and deterministic transforms
- **Discoverability**: advanced features remain learnable and navigable
- **Extensibility**: clear module boundaries, future plugin ecosystem

## 4) Feature Scope (V1 Foundation)

### 4.1 JSON Workspace

- Monaco Editor integration
- Syntax highlighting + diagnostics
- Live validation with precise error mapping
- Format / minify / normalize
- Auto-detect JSON vs JSON5
- Drag & drop upload, file picker, and paste input
- Read-only safety mode for risky operations
- Session restore (local storage / IndexedDB)

### 4.2 Multi-Mode Viewer

- **Simplified View**: clean formatted document with collapsible blocks
- **Tree View**: expand/collapse, inline edit, copy path, data type badges
- **Graph View**: visual node graph, pan/zoom, parent-child highlighting
- **Raw View**: immutable canonical output

### 4.3 Search and Query Engine

- Search by key, value, type, JSONPath
- Case sensitivity toggle
- Regex support
- Match highlighting with count and next/previous navigation
- Query history and recent filters

### 4.4 Transformations and Utilities

- Sort keys (recursive, deterministic)
- Remove null / undefined / empty values
- Deduplicate keys and arrays (configurable)
- Flatten / unflatten
- Merge two JSON files (strategy: override / deep merge / custom)
- Visual diff between two JSON documents
- Filter by JSONPath
- Global key removal + deep key rename
- Extract keys list and inferred schema
- Convert JSON to CSV, XML, YAML, Base64
- Random JSON and mock data generator

### 4.5 Type and Schema Generation

- Generate types for: TypeScript, Zod, Java, Go, Python (Pydantic), Kotlin, Swift, Rust (Serde), C#, GraphQL
- Controls: strict mode, optionality detection, naming strategy, enum inference
- Nested model extraction and reusable type emission
- Generate JSON Schema (latest compatible draft strategy)
- Validate JSON against generated or imported schema
- Display structured, actionable validation errors

### 4.6 Workflow and Productivity

- Global keyboard shortcuts
- Copy-to-clipboard for paths, values, snippets, outputs
- Tabs + resizable panels
- Undo/redo history stack
- Node bookmarking
- Shareable local permalink (encoded state, no server)
- Import/export workspace session file

## 5) Advanced Capabilities (V2+ Expansion)

- Streaming JSON preview for massive payloads
- Local file system API integration (open/save sync)
- JWT decoder toolkit
- JSON encryption/decryption utilities
- Client-only API tester
- Batch transform pipelines
- Saved macros / reusable transformation recipes
- Pluggable parser and validator adapters
- Plugin marketplace architecture (local install first)

## 6) Performance SLOs

- Main thread never blocked by heavy operations
- Use Web Workers for parse, diff, schema, type generation, and deep transforms
- Progressive rendering for large trees
- Virtualized node rendering in tree mode
- Lazy loading for heavy modules (graph/diff/schema)
- Target interaction latency: under 100ms for common actions on medium files
- Memory-safe traversal for deeply nested objects

## 7) UX and Design System Requirements

- Minimal, professional, developer-first UI
- Dark/light theme parity
- Accessible interaction patterns (keyboard-first baseline)
- Clear status surfaces: parsing, worker busy, validation state, transform result
- Consistent command model across editor/viewer/transform tools

## 8) Architecture Requirements

- Feature-modular architecture with strict boundaries
- Shared core engine for parsing/query/transform
- Separation of concerns:
  - UI layer
  - Domain logic layer
  - Worker execution layer
  - Adapter/integration layer
- Reusable hooks and typed utility packages
- Error boundaries + Suspense-aware loading
- Strong TypeScript contracts across modules
- Strict ESLint + Prettier configuration
- Testable by design (unit + integration-ready)

## 9) Suggested Libraries

- Monaco Editor
- jsonpath-plus
- reactflow (graph view)
- zod
- state management: Zustand or Jotai
- diff engine for JSON compare
- worker orchestration utility

## 10) Monetization-Ready Structure

- Feature flag framework at capability level
- Pro feature gating (without changing core architecture)
- License/tier-aware UI abstraction boundary
- Capability manifest so premium modules can be toggled cleanly

## 11) V1 Deliverables (Must Ship)

- Project structure with clean modular boundaries
- Working JSON editor with live validation
- Tree view
- Advanced search (key/value/type/JSONPath)
- Core transforms: sort keys + flatten/unflatten + key filtering
- Type generation (TypeScript at minimum)
- JSON Schema generation + validation
- Visual diff (baseline implementation)
- Documented architecture and extension strategy

## 12) Definition of Done

- App runs fully client-side with no backend dependency
- Handles large JSON without UI freeze in normal workflows
- Core features are production-usable, not prototype-level
- Codebase is extensible for future plugin ecosystem
- Developer documentation is sufficient for contributors to add a new tool module
