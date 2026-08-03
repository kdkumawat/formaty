/** Parse, compare, and format two lists/sets for SQL IN and similar exports. */

export type ListDelimiter = "auto" | "newline" | "comma" | "semicolon" | "pipe" | "whitespace" | "json";

export type ListSortMode = "none" | "asc" | "desc" | "numeric-asc" | "numeric-desc" | "frequency";

export type ListExportFormat =
  | "sql-in-single"
  | "sql-in-double"
  | "sql-in-unquoted"
  | "sql-values"
  | "json-array"
  | "json-array-numbers"
  | "newline"
  | "comma"
  | "comma-space"
  | "pipe"
  | "tsv"
  | "csv-quoted"
  | "yaml-list"
  | "regex-alt"
  | "js-array-single"
  | "js-array-double"
  | "python-list"
  | "raw";

export type ListBucket = "common" | "leftOnly" | "rightOnly" | "union" | "symmetric" | "leftDupes" | "rightDupes";

export interface ListParseOptions {
  delimiter: ListDelimiter;
  trim: boolean;
  ignoreEmpty: boolean;
  caseInsensitive: boolean;
  /** Strip one layer of matching '...' or "..." around items. */
  stripQuotes: boolean;
  /** Treat "01" and 1 as the same key when both parse as numbers. */
  numericNormalize: boolean;
}

export interface ListItem {
  /** Display value (first-seen original form for this key). */
  value: string;
  /** Normalized key used for set membership. */
  key: string;
  count: number;
}

export interface ListSideResult {
  items: ListItem[];
  /** Total raw tokens after parse (before unique). */
  rawCount: number;
  uniqueCount: number;
}

export interface ListCompareResult {
  left: ListSideResult;
  right: ListSideResult;
  common: ListItem[];
  leftOnly: ListItem[];
  rightOnly: ListItem[];
  union: ListItem[];
  symmetric: ListItem[];
  leftDupes: ListItem[];
  rightDupes: ListItem[];
  stats: {
    common: number;
    leftOnly: number;
    rightOnly: number;
    union: number;
    symmetric: number;
    leftDupes: number;
    rightDupes: number;
  };
}

export const DEFAULT_LIST_PARSE_OPTIONS: ListParseOptions = {
  delimiter: "auto",
  trim: true,
  ignoreEmpty: true,
  caseInsensitive: false,
  stripQuotes: true,
  numericNormalize: false,
};

const EXPORT_LABELS: Record<ListExportFormat, string> = {
  "sql-in-single": "SQL IN ('…')",
  "sql-in-double": 'SQL IN ("…")',
  "sql-in-unquoted": "SQL IN (numbers)",
  "sql-values": "SQL VALUES rows",
  "json-array": "JSON array (strings)",
  "json-array-numbers": "JSON array (numbers if possible)",
  newline: "Newline separated",
  comma: "Comma separated",
  "comma-space": "Comma + space",
  pipe: "Pipe separated",
  tsv: "Tab separated",
  "csv-quoted": "CSV quoted",
  "yaml-list": "YAML list",
  "regex-alt": "Regex alternation",
  "js-array-single": "JS/TS array (single quotes)",
  "js-array-double": "JS/TS array (double quotes)",
  "python-list": "Python list",
  raw: "Raw (one per line)",
};

export function listExportFormatLabel(fmt: ListExportFormat): string {
  return EXPORT_LABELS[fmt];
}

export const LIST_EXPORT_FORMATS = Object.keys(EXPORT_LABELS) as ListExportFormat[];

function stripOuterQuotes(s: string): string {
  if (s.length >= 2) {
    const a = s[0];
    const b = s[s.length - 1];
    if ((a === "'" && b === "'") || (a === '"' && b === '"') || (a === "`" && b === "`")) {
      return s.slice(1, -1);
    }
  }
  return s;
}

function detectDelimiter(text: string): Exclude<ListDelimiter, "auto" | "json"> {
  const t = text.trim();
  if (!t) return "newline";
  // JSON array?
  if ((t.startsWith("[") && t.endsWith("]")) || (t.startsWith("{") && t.endsWith("}"))) {
    // caller may try json first
  }
  const newlines = (t.match(/\r?\n/g) ?? []).length;
  if (newlines >= 1) return "newline";
  const semis = (t.match(/;/g) ?? []).length;
  const pipes = (t.match(/\|/g) ?? []).length;
  const commas = (t.match(/,/g) ?? []).length;
  if (semis >= 1 && semis >= commas && semis >= pipes) return "semicolon";
  if (pipes >= 1 && pipes >= commas) return "pipe";
  if (commas >= 1) return "comma";
  if (/\s{2,}|\t/.test(t)) return "whitespace";
  return "newline";
}

function tryParseJsonArray(text: string): string[] | null {
  const t = text.trim();
  if (!t) return null;
  try {
    const parsed = JSON.parse(t) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((v) => {
        if (v === null || v === undefined) return "";
        if (typeof v === "string") return v;
        if (typeof v === "number" || typeof v === "boolean") return String(v);
        return JSON.stringify(v);
      });
    }
    // Single object → no list
    return null;
  } catch {
    return null;
  }
}

