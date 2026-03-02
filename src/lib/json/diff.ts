import type { JsonValue } from "@/lib/json/core";

export interface DiffRow {
  path: string;
  left: string;
  right: string;
  change: "added" | "removed" | "changed";
}

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

  if (leftIsObj && rightIsObj) {
    const leftObj = left as Record<string, JsonValue>;
    const rightObj = right as Record<string, JsonValue>;
    const keys = new Set([...Object.keys(leftObj), ...Object.keys(rightObj)]);
    keys.forEach((key) => {
      const nextPath = path ? `${path}.${key}` : key;
      walk(leftObj[key], rightObj[key], nextPath, out);
    });
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
  const out: DiffRow[] = [];
  walk(left, right, "$", out);
  return out.slice(0, 2000);
}
