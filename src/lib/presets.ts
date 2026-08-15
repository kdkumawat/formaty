/**
 * Lightweight preset ("recipe") definitions.
 *
 * Presets deliberately compose existing workspace actions - they never add new
 * transformation logic. The actual execution lives in WorkspaceContent
 * (it owns runOperation / convert / compare state); this module is the
 * single source of truth for what exists, how to label it, and how to find it
 * from the command palette.
 */

export type PresetId =
  | "flatten-to-csv"
  | "json-to-typescript"
  | "json-to-sql"
  | "api-response-types"
  | "compare-db-exports"
  | "extract-ids-to-sql-in"
  | "dedupe-sort-list"
  | "json-to-yaml"
  | "flatten-json"
  | "validate-against-schema";

export interface Preset {
  id: PresetId;
  label: string;
  description: string;
  keywords: string[];
}

export const PRESETS: Preset[] = [
  {
    id: "flatten-to-csv",
    label: "Recipe: Flatten JSON → CSV",
    description: "Flatten nested JSON to dot-notation, then convert to CSV for spreadsheets.",
    keywords: ["recipe", "flatten", "csv", "spreadsheet", "export", "preset", "pipeline"],
  },
  {
    id: "json-to-typescript",
    label: "Recipe: JSON → TypeScript types",
    description: "Generate TypeScript interfaces from the current input.",
    keywords: ["recipe", "json", "typescript", "types", "interface", "generate"],
  },
  {
    id: "json-to-sql",
    label: "Recipe: JSON → SQL (DDL + seed)",
    description: "Generate CREATE TABLE + INSERT seed statements from JSON data.",
    keywords: ["recipe", "json", "sql", "ddl", "insert", "schema", "database"],
  },
  {
    id: "api-response-types",
    label: "Recipe: API response → Types",
    description: "Generate types from a pasted (or cURL-fetched) API response.",
    keywords: ["recipe", "api", "response", "types", "curl", "generate"],
  },
  {
    id: "compare-db-exports",
    label: "Recipe: Compare DB exports",
    description: "Open List Compare with both sides ready for two result sets.",
    keywords: ["recipe", "compare", "database", "db", "exports", "lists", "reconcile"],
  },
  {
    id: "extract-ids-to-sql-in",
    label: "Recipe: Extract IDs → SQL IN",
    description: "Open List Compare so extracted IDs can be turned into a SQL IN clause.",
    keywords: ["recipe", "extract", "ids", "sql", "in", "list", "compare"],
  },
  {
    id: "dedupe-sort-list",
    label: "Recipe: Dedupe & sort a list",
    description: "Open Single-list mode to deduplicate, count, and sort one list.",
    keywords: ["recipe", "dedupe", "duplicates", "sort", "unique", "list", "count"],
  },
  {
    id: "json-to-yaml",
    label: "Recipe: JSON → YAML",
    description: "Convert the current JSON input to YAML (Kubernetes / CI configs).",
    keywords: ["recipe", "json", "yaml", "convert", "k8s", "kubernetes", "config"],
  },
  {
    id: "flatten-json",
    label: "Recipe: Flatten nested JSON",
    description: "Convert nested JSON objects to dot-notation keys.",
    keywords: ["recipe", "flatten", "dot", "notation", "nested", "json"],
  },
  {
    id: "validate-against-schema",
    label: "Recipe: Validate against JSON Schema",
    description: "Validate the current input against a JSON or YAML schema.",
    keywords: ["recipe", "validate", "schema", "json schema", "ajv", "check"],
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
