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
  | "leftDupes"
  | "rightDupes"
  | "changed"
  | "summary";

export type ResolvedListDelimiter = Exclude<ListDelimiter, "auto">;

export interface ListParseOptions {
  delimiter: ListDelimiter;
  trim: boolean;
  ignoreEmpty: boolean;
  caseInsensitive: boolean;
  /** Strip one layer of matching '...' or "..." around items. */
  stripQuotes: boolean;
  /** Treat "01" and 1 as the same key when both parse as numbers. */
  numericNormalize: boolean;
  /** Auto-clean pasted text (strip quotes/brackets, one item per line). */
  autoClean: boolean;
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
  leftDupes: ListItem[];
  rightDupes: ListItem[];
  /** Keys present on both sides whose full row/record differs (CSV column compare). */
  changed: ListItem[];
  stats: {
    common: number;
    leftOnly: number;
    rightOnly: number;
    union: number;
    leftDupes: number;
    rightDupes: number;
    changed: number;
  };
}

export interface SingleListAnalysis {
  /** Distinct items (first-seen order), each with occurrence count. */
  unique: ListItem[];
  /** Distinct items that appear exactly once (first-seen order). */
  once: ListItem[];
  onceCount: number;
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
 * Default parse options trim spaces and strip one layer of quotes, so pasted
 * `a, b, a` and `'x', 'y'` lists count correctly. Matching stays case-sensitive.
 */
export const DEFAULT_LIST_PARSE_OPTIONS: ListParseOptions = {
  delimiter: "auto",
  trim: true,
  ignoreEmpty: true,
  caseInsensitive: false,
  stripQuotes: true,
  numericNormalize: false,
  autoClean: false,
};

const EXPORT_LABELS: Record<ListExportFormat, string> = {
  "sql-in-single": "IN list",
  "sql-not-in": "NOT IN list",
  "sql-in-double": "IN list, double quotes",
  "sql-in-unquoted": "Numbers, unquoted",
  "sql-values": "VALUES rows",
  "sql-array": "PostgreSQL ARRAY",
  "json-array": "JSON array",
  "json-array-numbers": "JSON array, numbers if possible",
  newline: "One per line",
  comma: "Comma, no space",
  "comma-space": "Comma separated",
  "comma-double-quotes": "Comma, double quotes",
  pipe: "Pipe separated",
  tsv: "Tab separated",
  "csv-quoted": "CSV quoted",
  "yaml-list": "YAML list",
  "regex-alt": "Regex alternation",
  "js-array-single": "JavaScript array",
  "js-array-double": "JavaScript array, double quotes",
  "python-list": "Python list",
  "go-slice": "Go slice",
  "markdown-table": "Markdown table",
  "html-table": "HTML table",
  raw: "One per line",
};

const EXPORT_EXAMPLES: Record<ListExportFormat, string> = {
  "sql-in-single": "IN ('a', 'b')",
  "sql-not-in": "NOT IN ('a', 'b')",
  "sql-in-double": 'IN ("a", "b")',
  "sql-in-unquoted": "IN (1, 2)",
  "sql-values": "('a'), ('b')",
  "sql-array": "ARRAY['a', 'b']",
  "json-array": '["a", "b"]',
  "json-array-numbers": '["a", 1]',
  newline: "a ⏎ b",
  comma: "a,b",
  "comma-space": "a, b",
  "comma-double-quotes": '"a", "b"',
  pipe: "a|b",
  tsv: "a ⇥ b",
  "csv-quoted": '"a","b"',
  "yaml-list": "- a - b",
  "regex-alt": "a|b",
  "js-array-single": "['a', 'b']",
  "js-array-double": '["a", "b"]',
  "python-list": '["a", "b"]',
  "go-slice": '[]string{"a", "b"}',
  "markdown-table": "| value |",
  "html-table": "<table>…</table>",
  raw: "a ⏎ b",
};

const EXPORT_EXTENSIONS: Record<ListExportFormat, string> = {
  "sql-in-single": "sql",
  "sql-not-in": "sql",
  "sql-in-double": "sql",
  "sql-in-unquoted": "sql",
  "sql-values": "sql",
  "sql-array": "sql",
  "json-array": "json",
  "json-array-numbers": "json",
  newline: "txt",
  comma: "txt",
  "comma-space": "txt",
  "comma-double-quotes": "txt",
  pipe: "txt",
  tsv: "tsv",
  "csv-quoted": "csv",
  "yaml-list": "yaml",
  "regex-alt": "txt",
  "js-array-single": "js",
  "js-array-double": "js",
  "python-list": "py",
  "go-slice": "go",
  "markdown-table": "md",
  "html-table": "html",
  raw: "txt",
};

export function listExportFormatLabel(fmt: ListExportFormat): string {
  return EXPORT_LABELS[fmt];
}

/** Short example of the shape a format produces, for menus. */
export function listExportExample(format: ListExportFormat): string {
  return EXPORT_EXAMPLES[format];
}

/** File extension without the dot for a copy format. */
export function listExportExtension(format: ListExportFormat): string {
  return EXPORT_EXTENSIONS[format];
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

/** What "auto" resolves to for this text. Returns "newline" for empty text. */
export function detectListDelimiter(text: string): ResolvedListDelimiter {
  const t = text.trim();
  if (!t) return "newline";
  if (tryParseJsonArray(t)) return "json";
  if (t.includes("\n")) {
    // One item per line with a trailing separator ('a',\n'b',\n'a'): split on that separator,
    // which also breaks on the line ends. The last line may leave it off.
    const lines = t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, -1);
    if (lines.length && lines.every((l) => l.endsWith(","))) return "comma";
    if (lines.length && lines.every((l) => l.endsWith(";"))) return "semicolon";
    return "newline";
  }
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

function splitByDelimiter(text: string, delimiter: Exclude<ResolvedListDelimiter, "json">): string[] {
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
    const d = detectListDelimiter(t);
    raw = d === "json" ? (tryParseJsonArray(t) ?? []) : splitByDelimiter(t, d);
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

// Collator is much faster than String.localeCompare in big sorts, same default ordering.
const byValue = new Intl.Collator();

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

  const leftDupes = left.items.filter((i) => i.count > 1);
  const rightDupes = right.items.filter((i) => i.count > 1);

  return {
    left,
    right,
    common,
    leftOnly,
    rightOnly,
    union,
    leftDupes,
    rightDupes,
    // Filled by CSV column compare (row-level changes); empty for plain lists.
    changed: [],
    stats: {
      common: common.length,
      leftOnly: leftOnly.length,
      rightOnly: rightOnly.length,
      union: union.length,
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
  let counts: ListItem[] | undefined;
  const duplicates = side.items.filter((i) => i.count > 1);
  const once = side.items.filter((i) => i.count === 1);
  return {
    unique: side.items,
    once,
    onceCount: once.length,
    duplicates,
    // Lazy: sorting 100k+ items is the slowest step and the workspace never reads it.
    get counts() {
      return (counts ??= side.items
        .slice()
        .sort((a, b) => b.count - a.count || byValue.compare(a.value, b.value)));
    },
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
      return copy.sort((a, b) => b.count - a.count || byValue.compare(a.value, b.value));
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
  chunkSize = 0,
): string {
  const sorted = sortListItems(items, sortMode);
  const values = sorted.map((i) => i.value);
  if (values.length === 0) return "";

  // For very large lists, render in chunks to keep peak memory bounded.
  if (chunkSize > 0 && values.length > chunkSize) {
    const chunks = chunkItems(values, chunkSize).map((c) => formatValues(c, format));
    const wrap = WRAPPERS[format];
    if (wrap) {
      // One valid list: strip each chunk's wrapper, join the chunks inside a single one.
      const inner = chunks.map((c) => c.slice(wrap[0].length, c.length - wrap[1].length));
      return wrap[0] + inner.join(",\n") + wrap[1];
    }
    return chunks.join(formatJoiner(format));
  }

  return formatValues(values, format);
}

/** Formats whose output is `open + comma list + close`; chunking must not repeat the wrapper. */
const WRAPPERS: Partial<Record<ListExportFormat, [string, string]>> = {
  "sql-in-single": ["IN (", ")"],
  "sql-not-in": ["NOT IN (", ")"],
  "sql-in-double": ["IN (", ")"],
  "sql-in-unquoted": ["IN (", ")"],
  "sql-array": ["ARRAY[", "]"],
  "go-slice": ["[]string{", "}"],
  "js-array-single": ["[", "]"],
  "js-array-double": ["[", "]"],
  "python-list": ["[", "]"],
};

function formatValues(values: string[], format: ListExportFormat): string {
  switch (format) {
    case "sql-in-single":
      return `IN (${values.map((v) => `'${escapeSqlSingle(v)}'`).join(", ")})`;
    case "sql-not-in":
      return `NOT IN (${values.map((v) => `'${escapeSqlSingle(v)}'`).join(", ")})`;
    case "sql-in-double":
      return `IN (${values.map((v) => `"${escapeSqlDouble(v)}"`).join(", ")})`;
    case "sql-in-unquoted":
      return `IN (${values
        .map((v) => {
          const n = tryAsNumber(v);
          return n !== null ? String(n) : `'${escapeSqlSingle(v)}'`;
        })
        .join(", ")})`;
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

/** When chunking a list export, how to rejoin the per-chunk strings.
 *  The chunked output is the same as the full output for the *boundary*
 *  formats (newline/comma/pipe/tsv/raw); for inline formats like
 *  `sql-in-single` we keep the in-chunk `, ` joiner so the final output
 *  remains a single comma-separated list. */
function formatJoiner(format: ListExportFormat): string {
  switch (format) {
    case "newline":
    case "raw":
    case "sql-values":
    case "markdown-table":
      return "\n";
    case "html-table":
      return "\n";
    case "tsv":
      return "\n";
    default:
      return ", ";
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
  common: "In both",
  leftOnly: "Only in A",
  rightOnly: "Only in B",
  union: "All merged",
  leftDupes: "Repeated in A",
  rightDupes: "Repeated in B",
  changed: "Changed",
  summary: "Summary",
};

/** A side's name shortened for tight UI (tab labels, row notes). */
export const shortName = (n: string, max = 16) => (n.length > max ? `${n.slice(0, max - 1).trimEnd()}…` : n);

/** Bucket labels with the sides' own names ("A" / "B" when not renamed). */
export function bucketLabels(names: { left?: string; right?: string } = {}): Record<ListBucket, string> {
  const a = names.left?.trim() || "A";
  const b = names.right?.trim() || "B";
  return { ...BUCKET_LABELS, leftOnly: `Only in ${a}`, rightOnly: `Only in ${b}`, leftDupes: `Repeated in ${a}`, rightDupes: `Repeated in ${b}` };
}

export interface ListSummaryOptions {
  /** Names of the two lists, used in labels and notes. Default "A" / "B". */
  names?: { left?: string; right?: string };
  /** Include the Changed section (CSV column-compare mode). Default true. */
  includeChanged?: boolean;
  /** Show inline count-delta notes in the Common section. Default true. */
  showCountDeltas?: boolean;
  /** Order of the items inside each section. Default "none" (as found). */
  sort?: ListSortMode;
}

export interface ListSummarySection {
  bucket: "common" | "leftOnly" | "rightOnly" | "leftDupes" | "rightDupes" | "changed";
  label: string;
  count: number;
  items: ListItem[];
  /** One entry per item, in the same order: the value on a single line, plus a short note such as "×2 in A, ×1 in B". */
  rows: Array<{ value: string; note: string; shortNote: string }>;
}

export interface ListSummary {
  /** Non-empty sections in render order (In both, Only in A, Only in B, Repeated in A or B, Changed). */
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
 * occurrence count differs between the sides (e.g. "A ×2 in A, ×1 in B").
 */
export function buildListSummary(
  result: ListCompareResult,
  options: ListSummaryOptions = {},
): ListSummary {
  const includeChanged = options.includeChanged ?? true;
  const showCountDeltas = options.showCountDeltas ?? true;
  const countDeltas = showCountDeltas ? computeCountDeltas(result) : [];
  const deltaByKey = new Map(countDeltas.map((d) => [d.key, d]));
  const labels = bucketLabels(options.names);
  const nameA = options.names?.left?.trim() || "A";
  const nameB = options.names?.right?.trim() || "B";

  const all: Array<Omit<ListSummarySection, "rows">> = [
    { bucket: "common", label: labels.common, count: result.common.length, items: result.common },
    { bucket: "leftOnly", label: labels.leftOnly, count: result.leftOnly.length, items: result.leftOnly },
    { bucket: "rightOnly", label: labels.rightOnly, count: result.rightOnly.length, items: result.rightOnly },
    ...(result.leftDupes.length > 0
      ? [{ bucket: "leftDupes" as const, label: labels.leftDupes, count: result.leftDupes.length, items: result.leftDupes }]
      : []),
    ...(result.rightDupes.length > 0
      ? [{ bucket: "rightDupes" as const, label: labels.rightDupes, count: result.rightDupes.length, items: result.rightDupes }]
      : []),
    ...(includeChanged && result.changed.length > 0
      ? [{ bucket: "changed" as const, label: labels.changed, count: result.changed.length, items: result.changed }]
      : []),
  ];
  const sections: ListSummarySection[] = all
    .filter((s) => s.count > 0)
    .map((s) => ({ ...s, items: sortListItems(s.items, options.sort ?? "none") }))
    .map((s) => ({
      ...s,
      rows: s.items.map((item) => {
        const d = deltaByKey.get(item.key);
        const delta = (a: string, b: string) => `×${d?.left} in ${a}, ×${d?.right} in ${b}`;
        const dupe = s.bucket === "leftDupes" || s.bucket === "rightDupes";
        const note = s.bucket === "common" && d ? delta(nameA, nameB) : dupe ? `×${item.count}` : "";
        const shortNote = s.bucket === "common" && d ? delta(shortName(nameA, 10), shortName(nameB, 10)) : note;
        // One item per line, always: a value holding a line break would break the indent.
        return { value: item.value.replace(/\s*\r?\n\s*/g, " "), note, shortNote };
      }),
    }));

  return { sections, text: formatListSummary(sections), countDeltas };
}

export type ListSummaryFormat = "text" | "markdown" | "json";

/**
 * Summary sections as text. "text": a "Label (count)" line per section, then its rows indented two spaces.
 * "markdown": a heading per section and a bullet per row. "json": `{ label: values[] }`, notes left out.
 */
export function formatListSummary(sections: ListSummarySection[], format: ListSummaryFormat = "text"): string {
  if (format === "json") return JSON.stringify(Object.fromEntries(sections.map((s) => [s.label, s.items.map((i) => i.value)])), null, 2);
  const line = (r: { value: string; note: string }) => `${r.value}${r.note && ` ${r.note}`}`;
  if (format === "markdown") return sections.map((s) => `## ${s.label} (${s.count})\n\n${s.rows.map((r) => `- ${line(r)}`).join("\n")}`).join("\n\n");
  return sections.map((s) => `${s.label} (${s.count})\n${s.rows.map((r) => `  ${line(r)}`).join("\n")}`).join("\n\n");
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

/**
 * Clean up pasted list text: strip surrounding quotes, collapse whitespace,
 * and normalize to one item per line.
 */
export function cleanListInput(text: string): string {
  let input = text.trim();
  if (!input) return "";

  // Strip JSON array [ ] or parenthesized ( ) wrappers
  if (input.length >= 2 && "[(".includes(input[0]!) && "])".includes(input[input.length - 1]!)) {
    input = input.slice(1, -1).trim();
  }

  // Split on commas (respecting quoted strings), then also on newlines.
  const items: string[] = [];
  for (const part of splitCommasOutsideQuotes(input)) {
    for (const line of part.split(/\r?\n/)) {
      const s = cleanListItem(line);
      if (s) items.push(s);
    }
  }
  return items.join("\n");
}

const EDGE_JUNK = /^["'[\]()]+|["'[\]()]+$/g;

function cleanListItem(s: string): string {
  return s.trim().replace(EDGE_JUNK, "").replace(/\s+/g, " ").trim();
}

/**
 * Split on a comma when an even number of " and of ' follow it (the rule the
 * old lookahead regex expressed), in one pass using parity of the quotes seen.
 */
function splitCommasOutsideQuotes(text: string): string[] {
  let dqTotal = 0;
  let sqTotal = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c === 34) dqTotal++;
    else if (c === 39) sqTotal++;
  }
  const parts: string[] = [];
  let start = 0;
  let dq = 0;
  let sq = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c === 34) dq++;
    else if (c === 39) sq++;
    else if (c === 44 && (dq & 1) === (dqTotal & 1) && (sq & 1) === (sqTotal & 1)) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

/** True when cleanListInput(text) would change text. Early-exits per line; no joined output. */
export function needsListTidy(text: string): boolean {
  if (!text) return false;
  // Commas or a bracket wrapper change structure across lines: use the full clean (still linear).
  if (text.includes(",") || "[(".includes(text[0]!)) return cleanListInput(text) !== text;
  let start = 0;
  for (;;) {
    let end = text.indexOf("\n", start);
    if (end === -1) end = text.length;
    const line = text.slice(start, end);
    if (line === "" || cleanListItem(line) !== line) return true; // blank lines are dropped
    if (end === text.length) return false;
    start = end + 1;
  }
}
