import type { JsonValue } from "@/lib/json/core";

export type FormatKind = "json" | "xml" | "yaml" | "toml" | "csv";

/** Input-only format: curl is executed to fetch response, not parsed. */
export type InputFormatKind = FormatKind | "curl";

export interface FormatStringifyOptions {
  indentation?: number;
  quoteStyle?: "single" | "double";
  sortKeys?: boolean;
  minify?: boolean;
  csvDelimiter?: string;
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

export const INPUT_FORMAT_LABELS: Record<InputFormatKind, string> = {
  ...FORMAT_LABELS,
  curl: "cURL",
};

export function getInputFormatLabel(fmt: InputFormatKind): string {
  return INPUT_FORMAT_LABELS[fmt];
}
