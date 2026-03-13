import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { FormatKind } from "./formats";
import type { TypeTargetLanguage } from "./json/core";

export interface WorkspaceState {
  input: string;
  convertToFormat?: FormatKind;
  liveTransform?: boolean;
  output?: string;
  outputFormat?: FormatKind;
  typeLanguage?: TypeTargetLanguage;
  viewMode?: "raw" | "tree" | "graph";
  split?: number;
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
