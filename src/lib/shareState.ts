import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { FormatKind } from "./formats";
import type { TypeTargetLanguage } from "./json/core";
import type { ListBucket, ListParseOptions } from "./json/listCompare";

/** Valid values for the shared `compareActiveBucket` field. */
export const COMPARE_BUCKETS: readonly ListBucket[] = [
  "common",
  "leftOnly",
  "rightOnly",
  "union",
  "symmetric",
  "leftDupes",
  "rightDupes",
  "changed",
  "summary",
] as const;

export type OutputDisplayKind = FormatKind | TypeTargetLanguage | "plaintext";

export type OperationAction =
  | "format" | "beautify" | "minify" | "sort" | "sortArrays" | "dedup" | "removeEmpty" | "flatten" | "unflatten"
  | "diff" | "utils" | "schema" | "validate" | "generateTypes";

export interface WorkspaceState {
  input: string;
  convertToFormat?: FormatKind;
  liveTransform?: boolean;
  output?: string;
  outputFormat?: FormatKind;
  outputLanguage?: OutputDisplayKind; // for type output: typescript, java, etc.
  typeLanguage?: TypeTargetLanguage;
  viewMode?: "raw" | "tree" | "graph" | "query" | "table";
  activeOperation?: OperationAction;
  split?: number;
  /** Query-view query text (preserved in shared links when present). */
  queryText?: string;
  /** Compare: which comparison mode was active. */
  diffKind?: "document" | "list" | "single";
  /** Compare: list parsing options (only non-default fields are stored). */
  listCompareOptions?: Partial<ListParseOptions>;
  /** Compare: CSV column selected for column compare. */
  csvColumn?: string;
  /** Compare: literal left/right inputs (single-tab share). */
  diffLeftInput?: string;
  diffRightInput?: string;
  /** Compare: bucket currently shown in the per-bucket view (e.g. "common", "leftOnly"). */
  compareActiveBucket?: ListBucket;
  /** Compare: custom user labels for the Left and Right list panes (per active tab). */
  leftLabel?: string;
  rightLabel?: string;
  /** Utils: active util tab. */
  utilTab?: string;
  /** Multi-tab share: list of tabs. */
  tabs?: Array<{ id: string; label: string; num: number; renamed?: boolean; leftLabel?: string; rightLabel?: string; compareActiveBucket?: ListBucket }>;
  activeTabId?: string;
  showTabs?: boolean;
  /** Multi-tab snapshots keyed by tab id. */
  tabSnapshots?: Record<string, unknown>;
  /** Preset/recipe state marker (informational - recipes re-run on open). */
  preset?: string;
}

const MAX_UNCOMPRESSED = 100_000;

/** Conservative browser URL length cap. Beyond this, `window.location.hash`
 *  is silently truncated, so we refuse to emit a hash and let the caller
 *  surface a "share too large" toast. */
export const MAX_SHARE_HASH_CHARS = 32_000;

/** Sentinel returned by `encodeState` when the hash would exceed
 *  `MAX_SHARE_HASH_CHARS`. Callers should check for this and not update the URL. */
export const SHARE_TOO_LARGE = "TOO_LARGE";

export function encodeState(state: WorkspaceState): string {
  const json = JSON.stringify(state);
  let hash: string;
  if (json.length > MAX_UNCOMPRESSED) {
    hash = "e:" + compressToEncodedURIComponent(json);
  } else {
    hash = "j:" + encodeURIComponent(json);
  }
  if (hash.length > MAX_SHARE_HASH_CHARS) {
    return SHARE_TOO_LARGE;
  }
  return hash;
}

export function decodeState(hash: string): WorkspaceState | null {
  if (!hash || hash === SHARE_TOO_LARGE || hash.length < 2) return null;
  try {
    const prefix = hash.slice(0, 2);
    const payload = hash.slice(2);
    if (prefix === "j:") {
      return JSON.parse(decodeURIComponent(payload)) as WorkspaceState;
    }
    if (prefix === "e:") {
      const decompressed = decompressFromEncodedURIComponent(payload);
      return decompressed ? (JSON.parse(decompressed) as WorkspaceState) : null;
    }
  } catch {
    // ignore
  }
  return null;
}
