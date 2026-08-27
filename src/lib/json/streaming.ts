/**
 * Iterative, allocation-bounded string + transform helpers for large JSON
 * trees. Used by the worker and the format adapters to keep memory peak
 * close to the input size instead of 2-3x.
 *
 * Public API:
 *  - `StringBuilder` — push-and-join string buffer.
 *  - `stableStringify(value)` — canonical JSON form used as a dedup / sort
 *    key. Sorted object keys, no whitespace.
 *  - `getStableKey(value, cache)` — memoized `stableStringify` per object
 *    reference (so two equal-but-distinct subtrees hash to the same string
 *    without re-stringifying the same subtree N times).
 *  - `formatJsonIter`, `minifyJsonIter` — iterative `formatJson` / `minifyJson`
 *    replacements (signatures match the core.ts exports).
 *  - `toCsvIter` — iterative CSV writer.
 *  - `flattenJsonIter` — iterative stack-based flatten.
 */

/** Minimal `JsonValue` mirror for this module — avoid pulling core.ts here. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export class StringBuilder {
  private chunks: string[] = [];
  private totalLen = 0;

  push(s: string): this {
    if (s.length === 0) return this;
    this.chunks.push(s);
    this.totalLen += s.length;
    return this;
  }

  pushMany(parts: string[], sep = ""): this {
    if (parts.length === 0) return this;
    this.chunks.push(parts.join(sep));
    this.totalLen += parts.reduce((a, p) => a + p.length, 0) + sep.length * (parts.length - 1);
    return this;
  }

  get length(): number {
    return this.totalLen;
  }

  toString(): string {
    if (this.chunks.length === 0) return "";
    if (this.chunks.length === 1) return this.chunks[0]!;
    const out = this.chunks.join("");
    this.chunks = [out];
    return out;
  }
}

/** Canonical JSON form: sorted object keys, no whitespace. */
export function stableStringify(value: JsonValue): string {
  if (value === null) return "null";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "null";
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) {
    let out = "[";
    for (let i = 0; i < value.length; i++) {
      if (i > 0) out += ",";
      out += stableStringify(value[i] as JsonValue);
    }
    return out + "]";
  }
  const obj = value as { [k: string]: JsonValue };
  const keys = Object.keys(obj).sort();
  let out = "{";
  for (let i = 0; i < keys.length; i++) {
    if (i > 0) out += ",";
    out += JSON.stringify(keys[i]!);
    out += ":";
    out += stableStringify(obj[keys[i]!] as JsonValue);
  }
  return out + "}";
}

/**
 * Cache `stableStringify` per object/array reference. Primitives and null
 * are returned inline (the WeakMap can't hold them anyway).
 */
export function getStableKey(value: JsonValue, cache: WeakMap<object, string>): string {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "number") return Number.isFinite(value as number) ? JSON.stringify(value) : "null";
  if (t === "string") return JSON.stringify(value);
  if (t === "boolean") return value ? "true" : "false";
  const ref = value as object;
  const cached = cache.get(ref);
  if (cached !== undefined) return cached;
  const k = stableStringify(value);
  cache.set(ref, k);
  return k;
}

function escapeJsonString(s: string): string {
  // JSON.stringify of a string handles all escaping; reuse it.
  return JSON.stringify(s);
}

/** Iterative JSON formatter. Walks the tree with an explicit stack so the
 *  call stack doesn't grow with input depth. */
export function formatJsonIter(root: JsonValue, indentation: number | string = 2): string {
  const indentUnit =
    typeof indentation === "number" ? Math.max(0, Math.floor(indentation)) : Math.max(0, indentation.length);
  const pad = typeof indentation === "string" ? indentation : " ".repeat(indentUnit);
  const sb = new StringBuilder();

  // Each frame represents one JSON value to emit.
  // `trailingSep` is true when the parent's next child should be preceded by
  // a `,`. The frame emits this separator just before it pops.
  type Frame = {
    value: JsonValue;
    depth: number;
    state: 0 | 1;
    /** if this frame is a property of a parent object, the key */
    key?: string;
    /** if this frame is a child of an array, the original index (informational) */
    index?: number;
    /** whether to emit a trailing separator before popping */
    trailingSep: boolean;
  };

  const stack: Frame[] = [
    { value: root, depth: 0, state: 0, trailingSep: false },
  ];
  while (stack.length > 0) {
    const frame = stack[stack.length - 1]!;
    const v = frame.value;

    if (frame.state === 0) {
      if (v === null || typeof v !== "object") {
        if (frame.key !== undefined) sb.push(escapeJsonString(frame.key)).push(indentUnit > 0 ? ": " : ":");
        sb.push(scalarString(v));
        if (frame.trailingSep) emitSeparator(sb, indentUnit, pad, frame.depth);
        stack.pop();
        continue;
      }
      if (Array.isArray(v)) {
        if (frame.key !== undefined) sb.push(escapeJsonString(frame.key)).push(indentUnit > 0 ? ": " : ":");
        if (v.length === 0) {
          sb.push("[]");
          if (frame.trailingSep) emitSeparator(sb, indentUnit, pad, frame.depth);
          stack.pop();
          continue;
        }
        if (indentUnit > 0) sb.push("[").push("\n").push(pad.repeat(frame.depth + 1));
        else sb.push("[");
        frame.state = 1;
        for (let i = v.length - 1; i >= 0; i--) {
          stack.push({
            value: v[i] as JsonValue,
            depth: frame.depth + 1,
            state: 0,
            index: i,
            trailingSep: i < v.length - 1,
          });
        }
        continue;
      }
      const obj = v as { [k: string]: JsonValue };
      const keys = Object.keys(obj);
      if (frame.key !== undefined) sb.push(escapeJsonString(frame.key)).push(indentUnit > 0 ? ": " : ":");
      if (keys.length === 0) {
        sb.push("{}");
        if (frame.trailingSep) emitSeparator(sb, indentUnit, pad, frame.depth);
        stack.pop();
        continue;
      }
      if (indentUnit > 0) sb.push("{").push("\n").push(pad.repeat(frame.depth + 1));
      else sb.push("{");
      frame.state = 1;
      for (let i = keys.length - 1; i >= 0; i--) {
        const k = keys[i]!;
        stack.push({
          value: obj[k] as JsonValue,
          depth: frame.depth + 1,
          state: 0,
          key: k,
          trailingSep: i < keys.length - 1,
        });
      }
      continue;
    }

    // state === 1: container closed its children. Emit close.
    if (indentUnit > 0) sb.push("\n").push(pad.repeat(frame.depth));
    sb.push(Array.isArray(frame.value) ? "]" : "}");
    if (frame.trailingSep) emitSeparator(sb, indentUnit, pad, frame.depth);
    stack.pop();
  }
  return sb.toString();
}

