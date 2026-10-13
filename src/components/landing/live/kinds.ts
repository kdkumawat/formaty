import type { InputFormatKind } from "@/lib/formats";
import type { CurlTargetId } from "@/lib/curl/codegen";
import type { ListBucket, ListExportFormat } from "@/lib/json/listCompare";
import type { UtilTab } from "@/lib/utils/devtools";

/**
 * Which demo scene a tool page gets, and where that scene starts. Pure data, no imports of the heavy
 * logic, so the server page can compute it; `kinds.test.ts` fails when a route maps to nothing.
 *
 * - transform: the hero's Transform scene, started on this page's input and output.
 * - compare: the hero's Compare scene, started on two lists, one list, or CSV.
 * - util: the playground's Utils area, opened on this utility.
 * - custom: tools whose playground view is bound to Monaco (query, diff, validate) or to a request
 *   (cURL code): a small scene with the same headers and controls.
 */
export type CustomTool = "query" | "curl" | "diff" | "validate";

export type LiveSpec =
  | { kind: "static" }
  | { kind: "transform"; override: InputFormatKind | null; sel: string; raw?: boolean }
  | { kind: "compare"; mode: "list" | "single"; bucket: ListBucket; format: ListExportFormat }
  | { kind: "util"; util: UtilTab }
  | { kind: "custom"; tool: CustomTool; target?: CurlTargetId };

/** Routes that deliberately keep the static example: they need a viewer or a network request. */
export const STATIC_ROUTES = ["json-viewer", "graph-viewer", "api-import"];

const FORMATS = ["json", "xml", "yaml", "toml", "csv"] as const;
const TYPES: Record<string, string> = {
  "json-to-typescript": "typescript",
  "json-to-zod": "zod",
  "json-to-go": "go",
  "json-to-python": "python",
  "json-to-pydantic": "pydantic",
  "json-to-java": "java",
  "json-to-csharp": "csharp",
  "json-to-protobuf": "protobuf",
  "json-to-sql": "sql",
};
const CURL: Record<string, CurlTargetId> = {
  "curl-to-fetch": "fetch",
  "curl-to-axios": "axios",
  "curl-to-python": "python",
  "curl-to-go": "go",
};
const OPS: Record<string, string> = {
  "schema-generator": "op:schema",
  "json-flattener": "op:flatten",
};
const CUSTOM: Record<string, CustomTool> = {
  "jsonpath-tester": "query",
  "json-diff": "diff",
  "json-schema-validator": "validate",
};
const LISTS: Record<string, { mode: "list" | "single"; bucket: ListBucket; format: ListExportFormat }> = {
  "compare-lists": { mode: "list", bucket: "leftOnly", format: "newline" },
  "compare-ids": { mode: "list", bucket: "leftOnly", format: "newline" },
  "compare-csv": { mode: "list", bucket: "changed", format: "newline" },
  "csv-column-compare": { mode: "list", bucket: "leftOnly", format: "newline" },
  "find-duplicates-in-list": { mode: "single", bucket: "leftOnly", format: "newline" },
  "sql-in-clause-generator": { mode: "list", bucket: "leftOnly", format: "sql-in-single" },
  "sql-values-generator": { mode: "list", bucket: "leftOnly", format: "sql-values" },
};

/** `util` is the page's Utils tool (from UTIL_PAGES); pass it for /utils pages. */
export function resolveLive(route: string, util?: UtilTab): LiveSpec {
  if (util) return { kind: "util", util };
  const conv = route.match(/^(json|xml|yaml|toml|csv)-to-(json|xml|yaml|toml|csv)$/);
  if (conv && conv[1] !== conv[2]) return { kind: "transform", override: conv[1] === "json" ? null : (conv[1] as InputFormatKind), sel: `fmt:${conv[2]}` };
  const fmt = route.match(/^(json|xml|yaml|toml|csv)-formatter$/);
  // The input is left unformatted on purpose, so the result shows a change.
  if (fmt && FORMATS.includes(fmt[1] as (typeof FORMATS)[number])) {
    return { kind: "transform", override: fmt[1] === "json" ? null : (fmt[1] as InputFormatKind), sel: `fmt:${fmt[1]}`, raw: true };
  }
  if (TYPES[route]) return { kind: "transform", override: null, sel: `type:${TYPES[route]}` };
  if (OPS[route]) return { kind: "transform", override: null, sel: OPS[route] };
  if (LISTS[route]) return { kind: "compare", ...LISTS[route] };
  if (CUSTOM[route]) return { kind: "custom", tool: CUSTOM[route] };
  if (CURL[route]) return { kind: "custom", tool: "curl", target: CURL[route] };
  return { kind: "static" };
}

export interface Opt { id: string; label: string }

/** Choices shown above the result of a custom scene, and the one selected first. */
export function optionsFor(spec: LiveSpec): { options: Opt[]; initial: string } {
  if (spec.kind !== "custom") return { options: [], initial: "" };
  if (spec.tool === "query") {
    return { options: [{ id: "jsonpath", label: "JSONPath" }, { id: "jmespath", label: "JMESPath" }], initial: "jsonpath" };
  }
  if (spec.tool === "curl") {
    return {
      options: [{ id: "fetch", label: "fetch" }, { id: "axios", label: "Axios" }, { id: "python", label: "Python" }, { id: "go", label: "Go" }],
      initial: spec.target ?? "fetch",
    };
  }
  return { options: [], initial: "" };
}

export const QUERY_DOC = JSON.stringify(
  {
    store: {
      book: [
        { title: "Sayings of the Century", price: 8.95 },
        { title: "Sword of Honour", price: 12.99 },
        { title: "Moby Dick", price: 8.99 },
      ],
    },
  },
  null,
  2,
);

/** Pretty-prints JSON so the page looks like real work; anything else is returned as is. */
function pretty(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}

/** Starting text for a page: the example from seo.ts, or the preset where the example is prose. */
export function initialInputs(
  spec: LiveSpec,
  cfg: { inputExample: string },
  preset: { input?: string; diffLeftInput?: string; diffRightInput?: string; schemaText?: string },
): { a: string; b: string } {
  switch (spec.kind) {
    case "transform": return { a: spec.raw ? cfg.inputExample : pretty(cfg.inputExample), b: "" };
    case "compare": return { a: preset.diffLeftInput ?? "", b: preset.diffRightInput ?? "" };
    case "custom":
      if (spec.tool === "query") return { a: QUERY_DOC, b: cfg.inputExample };
      if (spec.tool === "diff") return { a: pretty(preset.diffLeftInput ?? ""), b: pretty(preset.diffRightInput ?? "") };
      if (spec.tool === "validate") return { a: pretty(preset.input ?? ""), b: pretty(preset.schemaText ?? "") };
      return { a: cfg.inputExample, b: "" };
    default: return { a: cfg.inputExample, b: "" };
  }
}
