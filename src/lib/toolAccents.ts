/**
 * Per-tool accent colors for tool/util landing pages.
 * One accent hue per tool keeps every page visually unique while staying in
 * the same design language as the landing page (hero grid + gradient + blobs).
 */
export interface ToolAccent {
  /** Tailwind text color class for the accent. */
  text: string;
  /** Solid bg + white text (buttons, badges). */
  solid: string;
  /** Border color class. */
  border: string;
  /** Soft tinted bg class. */
  soft: string;
  /** Raw rgb triplet for inline rgba() gradients/glyphs. */
  rgb: string;
  /** Syntax colors used inside code windows. */
  key: string;
  value: string;
}

const base = (
  text: string,
  solid: string,
  border: string,
  soft: string,
  rgb: string,
  key = "text-sky-500",
  value = "text-emerald-500",
): ToolAccent => ({ text, solid, border, soft, rgb, key, value });

export const TOOL_ACCENTS: Record<string, ToolAccent> = {
  // ── Tool pages ──────────────────────────────────────────────
  "json-formatter":           base("text-amber-500",    "bg-amber-500",    "border-amber-500/30",    "bg-amber-500/10",    "245, 158, 11"),
  "json-viewer":              base("text-emerald-500",  "bg-emerald-500",  "border-emerald-500/30",  "bg-emerald-500/10",  "16, 185, 129"),
  "json-diff":                base("text-rose-500",     "bg-rose-500",     "border-rose-500/30",     "bg-rose-500/10",     "244, 63, 94", "text-rose-400"),
  "json-to-typescript":       base("text-violet-500",   "bg-violet-500",   "border-violet-500/30",   "bg-violet-500/10",   "139, 92, 246"),
  "jsonpath-tester":          base("text-sky-500",      "bg-sky-500",      "border-sky-500/30",      "bg-sky-500/10",      "14, 165, 233"),
  "graph-viewer":             base("text-cyan-500",     "bg-cyan-500",     "border-cyan-500/30",     "bg-cyan-500/10",     "6, 182, 212"),
  "api-import":               base("text-sky-500",      "bg-sky-500",      "border-sky-500/30",      "bg-sky-500/10",      "14, 165, 233", "text-violet-400"),
  "schema-generator":         base("text-fuchsia-500",  "bg-fuchsia-500",  "border-fuchsia-500/30",  "bg-fuchsia-500/10",  "217, 70, 239"),
  "json-to-xml":              base("text-red-500",      "bg-red-500",      "border-red-500/30",      "bg-red-500/10",      "239, 68, 68"),
  "xml-to-json":              base("text-orange-500",   "bg-orange-500",   "border-orange-500/30",   "bg-orange-500/10",   "249, 115, 22"),
  "json-to-yaml":             base("text-lime-600",     "bg-lime-600",     "border-lime-600/30",     "bg-lime-600/10",     "132, 204, 22"),
  "yaml-to-json":             base("text-teal-500",     "bg-teal-500",     "border-teal-500/30",     "bg-teal-500/10",     "20, 184, 166"),
  "json-to-toml":             base("text-indigo-500",   "bg-indigo-500",   "border-indigo-500/30",   "bg-indigo-500/10",   "99, 102, 241"),
  "toml-to-json":             base("text-indigo-500",   "bg-indigo-500",   "border-indigo-500/30",   "bg-indigo-500/10",   "99, 102, 241"),
  "json-to-csv":              base("text-blue-500",     "bg-blue-500",     "border-blue-500/30",     "bg-blue-500/10",     "59, 130, 246"),
  "csv-to-json":              base("text-indigo-500",   "bg-indigo-500",   "border-indigo-500/30",   "bg-indigo-500/10",   "99, 102, 241"),
  "xml-formatter":            base("text-red-500",      "bg-red-500",      "border-red-500/30",      "bg-red-500/10",      "239, 68, 68"),
  "yaml-formatter":           base("text-lime-600",     "bg-lime-600",     "border-lime-600/30",     "bg-lime-600/10",     "132, 204, 22"),
  "toml-formatter":           base("text-teal-500",     "bg-teal-500",     "border-teal-500/30",     "bg-teal-500/10",     "20, 184, 166"),
  "csv-formatter":            base("text-blue-500",     "bg-blue-500",     "border-blue-500/30",     "bg-blue-500/10",     "59, 130, 246"),
  "compare-lists":            base("text-purple-500",   "bg-purple-500",   "border-purple-500/30",   "bg-purple-500/10",   "168, 85, 247"),
  "sql-in-clause-generator":  base("text-amber-500",    "bg-amber-500",    "border-amber-500/30",    "bg-amber-500/10",    "245, 158, 11"),
  "json-to-sql":              base("text-amber-500",    "bg-amber-500",    "border-amber-500/30",    "bg-amber-500/10",    "245, 158, 11"),
  "json-to-go":               base("text-cyan-500",     "bg-cyan-500",     "border-cyan-500/30",     "bg-cyan-500/10",     "6, 182, 212"),
  "json-to-python":           base("text-emerald-500",  "bg-emerald-500",  "border-emerald-500/30",  "bg-emerald-500/10",  "16, 185, 129"),
  "compare-ids":              base("text-purple-500",   "bg-purple-500",   "border-purple-500/30",   "bg-purple-500/10",   "168, 85, 247"),
  "find-duplicates-in-list":  base("text-purple-500",   "bg-purple-500",   "border-purple-500/30",   "bg-purple-500/10",   "168, 85, 247"),
  "sql-values-generator":     base("text-amber-500",    "bg-amber-500",    "border-amber-500/30",    "bg-amber-500/10",    "245, 158, 11"),
  "json-to-zod":              base("text-orange-500",   "bg-orange-500",   "border-orange-500/30",   "bg-orange-500/10",   "249, 115, 22"),
  "json-to-java":             base("text-red-500",      "bg-red-500",      "border-red-500/30",      "bg-red-500/10",      "239, 68, 68"),
  "json-to-csharp":           base("text-violet-500",   "bg-violet-500",   "border-violet-500/30",   "bg-violet-500/10",   "139, 92, 246"),
  "json-to-pydantic":         base("text-emerald-500",  "bg-emerald-500",  "border-emerald-500/30",  "bg-emerald-500/10",  "16, 185, 129"),
  "json-to-protobuf":         base("text-blue-400",     "bg-blue-400",     "border-blue-400/30",     "bg-blue-400/10",     "96, 165, 250"),
  "json-schema-validator":    base("text-fuchsia-500",  "bg-fuchsia-500",  "border-fuchsia-500/30",  "bg-fuchsia-500/10",  "217, 70, 239"),
  "json-flattener":           base("text-sky-500",      "bg-sky-500",      "border-sky-500/30",      "bg-sky-500/10",      "14, 165, 233"),
  "compare-csv":              base("text-rose-500",     "bg-rose-500",     "border-rose-500/30",     "bg-rose-500/10",     "244, 63, 94"),
  "csv-column-compare":       base("text-rose-500",     "bg-rose-500",     "border-rose-500/30",     "bg-rose-500/10",     "244, 63, 94"),
  "curl-to-fetch":            base("text-green-500",    "bg-green-500",    "border-green-500/30",    "bg-green-500/10",    "34, 197, 94"),
  "curl-to-axios":            base("text-green-500",    "bg-green-500",    "border-green-500/30",    "bg-green-500/10",    "34, 197, 94"),
  "curl-to-python":           base("text-yellow-500",   "bg-yellow-500",   "border-yellow-500/30",   "bg-yellow-500/10",   "234, 179, 8"),
  "curl-to-go":               base("text-cyan-500",     "bg-cyan-500",     "border-cyan-500/30",     "bg-cyan-500/10",     "6, 182, 212"),

  // ── Util pages ──────────────────────────────────────────────
  "uuid-generator":             base("text-violet-500",  "bg-violet-500",  "border-violet-500/30",  "bg-violet-500/10",  "139, 92, 246"),
  "base64-encoder":             base("text-sky-500",     "bg-sky-500",     "border-sky-500/30",     "bg-sky-500/10",     "14, 165, 233"),
  "jwt-decoder":                base("text-rose-500",    "bg-rose-500",    "border-rose-500/30",    "bg-rose-500/10",    "244, 63, 94"),
  "sha-hash-generator":         base("text-emerald-500", "bg-emerald-500", "border-emerald-500/30", "bg-emerald-500/10", "16, 185, 129"),
  "password-generator":         base("text-amber-500",   "bg-amber-500",   "border-amber-500/30",   "bg-amber-500/10",   "245, 158, 11"),
  "url-encoder-decoder":        base("text-cyan-500",    "bg-cyan-500",    "border-cyan-500/30",    "bg-cyan-500/10",    "6, 182, 212"),
  "text-case-converter":        base("text-fuchsia-500", "bg-fuchsia-500", "border-fuchsia-500/30", "bg-fuchsia-500/10", "217, 70, 239"),
  "regex-tester":               base("text-rose-500",    "bg-rose-500",    "border-rose-500/30",    "bg-rose-500/10",    "244, 63, 94"),
  "json-string-escape":         base("text-sky-500",     "bg-sky-500",     "border-sky-500/30",     "bg-sky-500/10",     "14, 165, 233"),
  "html-encoder":               base("text-orange-500",  "bg-orange-500",  "border-orange-500/30",  "bg-orange-500/10",  "249, 115, 22"),
  "hex-converter":              base("text-emerald-500", "bg-emerald-500", "border-emerald-500/30", "bg-emerald-500/10", "16, 185, 129"),
  "number-base-converter":      base("text-teal-500",    "bg-teal-500",    "border-teal-500/30",    "bg-teal-500/10",    "20, 184, 166"),
  "url-parser":                 base("text-cyan-500",    "bg-cyan-500",    "border-cyan-500/30",    "bg-cyan-500/10",    "6, 182, 212"),
  "color-converter":            base("text-pink-500",    "bg-pink-500",    "border-pink-500/30",    "bg-pink-500/10",    "236, 72, 153"),
  "cron-expression-explainer":  base("text-lime-600",    "bg-lime-600",    "border-lime-600/30",    "bg-lime-600/10",    "132, 204, 22"),
  "lorem-ipsum-generator":      base("text-violet-500",  "bg-violet-500",  "border-violet-500/30",  "bg-violet-500/10",  "139, 92, 246"),
  "text-stats":                 base("text-sky-500",     "bg-sky-500",     "border-sky-500/30",     "bg-sky-500/10",     "14, 165, 233"),

  // ── Instant (utils/instant) ─────────────────────────────────
  instant:                      base("text-sky-500",     "bg-sky-500",     "border-sky-500/30",     "bg-sky-500/10",     "14, 165, 233"),
};

export function getToolAccent(route: string): ToolAccent {
  return TOOL_ACCENTS[route] ?? base("text-sky-500", "bg-sky-500", "border-sky-500/30", "bg-sky-500/10", "14, 165, 233");
}
