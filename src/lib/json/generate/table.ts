import type { JsonValue } from "../core";
import { StringBuilder } from "../streaming";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeMarkdownCell(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

function tableRows(input: JsonValue): { rows: Record<string, JsonValue>[]; headers: string[] } {
  const raw = Array.isArray(input)
    ? input
    : typeof input === "object" && input !== null
      ? [input]
      : [{ value: input }];
  const rows = raw.filter(
    (item) => item !== null && typeof item === "object" && !Array.isArray(item),
  ) as Record<string, JsonValue>[];
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  return { rows, headers };
}

/** Render an array of objects (or a single object) as a GitHub-style Markdown table. */
export function toMarkdownTable(input: JsonValue): string {
  const { rows, headers } = tableRows(input);
  if (rows.length === 0 || headers.length === 0) return "";
  const out = new StringBuilder();
  out.push("| ");
  for (let i = 0; i < headers.length; i++) {
    if (i > 0) out.push(" | ");
    out.push(escapeMarkdownCell(headers[i]));
  }
  out.push(" |\n| ");
  for (let i = 0; i < headers.length; i++) {
    if (i > 0) out.push(" | ");
    out.push("---");
  }
  out.push(" |\n");
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (r > 0) out.push("\n");
    out.push("| ");
    for (let i = 0; i < headers.length; i++) {
      if (i > 0) out.push(" | ");
      const v = row[headers[i]];
      const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      out.push(escapeMarkdownCell(s));
    }
    out.push(" |");
  }
  return out.toString();
}

/** Render an array of objects (or a single object) as an HTML table. */
export function toHtmlTable(input: JsonValue): string {
  const { rows, headers } = tableRows(input);
  if (rows.length === 0 || headers.length === 0) return "";
  const out = new StringBuilder();
  out.push("<table>\n  <thead>\n    <tr>");
  for (const h of headers) out.push(`<th>${escapeHtml(h)}</th>`);
  out.push("</tr>\n  </thead>\n  <tbody>\n");
  for (const row of rows) {
    out.push("    <tr>");
    for (const h of headers) {
      const v = row[h];
      const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      out.push(`<td>${escapeHtml(s)}</td>`);
    }
    out.push("</tr>\n");
  }
  out.push("  </tbody>\n</table>");
  return out.toString();
}
