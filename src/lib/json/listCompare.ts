/** Parse, compare, and format two lists/sets for SQL IN and similar exports. */

export type ListDelimiter = "auto" | "newline" | "comma" | "semicolon" | "pipe" | "whitespace" | "json";

export type ListSortMode = "none" | "asc" | "desc" | "numeric-asc" | "numeric-desc" | "frequency";

export type ListExportFormat =
  | "sql-in-single"
  | "sql-not-in"
  | "sql-in-double"
  | "sql-in-unquoted"
  | "sql-values"
  | "sql-array"
  | "json-array"
  | "json-array-numbers"
  | "newline"
  | "comma"
  | "comma-space"
  | "comma-double-quotes"
  | "pipe"
  | "tsv"
  | "csv-quoted"
  | "yaml-list"
  | "regex-alt"
  | "js-array-single"
  | "js-array-double"
  | "python-list"
  | "go-slice"
  | "markdown-table"
  | "html-table"
  | "raw";

export type ListBucket =
  | "common"
  | "leftOnly"
  | "rightOnly"
  | "union"
  | "symmetric"
  | "leftDupes"
  | "rightDupes"
  | "changed"
  | "summary";

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
  /** Keys present on both sides whose full row/record differs (CSV column compare). */
  changed: ListItem[];
  stats: {
    common: number;
    leftOnly: number;
    rightOnly: number;
    union: number;
    symmetric: number;
    leftDupes: number;
    rightDupes: number;
    changed: number;
  };
}

export interface SingleListAnalysis {
  /** Unique items (first-seen order), each with occurrence count. */
  unique: ListItem[];
  /** Items that appear more than once. */
  duplicates: ListItem[];
  /** All unique items sorted by count (desc) then value. */
  counts: ListItem[];
  /** Total raw tokens after parsing (before dedupe). */
  rawCount: number;
  uniqueCount: number;
  /** Number of distinct keys with count > 1. */
  duplicateKeys: number;
  /** Sum of (count - 1) over duplicate keys. */
  duplicateOccurrences: number;
}

/**
 * Default parse options preserve exact values: nothing is trimmed or
 * quote-stripped unless the user opts in via the Compare settings.
 */
export const DEFAULT_LIST_PARSE_OPTIONS: ListParseOptions = {
  delimiter: "auto",
  trim: false,
  ignoreEmpty: true,
  caseInsensitive: false,
  stripQuotes: false,
  numericNormalize: false,
};

const EXPORT_LABELS: Record<ListExportFormat, string> = {
  "sql-in-single": "SQL IN ('…')",
  "sql-not-in": "SQL NOT IN ('…')",
  "sql-in-double": 'SQL IN ("…")',
  "sql-in-unquoted": "SQL IN (numbers)",
  "sql-values": "SQL VALUES rows",
  "sql-array": "PostgreSQL ARRAY[...]",
  "json-array": "JSON array (strings)",
  "json-array-numbers": "JSON array (numbers if possible)",
  newline: "Newline separated",
  comma: "Comma separated",
  "comma-space": "Comma + space",
  "comma-double-quotes": "Comma + double quotes",
  pipe: "Pipe separated",
  tsv: "Tab separated",
  "csv-quoted": "CSV quoted",
  "yaml-list": "YAML list",
  "regex-alt": "Regex alternation",
  "js-array-single": "JS/TS array (single quotes)",
  "js-array-double": "JS/TS array (double quotes)",
  "python-list": "Python list",
  "go-slice": "Go slice",
  "markdown-table": "Markdown table",
  "html-table": "HTML table",
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
    // Filled by CSV column compare (row-level changes); empty for plain lists.
    changed: [],
    stats: {
      common: common.length,
      leftOnly: leftOnly.length,
      rightOnly: rightOnly.length,
      union: union.length,
      symmetric: symmetric.length,
      leftDupes: leftDupes.length,
      rightDupes: rightDupes.length,
      changed: 0,
    },
  };
}

export interface CountDelta {
  /** Display value (left's form when both sides have it). */
  value: string;
  key: string;
  left: number;
  right: number;
  /** right - left (positive = extra on the right). */
  delta: number;
}

/**
 * Keys present on both sides with different occurrence counts. Used by the
 * count-aware comparison and by the Summary report's inline delta notes.
 */
