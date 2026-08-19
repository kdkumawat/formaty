import type { CopyAsFormat } from "@/components/workspace/OutputActionBar";

/* ── Values x Layout formatting ── */

export type QuoteStyle = "none" | "single" | "double";
export type LayoutStyle = "same-line" | "each-line";

/** Format a list of item values using Quote x Layout. */
export function formatListCopyAsText(
  items: string[],
  quote: QuoteStyle,
  layout: LayoutStyle,
  suffix?: string,
): string {
  if (items.length === 0) return "";
  const separator = layout === "same-line" ? ", " : "\n";
  const sfx = suffix ?? "";
  if (quote === "none") return items.map((i) => i + sfx).join(separator);
  const q = quote === "single" ? "'" : '"';
  const escape =
    quote === "single"
      ? (s: string) => s.replace(/'/g, "\\'")
      : (s: string) => s.replace(/"/g, '\\"');
  return items.map((i) => `${q}${escape(i)}${q}${sfx}`).join(separator);
}

/** Label for the Copy as toolbar hover tooltip. */
export function listCopyFormatLabel(
  quote: QuoteStyle,
  layout: LayoutStyle,
): string {
  const quoteLabel =
    quote === "none" ? "None" : quote === "single" ? "' Single" : '" Double';
  const layoutLabel = layout === "same-line" ? "Same line" : "Each line";
  return `${quoteLabel} \u00b7 ${layoutLabel}`;
}

/* ── Per-mode persistence ── */

export type CopyPref = { quote: QuoteStyle; layout: LayoutStyle; suffix?: string } | "as-seen";

const DEFAULT_PREF: CopyPref = "as-seen";
const PREF_PREFIX = "formaty-copy-pref-";

export function loadListCopyPref(mode: string): CopyPref {
  try {
    const raw = localStorage.getItem(`${PREF_PREFIX}${mode}`);
    if (!raw) return DEFAULT_PREF;
    const raw2 = JSON.parse(raw);
    if (raw2 === "as-seen" || (typeof raw2 === "object" && raw2.quote === undefined)) return "as-seen";
    if (typeof raw2 === "object" && raw2.quote) return { quote: raw2.quote, layout: raw2.layout ?? "each-line", suffix: raw2.suffix };
    return DEFAULT_PREF;
  } catch {
    return DEFAULT_PREF;
  }
}

export function saveListCopyPref(mode: string, pref: CopyPref): void {
  try {
    localStorage.setItem(`${PREF_PREFIX}${mode}`, JSON.stringify(pref));
  } catch {
    /* ignore */
  }
}

/* ── Legacy CopyAsFormat support (encode formats) ── */

export function formatCopyAsText(raw: string, format: CopyAsFormat): string {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const items = lines.length > 0 ? lines : raw.trim() ? [raw.trim()] : [];

  switch (format) {
    case "base64":
      return btoa(unescape(encodeURIComponent(raw)));
    case "escaped":
      return JSON.stringify(raw);
    case "uri":
      return encodeURIComponent(raw);
    case "datauri":
      return `data:text/plain;base64,${btoa(unescape(encodeURIComponent(raw)))}`;
    case "newline":
      return items.join("\n");
    case "comma":
      return items.join(", ");
    case "single-quotes":
      return items.map((i) => `'${i.replace(/'/g, "\\'")}'`).join("\n");
    case "double-quotes":
      return items.map((i) => `"${i.replace(/"/g, '\\"')}"`).join("\n");
    case "comma-single":
      return items.map((i) => `'${i.replace(/'/g, "\\'")}'`).join(", ");
    case "comma-double":
      return items.map((i) => `"${i.replace(/"/g, '\\"')}"`).join(", ");
    case "json-array":
      return JSON.stringify(items, null, 2);
    case "sql-in-single":
      return `IN (${items.map((i) => `'${i.replace(/'/g, "''")}'`).join(", ")})`;
    case "sql-in-double":
      return `IN (${items.map((i) => `"${i.replace(/"/g, '""')}"`).join(", ")})`;
    default:
      return raw;
  }
}

/**
 * Format already-parsed item values (e.g. list compare buckets) without
 * re-splitting/trimming - values are preserved exactly as shown.
 */
export function formatCopyItemsAsText(
  items: string[],
  format: CopyAsFormat,
): string {
  switch (format) {
    case "newline":
      return items.join("\n");
    case "comma":
      return items.join(", ");
    case "single-quotes":
      return items.map((i) => `'${i.replace(/'/g, "\\'")}'`).join("\n");
    case "double-quotes":
      return items.map((i) => `"${i.replace(/"/g, '\\"')}"`).join("\n");
    case "comma-single":
      return items.map((i) => `'${i.replace(/'/g, "\\'")}'`).join(", ");
    case "comma-double":
      return items.map((i) => `"${i.replace(/"/g, '\\"')}"`).join(", ");
    case "json-array":
      return JSON.stringify(items, null, 2);
    case "sql-in-single":
      return `IN (${items.map((i) => `'${i.replace(/'/g, "''")}'`).join(", ")})`;
    case "sql-in-double":
      return `IN (${items.map((i) => `"${i.replace(/"/g, '""')}"`).join(", ")})`;
    default:
      return items.join("\n");
  }
}
