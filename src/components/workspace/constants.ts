import type { FormatKind } from "@/lib/formats";
import type { TypeTargetLanguage } from "@/lib/json/core";

export const SAMPLE_JSON = `{
  "id": 42,
  "name": "formaty",
  "tags": ["json", "tooling", "productivity"],
  "owner": {
    "team": "platform",
    "active": true,
    "priority": null
  },
  "metrics": [
    { "day": "mon", "count": 1023 },
    { "day": "tue", "count": 1290 }
  ]
}`;

/** Array of objects - best starting point for Table view */
export const SAMPLE_JSON_TABLE = `[
  { "id": 1, "name": "Alice", "role": "admin", "active": true, "score": 98 },
  { "id": 2, "name": "Bob", "role": "dev", "active": true, "score": 87 },
  { "id": 3, "name": "Carol", "role": "viewer", "active": false, "score": 72 },
  { "id": 4, "name": "Dave", "role": "dev", "active": true, "score": 91 }
]`;

export const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <id>42</id>
  <name>formaty</name>
  <tags>
    <item>json</item>
    <item>tooling</item>
  </tags>
  <owner team="platform" active="true"/>
</root>`;

export const SAMPLE_YAML = `id: 42
name: formaty
tags:
  - json
  - tooling
  - productivity
owner:
  team: platform
  active: true
  priority: null
metrics:
  - day: mon
    count: 1023
  - day: tue
    count: 1290`;

export const SAMPLE_CSV = `id,name,tags
42,formaty,"json,tooling"
1,example,"a,b,c"`;

export const SAMPLE_TOML = `id = 42
name = "formaty"
tags = ["json", "tooling"]

