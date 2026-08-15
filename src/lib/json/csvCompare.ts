import Papa from "papaparse";
import {
  compareLists,
  DEFAULT_LIST_PARSE_OPTIONS,
  normalizeListKey,
  type ListCompareResult,
  type ListItem,
  type ListParseOptions,
} from "./listCompare";

type CsvRow = Record<string, string>;

function parseRows(text: string): CsvRow[] {
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  if (parsed.errors.length > 0) return [];
  return (parsed.data as CsvRow[]).filter((row) => row && typeof row === "object");
}

/**
 * Detect CSV column headers from text. Returns null when the input does not
 * look like a header CSV (no headers, no rows, or parse errors).
 */
export function detectCsvColumns(text: string): string[] | null {
  const t = (text ?? "").trim();
  if (!t) return null;
  const rows = parseRows(t);
  if (rows.length === 0) return null;
  const first = rows[0];
  const keys = Object.keys(first);
  if (keys.length === 0) return null;
  // Single-column CSVs are ambiguous with plain lists; require a header row
  // that is clearly not a plain value (contains a comma/sep or multiple cols).
  if (keys.length === 1) {
    const header = keys[0] ?? "";
    const hasQuotes = /["'\t;]/.test(t.slice(0, 200));
    if (!hasQuotes && !/^[A-Za-z_][\w .-]*$/.test(header)) return null;
  }
  return keys;
}

export interface CsvColumnCompareResult {
  /** Columns present on each side and the intersection. */
  columns: { left: string[]; right: string[]; common: string[] };
  /** The column actually used for comparison. */
  keyColumn: string | null;
  /** List-compare result over the key column values (reuses the whole engine). */
  result: ListCompareResult;
  /** Number of data rows per side (excluding header). */
  leftRowCount: number;
  rightRowCount: number;
}

function extractColumnValues(text: string, column: string): string[] {
  return parseRows(text)
    .map((row) => row[column])
    .filter((v) => v !== undefined && v !== null);
}

/**
 * Compare two CSVs by a chosen key column. Row-level "changed" detection is
 * keyed on the normalized key: when the same key exists on both sides but the
 * full row differs, it lands in the `changed` bucket of the returned result.
 */
export function compareCsvByColumn(
  leftText: string,
  rightText: string,
  column: string,
  options: ListParseOptions = DEFAULT_LIST_PARSE_OPTIONS,
): CsvColumnCompareResult | null {
  const leftCols = detectCsvColumns(leftText);
  const rightCols = detectCsvColumns(rightText);
  if (!leftCols || !rightCols) return null;
  if (!leftCols.includes(column) || !rightCols.includes(column)) return null;

  const leftRows = parseRows(leftText);
  const rightRows = parseRows(rightText);

  const leftVals = extractColumnValues(leftText, column);
  const rightVals = extractColumnValues(rightText, column);
  const result = compareLists(leftVals.join("\n"), rightVals.join("\n"), options);

  // Row maps keyed by normalized key (first occurrence wins).
  const leftMap = new Map<string, CsvRow>();
  const rightMap = new Map<string, CsvRow>();
  for (const row of leftRows) {
    const v = row[column];
    if (v === undefined || v === null) continue;
    const key = normalizeListKey(String(v), options);
    if (!leftMap.has(key)) leftMap.set(key, row);
  }
  for (const row of rightRows) {
    const v = row[column];
    if (v === undefined || v === null) continue;
    const key = normalizeListKey(String(v), options);
    if (!rightMap.has(key)) rightMap.set(key, row);
  }

  const changed: ListItem[] = [];
  for (const item of result.common) {
    const lr = leftMap.get(item.key);
    const rr = rightMap.get(item.key);
    if (!lr || !rr) continue;
    if (JSON.stringify(lr) !== JSON.stringify(rr)) {
      changed.push(item);
    }
  }

  result.changed = changed;
  result.stats.changed = changed.length;

  return {
    columns: {
      left: leftCols,
      right: rightCols,
      common: leftCols.filter((c) => rightCols.includes(c)),
    },
    keyColumn: column,
    result,
    leftRowCount: leftRows.length,
    rightRowCount: rightRows.length,
  };
}

/** Pick the first common column, falling back to the left side's first column. */
export function pickDefaultColumn(left: string[], right: string[]): string | null {
  const common = left.filter((c) => right.includes(c));
  return common[0] ?? left[0] ?? null;
}