function emitSeparator(
  sb: StringBuilder,
  indentUnit: number,
  pad: string,
  depth: number,
): void {
  sb.push(",");
  if (indentUnit > 0) sb.push("\n").push(pad.repeat(depth));
}

function scalarString(v: JsonValue): string {
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  return "null";
}

/** Iterative minifier — same walker as formatJsonIter but with `indent=0`. */
export function minifyJsonIter(root: JsonValue): string {
  const sb = new StringBuilder();
  type Frame = {
    value: JsonValue;
    state: 0 | 1;
    key?: string;
    trailingSep: boolean;
  };
  const stack: Frame[] = [{ value: root, state: 0, trailingSep: false }];
  while (stack.length > 0) {
    const frame = stack[stack.length - 1]!;
    const v = frame.value;
    if (frame.state === 0) {
      if (v === null || typeof v !== "object") {
        if (frame.key !== undefined) sb.push(escapeJsonString(frame.key)).push(":");
        sb.push(scalarString(v));
        if (frame.trailingSep) sb.push(",");
        stack.pop();
        continue;
      }
      if (Array.isArray(v)) {
        if (frame.key !== undefined) sb.push(escapeJsonString(frame.key)).push(":");
        if (v.length === 0) {
          sb.push("[]");
          if (frame.trailingSep) sb.push(",");
          stack.pop();
          continue;
        }
        sb.push("[");
        frame.state = 1;
        for (let i = v.length - 1; i >= 0; i--) {
          stack.push({
            value: v[i] as JsonValue,
            state: 0,
            trailingSep: i < v.length - 1,
          });
        }
        continue;
      }
      const obj = v as { [k: string]: JsonValue };
      const keys = Object.keys(obj);
      if (frame.key !== undefined) sb.push(escapeJsonString(frame.key)).push(":");
      if (keys.length === 0) {
        sb.push("{}");
        if (frame.trailingSep) sb.push(",");
        stack.pop();
        continue;
      }
      sb.push("{");
      frame.state = 1;
      for (let i = keys.length - 1; i >= 0; i--) {
        const k = keys[i]!;
        stack.push({
          value: obj[k] as JsonValue,
          state: 0,
          key: k,
          trailingSep: i < keys.length - 1,
        });
      }
      continue;
    }
    sb.push(Array.isArray(frame.value) ? "]" : "}");
    if (frame.trailingSep) sb.push(",");
    stack.pop();
  }
  return sb.toString();
}

/** Iterative CSV writer for a `JsonValue` (array of records expected). */
export function toCsvIter(root: JsonValue, delimiter = ","): string {
  const sb = new StringBuilder();
  if (!Array.isArray(root)) {
    return scalarString(root);
  }
  const headerSet = new Set<string>();
  for (const row of root) {
    if (row && typeof row === "object" && !Array.isArray(row)) {
      for (const k of Object.keys(row as { [k: string]: JsonValue })) headerSet.add(k);
    }
  }
  const headers = Array.from(headerSet);
  sb.push(headers.map(csvCell).join(delimiter)).push("\n");
  for (const row of root) {
    if (row && typeof row === "object" && !Array.isArray(row)) {
      const r = row as { [k: string]: JsonValue };
      sb.push(headers.map((h) => csvCell(r[h] as JsonValue)).join(delimiter)).push("\n");
    } else {
      sb.push(csvCell(row as JsonValue)).push("\n");
    }
  }
  return sb.toString();
}

function csvCell(v: JsonValue): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  const s = String(v);
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/** Iterative flatten — replaces the `Object.assign` recursion. */
export function flattenJsonIter(input: JsonValue, prefix = ""): Record<string, JsonValue> {
  const out: Record<string, JsonValue> = {};
  type Frame = { value: JsonValue; prefix: string };
  const stack: Frame[] = [{ value: input, prefix }];
  while (stack.length > 0) {
    const { value, prefix: p } = stack.pop()!;
    if (Array.isArray(value)) {
      for (let i = value.length - 1; i >= 0; i--) {
        const key = p ? `${p}.${i}` : String(i);
        stack.push({ value: value[i] as JsonValue, prefix: key });
      }
      continue;
    }
    if (value && typeof value === "object") {
      const entries = Object.entries(value as { [k: string]: JsonValue });
      for (let i = entries.length - 1; i >= 0; i--) {
        const [k, v] = entries[i]!;
        const nextKey = p ? `${p}.${k}` : k;
        stack.push({ value: v as JsonValue, prefix: nextKey });
      }
      continue;
    }
    out[p] = value;
  }
  return out;
}
