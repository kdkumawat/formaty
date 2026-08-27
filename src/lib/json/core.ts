import { XMLBuilder } from "fast-xml-parser";
import { JSONPath } from "jsonpath-plus";
import yaml from "js-yaml";
import {
  flattenJsonIter,
  formatJsonIter,
  getStableKey,
  minifyJsonIter,
  StringBuilder,
  toCsvIter,
  type JsonValue as IterJsonValue,
} from "./streaming";

// Generators live in lib/json/generate/ - re-exported here so existing
// callers (worker, UI, tests) keep importing from a single place.
export {
  generateSql,
  type SqlDialect,
  type SqlGenerateOptions,
} from "./generate/sql";
export {
  generateTypes,
  generateTypeScript,
  type TypeTargetLanguage,
} from "./generate/types";
export { generateOpenApiSpec, inferJsonSchema } from "./generate/schema";
export { toHtmlTable, toMarkdownTable } from "./generate/table";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SearchMode = "key" | "value" | "type" | "jsonpath";

export interface SearchMatch {
  path: string;
  valuePreview: string;
}


/**
 * Convert Python/JS-style single-quoted strings to double-quoted JSON strings.
 * Leaves already double-quoted segments intact; strips trailing commas.
 */
function normalizeLooseJson(input: string): string {
  let out = "";
  let i = 0;
  const n = input.length;
  while (i < n) {
    const c = input[i];
    if (c === '"') {
      out += c;
      i++;
      while (i < n) {
        if (input[i] === "\\") {
          out += input[i] + (input[i + 1] ?? "");
          i += 2;
          continue;
        }
        out += input[i];
        if (input[i] === '"') {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (c === "'") {
      out += '"';
      i++;
      while (i < n) {
        if (input[i] === "\\") {
          const next = input[i + 1];
          if (next === "'") {
            out += "'";
            i += 2;
            continue;
          }
          out += input[i] + (next ?? "");
          i += 2;
          continue;
        }
        if (input[i] === "'") {
          out += '"';
          i++;
          break;
        }
        if (input[i] === '"') {
          out += '\\"';
          i++;
          continue;
        }
        out += input[i];
        i++;
      }
      continue;
    }
    out += c;
    i++;
  }
  return out.replace(/,\s*([\]}])/g, "$1");
}

/** Parse JSON; accepts common loose forms (single quotes, trailing commas). */
export function parseJsonInput(input: string): JsonValue {
  try {
    return JSON.parse(input) as JsonValue;
  } catch (strictErr) {
    try {
      return JSON.parse(normalizeLooseJson(input)) as JsonValue;
    } catch {
      throw strictErr;
    }
  }
}

export interface FormatJsonOptions {
  indentation?: number;
  quoteStyle?: "single" | "double";
  sortKeys?: boolean;
}

function normalizeIndentation(indentation: number | undefined): number {
  if (!Number.isFinite(indentation)) return 2;
  return Math.max(0, Math.min(12, Math.floor(indentation ?? 2)));
}

function toSingleQuotedJsonString(input: string): string {
  return input.replace(/"(?:\\.|[^"\\])*"/g, (token) => {
    const content = token.slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'");
    return `'${content}'`;
  });
}

export function formatJson(input: JsonValue, options?: FormatJsonOptions): string {
  const quoteStyle = options?.quoteStyle ?? "double";
  const indentation = normalizeIndentation(options?.indentation);
  const normalizedInput = options?.sortKeys ? sortKeysDeep(input) : input;
  const formatted = formatJsonIter(normalizedInput as IterJsonValue, indentation);
  if (quoteStyle === "single") {
    return toSingleQuotedJsonString(formatted);
  }
  return formatted;
}

export function minifyJson(input: JsonValue): string {
  return minifyJsonIter(input as IterJsonValue);
}