[owner]
team = "platform"
active = true`;

export const SAMPLE_CURL = `curl -X GET "https://www.cloudflarestatus.com/api/v2/status.json"`;

export const EXAMPLE_GITHUB = `{
  "id": 460078,
  "name": "next.js",
  "full_name": "vercel/next.js",
  "private": false,
  "owner": {
    "login": "vercel",
    "id": 14985020,
    "avatar_url": "https://avatars.githubusercontent.com/u/14985020?v=4",
    "type": "Organization"
  },
  "description": "The React Framework",
  "fork": false,
  "created_at": "2016-01-17T00:55:59Z",
  "updated_at": "2025-03-16T12:00:00Z",
  "stargazers_count": 120000,
  "language": "TypeScript",
  "license": { "key": "mit", "name": "MIT License" }
}`;

export const EXAMPLE_STRIPE = `{
  "id": "evt_1ABC123",
  "object": "event",
  "api_version": "2023-10-16",
  "created": 1699000000,
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1ABC123",
      "object": "payment_intent",
      "amount": 2000,
      "currency": "usd",
      "status": "succeeded",
      "metadata": { "order_id": "ord_123" }
    }
  }
}`;

export const EXAMPLE_K8S = `{
  "apiVersion": "apps/v1",
  "kind": "Deployment",
  "metadata": {
    "name": "nginx-deployment",
    "labels": { "app": "nginx" }
  },
  "spec": {
    "replicas": 3,
    "selector": { "matchLabels": { "app": "nginx" } },
    "template": {
      "metadata": { "labels": { "app": "nginx" } },
      "spec": {
        "containers": [{
          "name": "nginx",
          "image": "nginx:1.14.2",
          "ports": [{ "containerPort": 80 }]
        }]
      }
    }
  }
}`;

export const EXAMPLE_OPENAPI = `{
  "openapi": "3.0.0",
  "info": {
    "title": "Sample API",
    "version": "1.0.0",
    "description": "A sample OpenAPI specification"
  },
  "paths": {
    "/users": {
      "get": {
        "summary": "List users",
        "responses": { "200": { "description": "Success" } }
      },
      "post": {
        "summary": "Create user",
        "responses": { "201": { "description": "Created" } }
      }
    }
  }
}`;

export const EXAMPLES = [
  { id: "github", label: "GitHub API", data: EXAMPLE_GITHUB },
  { id: "stripe", label: "Stripe webhook", data: EXAMPLE_STRIPE },
  { id: "k8s", label: "Kubernetes manifest", data: EXAMPLE_K8S },
  { id: "openapi", label: "OpenAPI schema", data: EXAMPLE_OPENAPI },
] as const;

export const SAMPLES: Record<FormatKind, string> = {
  json: SAMPLE_JSON,
  xml: SAMPLE_XML,
  yaml: SAMPLE_YAML,
  toml: SAMPLE_TOML,
  csv: SAMPLE_CSV,
};


/** Transform actions only - Compare is a separate workspace tool (not nested here). */
export const OPERATION_ACTIONS = [
  ["Beautify", "beautify"],
  ["Minify", "minify"],
  ["Flatten", "flatten"],
  ["Unflatten", "unflatten"],
  ["Schema", "schema"],
  ["OpenAPI spec", "openapi"],
  ["Validate", "validate"],
] as const;

export const OPERATION_ACTION_LABELS = Object.fromEntries(
  OPERATION_ACTIONS.map(([label, id]) => [id, label]),
) as Record<string, string>;

export const FORMAT_KINDS: FormatKind[] = ["json", "xml", "yaml", "toml", "csv"];

export const TYPE_LANGUAGES: Array<{ id: TypeTargetLanguage; label: string; ext: string }> = [
  { id: "typescript", label: "TypeScript", ext: "ts" },
  { id: "zod", label: "Zod", ext: "ts" },
  { id: "java", label: "Java", ext: "java" },
  { id: "csharp", label: "C#", ext: "cs" },
  { id: "python", label: "Python", ext: "py" },
  { id: "pydantic", label: "Pydantic", ext: "py" },
  { id: "go", label: "Go", ext: "go" },
  { id: "protobuf", label: "Protobuf", ext: "proto" },
  { id: "kotlin", label: "Kotlin", ext: "kt" },
  { id: "swift", label: "Swift", ext: "swift" },
  { id: "rust", label: "Rust", ext: "rs" },
  { id: "sql", label: "SQL", ext: "sql" },
];

/** Includes "diff" / "utils" for first-class tools (not transform OPERATION_ACTIONS menus). */
export type OperationAction =
  | (typeof OPERATION_ACTIONS)[number][1]
  | "format"
  | "beautify"
  | "sort"
  | "sortArrays"
  | "dedup"
  | "removeEmpty"
  | "generateTypes"
  | "diff"
  | "utils";
export type OutputLanguage =
  | "json"
  | "yaml"
  | "xml"
  | "toml"
  | "csv"
  | "sql"
  | "typescript"
  | "javascript"
  | "python"
  | "java"
  | "csharp"
  | "go"
  | "kotlin"
  | "swift"
  | "rust"
  | "plaintext";
export type ThemeMode = "system" | "dark" | "light";
export type ModalKind = "validate" | "diff" | null;
export type RightView = "raw" | "tree" | "graph" | "query" | "table";
export type QuoteStyle = "double" | "single";
export type Tab = {
  id: string;
  label: string;
  num: number;
  renamed?: boolean;
  /** Per-tab custom names for the Left/Right list panes. */
  leftLabel?: string;
  rightLabel?: string;
};
export type FormatOptions = {
  indentation: number;
  quoteStyle: QuoteStyle;
  sortKeys: boolean;
  removeEmpty: boolean;
};

export const EXT_BY_FORMAT: Record<FormatKind, string> = {
  json: "json",
  xml: "xml",
  yaml: "yaml",
  toml: "toml",
  csv: "csv",
};

export const LANGUAGE_BY_TYPE_TARGET: Record<TypeTargetLanguage, OutputLanguage> = {
  typescript: "typescript",
  zod: "typescript",
  sql: "sql",
  java: "java",
  csharp: "csharp",
  python: "python",
  pydantic: "python",
  go: "go",
  protobuf: "plaintext",
  kotlin: "kotlin",
  swift: "swift",
  rust: "rust",
};

export const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
  indentation: 2,
  quoteStyle: "double",
  sortKeys: false,
  removeEmpty: false,
};

/** First-run tips (shown once in the quick-tip toast). */
export const QUICK_TIPS = [
  "Press Ctrl+K (⌘K) to search every tool.",
  "Press ? (or ⌘/) for a full list of keyboard shortcuts.",
  "⌘1–⌘5 switch between Text, Tree, Graph, Query, and Table views.",
  "⌥↑ / ⌥↓ step through your input history like a shell.",
  "Everything runs locally. Your data never leaves the browser.",
  "Share is the only action that can send data off your device, and only the short link does.",
  "Live transform refreshes the output as you type.",
  "Input format is detected for you: JSON, XML, YAML, TOML, CSV, cURL.",
];

/** Output ids: `fmt:<format>`, `type:<language>` (types and SQL) or `op:<action>`. */
export type OutputId = string;

/** Always-visible output chips, in order. Two more "learned" slots follow them. */
export const FIXED_OUTPUT_CHIPS: OutputId[] = ["fmt:json", "fmt:yaml", "fmt:csv", "type:sql"];
export const DEFAULT_LEARNED_CHIPS: OutputId[] = ["type:typescript", "type:zod"];

/** Operations offered under "Schemas and more" in the output picker. */
export const MORE_OPERATIONS: Array<{ id: string; label: string }> = [
  { id: "op:schema", label: "JSON Schema" },
  { id: "op:openapi", label: "OpenAPI spec" },
  { id: "op:validate", label: "Validate against a schema" },
  { id: "op:flatten", label: "Flatten" },
  { id: "op:unflatten", label: "Unflatten" },
  { id: "op:minify", label: "Minify" },
];

export function outputLabel(id: OutputId): string {
  if (id.startsWith("fmt:")) return id.slice(4).toUpperCase();
  if (id.startsWith("type:")) return TYPE_LANGUAGES.find((t) => t.id === id.slice(5))?.label ?? id.slice(5);
  return MORE_OPERATIONS.find((o) => o.id === id)?.label ?? id.slice(3);
}

export type CompareKind = "document" | "list" | "single";
export const COMPARE_KIND_LABELS: Record<CompareKind, string> = {
  list: "Two lists",
  single: "One list",
  document: "Two documents",
};