function splitByDelimiter(text: string, delimiter: Exclude<ListDelimiter, "auto" | "json">): string[] {
  switch (delimiter) {
    case "newline":
      return text.split(/\r?\n/);
    case "comma":
      // respect simple quoted segments
      return splitRespectingQuotes(text, ",");
    case "semicolon":
      return splitRespectingQuotes(text, ";");
    case "pipe":
      return text.split("|");
    case "whitespace":
      return text.split(/\s+/);
    default:
      return text.split(/\r?\n/);
  }
}

/** Split on delimiter but keep content inside single/double quotes. */
function splitRespectingQuotes(text: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quote: "'" | '"' | null = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === delim) {
      out.push(cur);
      cur = "";
      continue;
    }
    // treat newlines as separators when using comma/semicolon lists pasted with wraps
    if ((delim === "," || delim === ";") && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export function parseListText(text: string, options: ListParseOptions): string[] {
  const t = text ?? "";
  if (!t.trim()) return [];

  let raw: string[] = [];

  if (options.delimiter === "json") {
    raw = tryParseJsonArray(t) ?? [];
  } else if (options.delimiter === "auto") {
    const asJson = tryParseJsonArray(t);
    if (asJson) raw = asJson;
    else raw = splitByDelimiter(t, detectDelimiter(t));
  } else {
    raw = splitByDelimiter(t, options.delimiter);
  }

  const out: string[] = [];
  for (let item of raw) {
    if (options.trim) item = item.trim();
    if (options.stripQuotes) item = stripOuterQuotes(item);
    if (options.trim) item = item.trim();
    if (options.ignoreEmpty && item === "") continue;
    out.push(item);
  }
  return out;
}

export function normalizeListKey(value: string, options: ListParseOptions): string {
  let v = value;
  if (options.trim) v = v.trim();
  if (options.caseInsensitive) v = v.toLowerCase();
  if (options.numericNormalize) {
    const t = v.trim();
    if (t !== "" && /^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(t)) {
      const n = Number(t);
      if (Number.isFinite(n)) v = String(n);
    }
  }
  return v;
}

function buildSide(values: string[], options: ListParseOptions): ListSideResult {
  const map = new Map<string, ListItem>();
  for (const value of values) {
    const key = normalizeListKey(value, options);
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { value, key, count: 1 });
    }
  }
  const items = Array.from(map.values());
  return {
    items,
    rawCount: values.length,
    uniqueCount: items.length,
  };
}

export function compareLists(
  leftText: string,
  rightText: string,
  options: ListParseOptions = DEFAULT_LIST_PARSE_OPTIONS,
): ListCompareResult {
  const leftValues = parseListText(leftText, options);
  const rightValues = parseListText(rightText, options);
  const left = buildSide(leftValues, options);
  const right = buildSide(rightValues, options);

  const leftMap = new Map(left.items.map((i) => [i.key, i]));
  const rightMap = new Map(right.items.map((i) => [i.key, i]));

  const common: ListItem[] = [];
  const leftOnly: ListItem[] = [];
  const rightOnly: ListItem[] = [];
  const union: ListItem[] = [];

  for (const item of left.items) {
    union.push(item);
    if (rightMap.has(item.key)) {
      // Prefer left's display value for common
      common.push(item);
    } else {
      leftOnly.push(item);
    }
  }
  for (const item of right.items) {
    if (!leftMap.has(item.key)) {
      rightOnly.push(item);
      union.push(item);
    }
  }

  const symmetric = [...leftOnly, ...rightOnly];
  const leftDupes = left.items.filter((i) => i.count > 1);
  const rightDupes = right.items.filter((i) => i.count > 1);

  return {
    left,
    right,
    common,
    leftOnly,
    rightOnly,
    union,
    symmetric,
    leftDupes,
    rightDupes,
    stats: {
      common: common.length,
      leftOnly: leftOnly.length,
      rightOnly: rightOnly.length,
      union: union.length,
      symmetric: symmetric.length,
      leftDupes: leftDupes.length,
      rightDupes: rightDupes.length,
    },
  };
}

function compareNumeric(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  const aNum = a.trim() !== "" && Number.isFinite(na);
  const bNum = b.trim() !== "" && Number.isFinite(nb);
  if (aNum && bNum) return na - nb;
  if (aNum) return -1;
  if (bNum) return 1;
  return a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
}

export function sortListItems(items: ListItem[], mode: ListSortMode): ListItem[] {
  if (mode === "none") return items;
  const copy = [...items];
  switch (mode) {
    case "asc":
      return copy.sort((a, b) => a.value.localeCompare(b.value, undefined, { sensitivity: "base", numeric: true }));
    case "desc":
      return copy.sort((a, b) => b.value.localeCompare(a.value, undefined, { sensitivity: "base", numeric: true }));
    case "numeric-asc":
      return copy.sort((a, b) => compareNumeric(a.value, b.value));
    case "numeric-desc":
      return copy.sort((a, b) => compareNumeric(b.value, a.value));
    case "frequency":
      return copy.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    default:
      return copy;
  }
}

