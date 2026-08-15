import { parseJsonInput, type JsonValue } from "@/lib/json/core";
import { detectFormat, parseInput } from "@/lib/formats";

export interface DiffOptions {
  /** Compare arrays as unordered sets/multisets instead of by index. */
  ignoreArrayOrder?: boolean;
  /** For arrays of objects, use this key to match elements across sides. */
  arrayKey?: string;
}

export interface DiffRow {
  path: string;
  left: string;
  right: string;
  change: "added" | "removed" | "changed";
}

export interface DiffSummary {
  total: number;
  added: number;
  removed: number;
  changed: number;
  rows: DiffRow[];
  truncated: boolean;
}

export interface LineDiffStats {
  /** Number of line hunks (Monaco line changes). */
  hunks: number;
  /** Lines added on the modified side. */
  linesAdded: number;
  /** Lines removed from the original side. */
  linesRemoved: number;
  /** Hunks that modify existing lines (not pure add/delete). */
  hunksModified: number;
  /** Pure addition hunks. */
  hunksAdded: number;
  /** Pure deletion hunks. */
  hunksRemoved: number;
}

const MAX_DIFF_ROWS = 2000;

function printable(value: JsonValue | undefined): string {
  if (value === undefined) return "(missing)";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

/** Deterministic JSON serialization for order-insensitive array matching. */
function canonicalJson(value: JsonValue): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, JsonValue>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
}

function arrayKeyFor(item: JsonValue, key?: string): string | null {
  if (!key) return null;
  if (item && typeof item === "object" && !Array.isArray(item)) {
    const v = (item as Record<string, JsonValue>)[key];
    if (v !== undefined) return `key:${canonicalJson(v)}`;
  }
  return null;
}

function walk(
  left: JsonValue | undefined,
  right: JsonValue | undefined,
  path: string,
  out: DiffRow[],
  opts: DiffOptions = {},
) {
  if (out.length >= MAX_DIFF_ROWS) return;

  if (left === undefined && right !== undefined) {
    out.push({ path, left: "(missing)", right: printable(right), change: "added" });
    return;
  }
  if (left !== undefined && right === undefined) {
    out.push({ path, left: printable(left), right: "(missing)", change: "removed" });
    return;
  }
  if (left === right) return;

  const leftIsObj = !!left && typeof left === "object";
  const rightIsObj = !!right && typeof right === "object";
  const leftIsArr = Array.isArray(left);
  const rightIsArr = Array.isArray(right);

  // Both objects (not arrays) - walk keys
  if (leftIsObj && rightIsObj && !leftIsArr && !rightIsArr) {
    const leftObj = left as Record<string, JsonValue>;
    const rightObj = right as Record<string, JsonValue>;
    const keys = new Set([...Object.keys(leftObj), ...Object.keys(rightObj)]);
    keys.forEach((key) => {
      if (out.length >= MAX_DIFF_ROWS) return;
      const nextPath = path ? `${path}.${key}` : key;
      walk(leftObj[key], rightObj[key], nextPath, out, opts);
    });
    return;
  }

  // Both arrays - by index (default) or order-insensitive matching
  if (leftIsArr && rightIsArr) {
    const la = left as JsonValue[];
    const ra = right as JsonValue[];
    if (opts.ignoreArrayOrder) {
      const rightRemaining = new Map<string, { item: JsonValue; count: number }>();
      for (const item of ra) {
        const key = arrayKeyFor(item, opts.arrayKey) ?? canonicalJson(item);
        const rec = rightRemaining.get(key);
        if (rec) rec.count++;
        else rightRemaining.set(key, { item, count: 1 });
      }
      const label = (item: JsonValue, key: string): string =>
        opts.arrayKey && item && typeof item === "object" && !Array.isArray(item)
          ? `${path}[${opts.arrayKey}=${(item as Record<string, JsonValue>)[opts.arrayKey]}]`
          : `${path}[${key.length > 24 ? `${key.slice(0, 24)}…` : key}]`;
      for (const item of la) {
        if (out.length >= MAX_DIFF_ROWS) return;
        const key = arrayKeyFor(item, opts.arrayKey) ?? canonicalJson(item);
        const rec = rightRemaining.get(key);
        if (rec && rec.count > 0) {
          rec.count--;
          if (canonicalJson(rec.item) !== canonicalJson(item)) {
            out.push({ path: label(item, key), left: printable(item), right: printable(rec.item), change: "changed" });
          }
          continue;
        }
        out.push({ path: label(item, key), left: printable(item), right: "(missing)", change: "removed" });
      }
      for (const [key, rec] of rightRemaining) {
        if (rec.count <= 0) continue;
        for (let i = 0; i < rec.count; i++) {
          if (out.length >= MAX_DIFF_ROWS) return;
          out.push({ path: label(rec.item, key), left: "(missing)", right: printable(rec.item), change: "added" });
        }
      }
      return;
    }
    const len = Math.max(la.length, ra.length);
    for (let i = 0; i < len; i++) {
      if (out.length >= MAX_DIFF_ROWS) return;
      const nextPath = `${path}[${i}]`;
      walk(la[i], ra[i], nextPath, out, opts);
    }
    return;
  }

  out.push({
    path: path || "$",
    left: printable(left),
    right: printable(right),
    change: "changed",
  });
}

