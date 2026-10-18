import type { OperationAction } from "@/components/workspace/constants";

/**
 * Detect leftover internal path-diff payloads that used to be written into the main
 * output panel (including concatenated duplicates stuck in localStorage).
 */
export function isStaleDiffOutput(text: string | null | undefined): boolean {
  if (!text || !text.trim()) return false;
  const t = text.trim();
  if (t.includes("Structural path diff requires valid JSON")) return true;
  if (t.includes('"leftValid"') && t.includes('"rightValid"') && t.includes('"note"')) return true;
  // Former structural report shape written only for visual-diff bookkeeping
  if (
    t.includes('"summary"') &&
    t.includes('"changes"') &&
    (t.includes('"truncated"') || t.includes('"added"')) &&
    t.includes('"path"') &&
    t.includes('"change"')
  ) {
    // Heuristic: only treat as stale if it looks like our internal export (not user data)
    try {
      const first = t.startsWith("{") ? JSON.parse(t.slice(0, t.indexOf("}\n{") > 0 ? t.indexOf("}\n{") + 1 : undefined)) : null;
      if (first && typeof first === "object" && first !== null && "summary" in first && "changes" in first) {
        return true;
      }
    } catch {
      /* fall through */
    }
  }
  return false;
}

export function cleanSessionOutput(text: string | null | undefined): string {
  if (!text) return "";
  return isStaleDiffOutput(text) ? "" : text;
}

/** Outputs that stay selected when the input changes: they re-run instead of falling back to a plain format. */
export const STICKY_OPS: OperationAction[] = ["generateTypes", "schema", "openapi", "validate", "flatten", "unflatten", "minify"];
