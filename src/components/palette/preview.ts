import { parseInput, stringifyOutput, type FormatKind } from "@/lib/formats";
import {
  flattenJson,
  generateSql,
  generateTypes,
  inferJsonSchema,
  minifyJson,
  type JsonValue,
  type TypeTargetLanguage,
} from "@/lib/json/core";
import type { HighlightLang } from "@/lib/highlight";

export interface CommandPreview {
  code: string;
  lang: HighlightLang;
}

export const PREVIEW_MAX_INPUT = 20_000;
export const PREVIEW_MAX_LINES = 40;

const CODE_LANG: Partial<Record<TypeTargetLanguage, HighlightLang>> = { sql: "sql" };

/**
 * A short sample of what the active tab's input becomes for an output id (`fmt:yaml`, `type:go`, `op:schema`...).
 * Pure and synchronous; callers invoke it only for the highlighted command. Returns null when it cannot be previewed.
 */
export function previewOutput(input: string, inputFormat: FormatKind | "curl", target: string): CommandPreview | null {
  if (!input.trim() || inputFormat === "curl") return null;
  try {
    const data = parseInput(input.slice(0, PREVIEW_MAX_INPUT), inputFormat) as JsonValue;
    let code: string;
    let lang: HighlightLang;
    if (target.startsWith("fmt:")) {
      lang = target.slice(4) as FormatKind;
      code = stringifyOutput(data, lang);
    } else if (target.startsWith("type:")) {
      const t = target.slice(5) as TypeTargetLanguage;
      lang = CODE_LANG[t] ?? "code";
      code = t === "sql" ? generateSql(data, { dialect: "sqlite" }) : generateTypes(data, t);
    } else if (target === "op:schema") {
      lang = "json";
      code = JSON.stringify(inferJsonSchema(data), null, 2);
    } else if (target === "op:flatten") {
      lang = "json";
      code = JSON.stringify(flattenJson(data), null, 2);
    } else if (target === "op:minify") {
      lang = "json";
      code = minifyJson(data);
    } else return null;
    const lines = code.split("\n");
    if (lines.length > PREVIEW_MAX_LINES) code = `${lines.slice(0, PREVIEW_MAX_LINES).join("\n")}\n…`;
    return { code, lang };
  } catch {
    return null;
  }
}