export function sortKeysDeep(input: JsonValue): JsonValue {
  if (Array.isArray(input)) {
    return input.map(sortKeysDeep);
  }
  if (input && typeof input === "object") {
    const next: Record<string, JsonValue> = {};
    Object.keys(input)
      .sort((a, b) => a.localeCompare(b))
      .forEach((key) => {
        next[key] = sortKeysDeep((input as Record<string, JsonValue>)[key]);
      });
    return next;
  }
  return input;
}

export function removeEmptyDeep(input: JsonValue): JsonValue {
  if (Array.isArray(input)) {
    return input
      .map(removeEmptyDeep)
      .filter((v) => !(v === null || v === "" || v === undefined));
  }
  if (input && typeof input === "object") {
    const next: Record<string, JsonValue> = {};
    Object.entries(input as Record<string, JsonValue>).forEach(([key, value]) => {
      const cleaned = removeEmptyDeep(value);
      if (
        cleaned !== null &&
        cleaned !== "" &&
        cleaned !== undefined &&
        !(Array.isArray(cleaned) && cleaned.length === 0) &&
        !(
          typeof cleaned === "object" &&
          !Array.isArray(cleaned) &&
          Object.keys(cleaned).length === 0
        )
      ) {
        next[key] = cleaned;
      }
    });
    return next;
  }
  return input;
}

export function sortArraysDeep(input: JsonValue): JsonValue {
  if (Array.isArray(input)) {
    const processed = input.map(sortArraysDeep) as IterJsonValue[];
    const cache = new WeakMap<object, string>();
    return processed.sort((a, b) => getStableKey(a, cache).localeCompare(getStableKey(b, cache)));
  }
  if (input && typeof input === "object") {
    const next: Record<string, JsonValue> = {};
    Object.entries(input as Record<string, JsonValue>).forEach(([key, value]) => {
      next[key] = sortArraysDeep(value);
    });
    return next;
  }
  return input;
}