export function computeCountDeltas(result: ListCompareResult): CountDelta[] {
  const leftMap = new Map(result.left.items.map((i) => [i.key, i.count]));
  const rightMap = new Map(result.right.items.map((i) => [i.key, i.count]));
  const countDeltas: CountDelta[] = [];
  for (const item of result.common) {
    const left = leftMap.get(item.key) ?? 0;
    const right = rightMap.get(item.key) ?? 0;
    if (left !== right) {
      countDeltas.push({ value: item.value, key: item.key, left, right, delta: right - left });
    }
  }
  return countDeltas;
}

/**
 * Count-aware (multiset) comparison: like compareLists, but also reports how
 * many extra occurrences each side has for keys present on both sides.
 */
export function compareListsCountAware(
  leftText: string,
  rightText: string,
  options: ListParseOptions = DEFAULT_LIST_PARSE_OPTIONS,
): ListCompareResult & {
  /** Keys present on both sides with different occurrence counts. */
  countDeltas: CountDelta[];
} {
  const base = compareLists(leftText, rightText, options);
  return { ...base, countDeltas: computeCountDeltas(base) };
}

/** Human-readable summary of count deltas, e.g. "A: +1 left · B: +1 right". */
export function formatCountDeltaSummary(deltas: CountDelta[]): string {
  const lines = deltas.map((d) => {
    const leftExtra = d.left - d.right;
    if (leftExtra > 0) return `${d.value}: ${leftExtra} extra on left`;
    return `${d.value}: ${d.right - d.left} extra on right`;
  });
  return lines.join("\n");
}

