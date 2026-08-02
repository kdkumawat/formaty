import type { JsonValue } from "@/lib/json/core";

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

function walk(
  left: JsonValue | undefined,
  right: JsonValue | undefined,
  path: string,
  out: DiffRow[],
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

  // Both objects (not arrays) — walk keys
  if (leftIsObj && rightIsObj && !leftIsArr && !rightIsArr) {
    const leftObj = left as Record<string, JsonValue>;
    const rightObj = right as Record<string, JsonValue>;
    const keys = new Set([...Object.keys(leftObj), ...Object.keys(rightObj)]);
    keys.forEach((key) => {
      if (out.length >= MAX_DIFF_ROWS) return;
      const nextPath = path ? `${path}.${key}` : key;
      walk(leftObj[key], rightObj[key], nextPath, out);
    });
    return;
  }

  // Both arrays — walk by index, report length-only extras
  if (leftIsArr && rightIsArr) {
    const la = left as JsonValue[];
    const ra = right as JsonValue[];
    const len = Math.max(la.length, ra.length);
    for (let i = 0; i < len; i++) {
      if (out.length >= MAX_DIFF_ROWS) return;
      const nextPath = `${path}[${i}]`;
      walk(la[i], ra[i], nextPath, out);
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

export function diffJson(left: JsonValue, right: JsonValue): DiffRow[] {
  return summarizeDiff(left, right).rows;
}

export function summarizeDiff(left: JsonValue, right: JsonValue): DiffSummary {
  const rows: DiffRow[] = [];
  walk(left, right, "$", rows);
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

/** Parse JSON text safely; returns null if invalid or empty. */
export function tryParseJson(text: string): JsonValue | null {
  const t = text.trim();
  if (!t) return null;
  try {
    return JSON.parse(t) as JsonValue;
  } catch {
    return null;
  }
}

export function summarizeDiffFromText(leftText: string, rightText: string): DiffSummary | null {
  const left = tryParseJson(leftText);
  const right = tryParseJson(rightText);
  // Empty side treated as {}
  const l = left ?? (leftText.trim() ? null : {});
  const r = right ?? (rightText.trim() ? null : {});
  if (l === null || r === null) return null;
  return summarizeDiff(l, r);
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
      : { error: "One or both sides are not valid JSON — structural path diff unavailable." },
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