export function deduplicateArraysDeep(input: JsonValue): JsonValue {
  if (Array.isArray(input)) {
    const processed = input.map(deduplicateArraysDeep);
    const cache = new WeakMap<object, string>();
    const seen = new Set<string>();
    return processed.filter((item) => {
      const key = getStableKey(item as IterJsonValue, cache);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  if (input && typeof input === "object") {
    const next: Record<string, JsonValue> = {};
    Object.entries(input as Record<string, JsonValue>).forEach(([key, value]) => {
      next[key] = deduplicateArraysDeep(value);
    });
    return next;
  }
  return input;
}

export function flattenJson(input: JsonValue, prefix = ""): Record<string, JsonValue> {
  return flattenJsonIter(input as IterJsonValue, prefix);
}

export function unflattenJson(flat: Record<string, JsonValue>): JsonValue {
  const result: Record<string, JsonValue> = {};
  Object.entries(flat).forEach(([path, value]) => {
    const parts = path.split(".");
    let current: Record<string, JsonValue> | JsonValue[] = result;
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const nextPart = parts[index + 1];
      const keyIsIndex = /^\d+$/.test(part);
      const nextIsIndex = !!nextPart && /^\d+$/.test(nextPart);

      if (isLast) {
        if (Array.isArray(current)) {
          current[Number(part)] = value;
        } else {
          current[part] = value;
        }
        return;
      }

      if (Array.isArray(current)) {
        const idx = Number(part);
        if (current[idx] === undefined) {
          current[idx] = nextIsIndex ? [] : {};
        }
        current = current[idx] as Record<string, JsonValue> | JsonValue[];
      } else if (keyIsIndex) {
        const idx = Number(part);
        const existing = current[idx as unknown as keyof typeof current];
        if (!Array.isArray(existing)) {
          current[idx as unknown as keyof typeof current] = nextIsIndex ? [] : {};
        }
        current = current[idx as unknown as keyof typeof current] as Record<
          string,
          JsonValue
        > | JsonValue[];
      } else {
        if (current[part] === undefined) {
          current[part] = nextIsIndex ? [] : {};
        }
        current = current[part] as Record<string, JsonValue> | JsonValue[];
      }
    });
  });
  return result;
}

function pathPreview(path: string[], token: string, type: "key" | "index"): string {
  if (type === "index") {
    return `${path.join("")}[${token}]`;
  }
  return `${path.join("")}${path.length ? "." : ""}${token}`;
}

function valuePreview(value: JsonValue): string {
  if (typeof value === "string") return value.slice(0, 80);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "null";
  if (Array.isArray(value)) return `[Array(${value.length})]`;
  return "{Object}";
}

export function searchJson(
  input: JsonValue,
  query: string,
  mode: SearchMode,
  caseSensitive: boolean,
): SearchMatch[] {
  if (!query.trim()) return [];
  if (mode === "jsonpath") {
    try {
      const paths = JSONPath({
        path: query,
        json: input,
        resultType: "path",
      }) as string[];
      return paths.map((p) => ({ path: p, valuePreview: "JSONPath match" }));
    } catch {
      return [];
    }
  }

  const normalizedQuery = caseSensitive ? query : query.toLowerCase();
  const matches: SearchMatch[] = [];

  const visit = (value: JsonValue, path: string[]) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const p = pathPreview(path, String(index), "index");
        if (mode === "type") {
          const t = Array.isArray(item) ? "array" : item === null ? "null" : typeof item;
          if ((caseSensitive ? t : t.toLowerCase()).includes(normalizedQuery)) {
            matches.push({ path: p, valuePreview: valuePreview(item) });
          }
        } else if (mode === "value") {
          const target = valuePreview(item);
          if ((caseSensitive ? target : target.toLowerCase()).includes(normalizedQuery)) {
            matches.push({ path: p, valuePreview: target });
          }
        }
        visit(item, [...path, `[${index}]`]);
      });
      return;
    }

    if (value && typeof value === "object") {
      Object.entries(value).forEach(([key, nestedValue]) => {
        const p = pathPreview(path, key, "key");
        if (mode === "key") {
          const target = caseSensitive ? key : key.toLowerCase();
          if (target.includes(normalizedQuery)) {
            matches.push({ path: p, valuePreview: valuePreview(nestedValue) });
          }
        }
        if (mode === "value") {
          const target = valuePreview(nestedValue);
          if ((caseSensitive ? target : target.toLowerCase()).includes(normalizedQuery)) {
            matches.push({ path: p, valuePreview: target });
          }
        }
        if (mode === "type") {
          const t = Array.isArray(nestedValue)
            ? "array"
            : nestedValue === null
              ? "null"
              : typeof nestedValue;
          if ((caseSensitive ? t : t.toLowerCase()).includes(normalizedQuery)) {
            matches.push({ path: p, valuePreview: t });
          }
        }
        visit(nestedValue, [...path, key]);
      });
    }
  };

  visit(input, []);
  return matches.slice(0, 5000);
}

export function toYaml(input: JsonValue): string {
  return yaml.dump(input);
}

export function toXml(input: JsonValue): string {
  const builder = new XMLBuilder({ format: true });
  return builder.build({ root: input as object });
}

export function toCsv(input: JsonValue, delimiter = ","): string {
  const rows = Array.isArray(input)
    ? input
    : typeof input === "object" && input !== null
      ? [input]
      : [{ value: input }];
  const headers = Array.from(
    new Set(rows.flatMap((item) => Object.keys(item as Record<string, JsonValue>))),
  );
  const lines = [
    headers.join(delimiter),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = (row as Record<string, JsonValue>)[header];
          const serialized =
            value === null || value === undefined
              ? ""
              : typeof value === "object"
                ? JSON.stringify(value)
                : String(value);
          return `"${serialized.replace(/"/g, '""')}"`;
        })
        .join(delimiter),
    ),
  ];
  return lines.join("\n");
}