/** Analyze a single list: unique items, duplicates with counts, raw counts. */
export function analyzeSingleList(
  text: string,
  options: ListParseOptions = DEFAULT_LIST_PARSE_OPTIONS,
): SingleListAnalysis {
  const values = parseListText(text, options);
  const side = buildSide(values, options);
  const counts = side.items
    .slice()
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  const duplicates = side.items.filter((i) => i.count > 1);
  return {
    unique: side.items,
    duplicates,
    counts,
    rawCount: side.rawCount,
    uniqueCount: side.uniqueCount,
    duplicateKeys: duplicates.length,
    duplicateOccurrences: duplicates.reduce((sum, i) => sum + i.count - 1, 0),
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
    case "changed":
      return result.changed;
    case "summary":
      // Summary is a report view, not an item bucket.
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeMarkdownCell(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
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
    case "sql-not-in":
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
    case "sql-array":
      return `ARRAY[${values.map((v) => `'${escapeSqlSingle(v)}'`).join(", ")}]`;
    case "go-slice":
      return `[]string{${values.map((v) => `"${escapeJsDouble(v)}"`).join(", ")}}`;
    case "markdown-table":
      return [
        "| value |",
        "| --- |",
        ...values.map((v) => `| ${escapeMarkdownCell(v)} |`),
      ].join("\n");
    case "html-table": {
      const rows = values.map((v) => `    <tr><td>${escapeHtml(v)}</td></tr>`).join("\n");
      return [
        "<table>",
        "  <thead>",
        "    <tr><th>value</th></tr>",
        "  </thead>",
        "  <tbody>",
        rows,
        "  </tbody>",
        "</table>",
      ].join("\n");
    }
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
    case "comma-double-quotes":
      return values.map((v) => `"${escapeJsDouble(v)}"`).join(", ");
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
    chunkSize?: number;
  },
): string {
  return formatSqlClause(items, {
    column: opts.column,
    quote: opts.quote,
    sortMode: opts.sortMode,
    notIn: opts.notIn,
    chunkSize: opts.chunkSize,
  });
}

export const BUCKET_LABELS: Record<ListBucket, string> = {
  common: "Common",
  leftOnly: "Only left",
  rightOnly: "Only right",
  union: "Union",
  symmetric: "Symmetric diff",
  leftDupes: "Left duplicates",
  rightDupes: "Right duplicates",
  changed: "Changed",
  summary: "Summary",
};

export interface ListSummaryOptions {
  /** Include the Changed section (CSV column-compare mode). Default true. */
  includeChanged?: boolean;
  /** Show inline count-delta notes in the Common section. Default true. */
  showCountDeltas?: boolean;
}

export interface ListSummarySection {
  bucket: "common" | "leftOnly" | "rightOnly" | "leftDupes" | "rightDupes" | "changed";
  label: string;
  count: number;
  items: ListItem[];
}

export interface ListSummary {
  /** Non-empty sections in render order (Common, Only left, Only right, dupes, Changed). */
  sections: ListSummarySection[];
  /** Plain-text report - exactly what Copy / Download produce. */
  text: string;
  /** Keys present on both sides with unequal occurrence counts. */
  countDeltas: CountDelta[];
}

/**
 * Build the Summary report for a list compare result: grouped counts + items
 * for what is in the left list, the right list, and what they share. Sections
 * with no items are omitted; the Common section annotates keys whose
 * occurrence count differs between the sides (e.g. "A ×2 left, ×1 right").
 */
export function buildListSummary(
  result: ListCompareResult,
  options: ListSummaryOptions = {},
): ListSummary {
  const includeChanged = options.includeChanged ?? true;
  const showCountDeltas = options.showCountDeltas ?? true;
  const countDeltas = showCountDeltas ? computeCountDeltas(result) : [];
  const deltaByKey = new Map(countDeltas.map((d) => [d.key, d]));

  const all: ListSummarySection[] = [
    { bucket: "common", label: BUCKET_LABELS.common, count: result.common.length, items: result.common },
    { bucket: "leftOnly", label: BUCKET_LABELS.leftOnly, count: result.leftOnly.length, items: result.leftOnly },
    { bucket: "rightOnly", label: BUCKET_LABELS.rightOnly, count: result.rightOnly.length, items: result.rightOnly },
    ...(result.leftDupes.length > 0
      ? [{ bucket: "leftDupes" as const, label: BUCKET_LABELS.leftDupes, count: result.leftDupes.length, items: result.leftDupes }]
      : []),
    ...(result.rightDupes.length > 0
      ? [{ bucket: "rightDupes" as const, label: BUCKET_LABELS.rightDupes, count: result.rightDupes.length, items: result.rightDupes }]
      : []),
    ...(includeChanged && result.changed.length > 0
      ? [{ bucket: "changed" as const, label: BUCKET_LABELS.changed, count: result.changed.length, items: result.changed }]
      : []),
  ];
  const sections = all.filter((s) => s.count > 0);

  const text = sections
    .map((s) => {
      const lines = s.items.map((item) => {
        const d = deltaByKey.get(item.key);
        const note =
          s.bucket === "common" && d ? ` ×${d.left} left, ×${d.right} right` : "";
        return `  ${item.value}${note}`;
      });
      return `${s.label} (${s.count})\n${lines.join("\n")}`;
    })
    .join("\n\n");

  return { sections, text, countDeltas };
}

export interface SqlClauseOptions {
  column?: string;
  table?: string;
  quote: "single" | "double" | "none";
  sortMode?: ListSortMode;
  notIn?: boolean;
  /** Emit `col = ANY(ARRAY[...])` instead of `col IN (...)` (PostgreSQL). */
  any?: boolean;
  /** Emit `INSERT INTO t (col) VALUES (...), (...);` instead of IN clause. */
  insert?: boolean;
  /** Chunk the value list into multiple clauses/statements (0 = no chunking). */
  chunkSize?: number;
}

function chunkItems<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Build a full SQL snippet from list items: IN / NOT IN / ANY / VALUES / INSERT,
 * with optional chunking for very large lists. Empty lists return a comment.
 */
export function formatSqlClause(items: ListItem[], opts: SqlClauseOptions): string {
  const col = opts.column?.trim() || "id";
  const table = opts.table?.trim() || "items";
  const chunkSize = opts.chunkSize && opts.chunkSize > 0 ? opts.chunkSize : 0;
  const quote = opts.quote;
  const quoteItem = (v: string): string => {
    if (quote === "double") return `"${escapeSqlDouble(v)}"`;
    if (quote === "none") {
      const n = tryAsNumber(v);
      return n !== null ? String(n) : `'${escapeSqlSingle(v)}'`;
    }
    return `'${escapeSqlSingle(v)}'`;
  };
  const sorted = sortListItems(items, opts.sortMode ?? "none");
  const values = sorted.map((i) => i.value);
  if (values.length === 0) return `-- empty list\n-- ${col} ${opts.notIn ? "NOT IN" : "IN"} ()`;

  const chunks = chunkItems(values, chunkSize || values.length);

  if (opts.insert) {
    return chunks
      .map((chunk) => {
        const rows = chunk.map((v) => `(${quoteItem(v)})`).join(",\n  ");
        return `INSERT INTO ${table} (${col}) VALUES\n  ${rows};`;
      })
      .join("\n\n");
  }

  if (opts.any) {
    const arrays = chunks.map((chunk) => `ARRAY[${chunk.map(quoteItem).join(", ")}]`);
    return arrays.map((arr) => `${col} = ANY(${arr})`).join("\nOR ");
  }

  const op = opts.notIn ? "NOT IN" : "IN";
  const clauses = chunks.map((chunk) => `${col} ${op} (${chunk.map(quoteItem).join(", ")})`);
  return clauses.join("\nOR ");
}
