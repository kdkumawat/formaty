import type { CopyAsFormat } from "@/components/workspace/OutputActionBar";

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
export function formatCopyItemsAsText(items: string[], format: CopyAsFormat): string {
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
