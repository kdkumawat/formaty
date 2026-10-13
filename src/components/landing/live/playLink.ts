import { encodeState, SHARE_TOO_LARGE, type WorkspaceState } from "@/lib/shareState";

/**
 * A /playground link that opens with the visitor's current data. The data rides in the
 * URL hash, which the browser never sends to a server. Falls back to the plain preset
 * link when the state is too large for a URL.
 */
export function playHref(state: Partial<WorkspaceState>, fallback = "/playground"): string {
  const hash = encodeState({ input: "", ...state });
  return hash === SHARE_TOO_LARGE ? fallback : `/playground#${hash}`;
}

/** The fields of a TOOL_PRESETS entry that the shared-state hash understands. */
export function presetState(p: Record<string, unknown>): Partial<WorkspaceState> {
  const keys = [
    "convertToFormat", "outputLanguage", "typeLanguage", "viewMode", "activeOperation", "diffKind",
  ] as const;
  const out: Record<string, unknown> = {};
  for (const k of keys) if (p[k] !== undefined) out[k] = p[k];
  return out as Partial<WorkspaceState>;
}
