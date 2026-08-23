import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { FormatKind } from "./formats";
import type { TypeTargetLanguage } from "./json/core";
import type { ListParseOptions } from "./json/listCompare";

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
  /** Utils: active util tab. */
  utilTab?: string;
  /** Multi-tab share: list of tabs. */
  tabs?: Array<{ id: string; label: string; num: number; renamed?: boolean }>;
  activeTabId?: string;
  showTabs?: boolean;
  /** Multi-tab snapshots keyed by tab id. */
  tabSnapshots?: Record<string, unknown>;
  /** Preset/recipe state marker (informational - recipes re-run on open). */
  preset?: string;
}

const MAX_UNCOMPRESSED = 100_000;

export function encodeState(state: WorkspaceState): string {
  const json = JSON.stringify(state);
  if (json.length > MAX_UNCOMPRESSED) {
    return "e:" + compressToEncodedURIComponent(json);
  }
  return "j:" + encodeURIComponent(json);
}

export function decodeState(hash: string): WorkspaceState | null {
  if (!hash || hash.length < 2) return null;
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
