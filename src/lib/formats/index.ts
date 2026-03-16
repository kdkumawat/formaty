import type { FormatAdapter, FormatKind, FormatStringifyOptions, InputFormatKind } from "./types";
import { jsonAdapter } from "./jsonParser";
import { xmlAdapter } from "./xmlParser";
import { yamlAdapter } from "./yamlParser";
import { tomlAdapter } from "./tomlParser";
import { csvAdapter } from "./csvParser";
import { detectFormat } from "./detect";

const adapters: Record<FormatKind, FormatAdapter> = {
  json: jsonAdapter,
  xml: xmlAdapter,
  yaml: yamlAdapter,
  toml: tomlAdapter,
  csv: csvAdapter,
};

export type { FormatAdapter, FormatKind, FormatStringifyOptions, InputFormatKind };
export { FORMAT_LABELS, INPUT_FORMAT_LABELS, getInputFormatLabel } from "./types";
export { detectFormat };

export function getAdapter(kind: FormatKind): FormatAdapter {
  return adapters[kind];
}

export function parseInput(input: string, format: FormatKind) {
  return getAdapter(format).parse(input);
}

export function stringifyOutput(
  data: unknown,
  format: FormatKind,
  options?: FormatStringifyOptions,
): string {
  return getAdapter(format).stringify(
    data as Parameters<FormatAdapter["stringify"]>[0],
    options,
  );
}