export function diffJson(left: JsonValue, right: JsonValue, opts?: DiffOptions): DiffRow[] {
  return summarizeDiff(left, right, opts).rows;
}

export function summarizeDiff(left: JsonValue, right: JsonValue, opts?: DiffOptions): DiffSummary {
  const rows: DiffRow[] = [];
  walk(left, right, "$", rows, opts);
  const truncated = rows.length >= MAX_DIFF_ROWS;
  let added = 0;
  let removed = 0;
  let changed = 0;
  for (const row of rows) {
    if (row.change === "added") added++;
    else if (row.change === "removed") removed++;
    else changed++;
  }
  return {
    total: rows.length,
    added,
    removed,
    changed,
    rows,
    truncated,
  };
}

/** Parse JSON text safely; returns null if invalid or empty. Accepts loose single-quoted form. */
export function tryParseJson(text: string): JsonValue | null {
  const t = text.trim();
  if (!t) return null;
  try {
    return parseJsonInput(t);
  } catch {
    return null;
  }
}

/**
 * Parse text into a JSON-compatible structure for structural diffing.
 * Tries JSON first, then XML / YAML / TOML / CSV when those are safely parseable.
 */
export function tryParseStructured(text: string): JsonValue | null {
  const t = text.trim();
  if (!t) return null;
  const asJson = tryParseJson(t);
  if (asJson !== null) return asJson;
  try {
    const fmt = detectFormat(t);
    if (fmt === "curl") return null;
    const parsed = parseInput(t, fmt);
    if (parsed === null || parsed === undefined) return null;
    return parsed as JsonValue;
  } catch {
    return null;
  }
}

export function summarizeDiffFromText(
  leftText: string,
  rightText: string,
  opts?: DiffOptions,
): DiffSummary | null {
  const left = tryParseStructured(leftText);
  const right = tryParseStructured(rightText);
  // Empty side treated as {}
  const l = left ?? (leftText.trim() ? null : {});
  const r = right ?? (rightText.trim() ? null : {});
  if (l === null || r === null) return null;
  return summarizeDiff(l, r, opts);
}

export function emptyDiffSummary(): DiffSummary {
  return { total: 0, added: 0, removed: 0, changed: 0, rows: [], truncated: false };
}

export function formatDiffReport(
  leftText: string,
  rightText: string,
  summary: DiffSummary | null,
  lineStats?: LineDiffStats | null,
): string {
  const report = {
    generatedAt: new Date().toISOString(),
    identical: summary ? summary.total === 0 : undefined,
    structural: summary
      ? {
          total: summary.total,
          added: summary.added,
          removed: summary.removed,
          changed: summary.changed,
          truncated: summary.truncated,
          changes: summary.rows,
        }
      : { error: "One or both sides are not valid JSON - structural path diff unavailable." },
    lineLevel: lineStats
      ? {
          hunks: lineStats.hunks,
          linesAdded: lineStats.linesAdded,
          linesRemoved: lineStats.linesRemoved,
          hunksAdded: lineStats.hunksAdded,
          hunksRemoved: lineStats.hunksRemoved,
          hunksModified: lineStats.hunksModified,
        }
      : undefined,
    leftPreview: leftText.slice(0, 2000),
    rightPreview: rightText.slice(0, 2000),
  };
  return JSON.stringify(report, null, 2);
}
