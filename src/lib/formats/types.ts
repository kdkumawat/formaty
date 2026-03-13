import type { JsonValue } from "@/lib/json/core";

export type FormatKind = "json" | "xml" | "yaml" | "toml" | "csv";

export interface FormatStringifyOptions {
  indentation?: number;
  quoteStyle?: "single" | "double";
  sortKeys?: boolean;
}

export interface FormatAdapter {
  kind: FormatKind;
  parse(input: string): JsonValue;
  stringify(data: JsonValue, options?: FormatStringifyOptions): string;
}

export const FORMAT_LABELS: Record<FormatKind, string> = {
  json: "JSON",
  xml: "XML",
  yaml: "YAML",
  toml: "TOML",
  csv: "CSV",
};