/** Sort raw list text (preserves multiset / all tokens) and rejoin with newlines. */
export function sortListText(
  text: string,
  options: ListParseOptions = DEFAULT_LIST_PARSE_OPTIONS,
  sortMode: ListSortMode = "asc",
): string {
  if (sortMode === "none") return text;
  const values = parseListText(text, options);
  if (values.length === 0) return text.trim() ? text : "";
  // Frequency needs counts first
  if (sortMode === "frequency") {
    const side = buildSide(values, options);
    const byKey = new Map(side.items.map((i) => [i.key, i.count]));
    const items = values.map((value) => ({
      value,
      key: normalizeListKey(value, options),
      count: byKey.get(normalizeListKey(value, options)) ?? 1,
    }));
    return sortListItems(items, "frequency").map((i) => i.value).join("\n");
  }
  const items = values.map((value) => ({
    value,
    key: normalizeListKey(value, options),
    count: 1,
  }));
  return sortListItems(items, sortMode).map((i) => i.value).join("\n");
}

export function getBucketItems(result: ListCompareResult, bucket: ListBucket): ListItem[] {
  switch (bucket) {
    case "common":
      return result.common;
    case "leftOnly":
      return result.leftOnly;
    case "rightOnly":
      return result.rightOnly;
    case "union":
      return result.union;
    case "symmetric":
      return result.symmetric;
    case "leftDupes":
      return result.leftDupes;
    case "rightDupes":
      return result.rightDupes;
    default:
      return [];
  }
}

function escapeSqlSingle(s: string): string {
  return s.replace(/'/g, "''");
}

function escapeSqlDouble(s: string): string {
  return s.replace(/"/g, '""');
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeJsSingle(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function escapeJsDouble(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function tryAsNumber(s: string): number | null {
  const t = s.trim();
  if (t === "" || !/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function formatListItems(
  items: ListItem[],
  format: ListExportFormat,
  sortMode: ListSortMode = "none",
): string {
  const sorted = sortListItems(items, sortMode);
  const values = sorted.map((i) => i.value);
  if (values.length === 0) return "";

  switch (format) {
    case "sql-in-single":
      return values.map((v) => `'${escapeSqlSingle(v)}'`).join(", ");
    case "sql-in-double":
      return values.map((v) => `"${escapeSqlDouble(v)}"`).join(", ");
    case "sql-in-unquoted":
      return values
        .map((v) => {
          const n = tryAsNumber(v);
          return n !== null ? String(n) : `'${escapeSqlSingle(v)}'`;
        })
        .join(", ");
    case "sql-values":
      return values.map((v) => `('${escapeSqlSingle(v)}')`).join(",\n");
    case "json-array":
      return JSON.stringify(values, null, 2);
    case "json-array-numbers":
      return JSON.stringify(
        values.map((v) => {
          const n = tryAsNumber(v);
          return n !== null ? n : v;
        }),
        null,
        2,
      );
    case "newline":
    case "raw":
      return values.join("\n");
    case "comma":
      return values.join(",");
    case "comma-space":
      return values.join(", ");
    case "pipe":
      return values.join("|");
    case "tsv":
      return values.join("\t");
    case "csv-quoted":
      return values.map((v) => `"${v.replace(/"/g, '""')}"`).join(",");
    case "yaml-list":
      return values
        .map((v) => {
          if (/[:#\n\r'"]/.test(v) || v.trim() !== v) return `- ${JSON.stringify(v)}`;
          return `- ${v}`;
        })
        .join("\n");
    case "regex-alt":
      return values.map(escapeRegex).join("|");
    case "js-array-single":
      return `[${values.map((v) => `'${escapeJsSingle(v)}'`).join(", ")}]`;
    case "js-array-double":
      return `[${values.map((v) => `"${escapeJsDouble(v)}"`).join(", ")}]`;
    case "python-list":
      return `[${values.map((v) => JSON.stringify(v)).join(", ")}]`;
    default:
      return values.join("\n");
  }
}

/** Wrap for a full SQL snippet when useful. */
export function formatSqlInClause(
  items: ListItem[],
  opts: {
    column?: string;
    quote: "single" | "double" | "none";
    sortMode?: ListSortMode;
    notIn?: boolean;
  },
): string {
  const format: ListExportFormat =
    opts.quote === "single" ? "sql-in-single" : opts.quote === "double" ? "sql-in-double" : "sql-in-unquoted";
  const body = formatListItems(items, format, opts.sortMode ?? "none");
  const col = opts.column?.trim() || "id";
  const op = opts.notIn ? "NOT IN" : "IN";
  if (!body) return `-- empty list\n-- ${col} ${op} ()`;
  return `${col} ${op} (${body})`;
}

export const BUCKET_LABELS: Record<ListBucket, string> = {
  common: "Common",
  leftOnly: "Only left",
  rightOnly: "Only right",
  union: "Union",
  symmetric: "Symmetric diff",
  leftDupes: "Left duplicates",
  rightDupes: "Right duplicates",
};
