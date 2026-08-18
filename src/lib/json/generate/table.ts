import type { JsonValue } from "../core";

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
  const header = `| ${headers.map(escapeMarkdownCell).join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) =>
    `| ${headers
      .map((h) => {
        const v = row[h];
        const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
        return escapeMarkdownCell(s);
      })
      .join(" | ")} |`,
  );
  return [header, divider, ...body].join("\n");
}

/** Render an array of objects (or a single object) as an HTML table. */
export function toHtmlTable(input: JsonValue): string {
  const { rows, headers } = tableRows(input);
  if (rows.length === 0 || headers.length === 0) return "";
  const thead = `    <tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>`;
  const tbody = rows
    .map((row) => {
      const cells = headers
        .map((h) => {
          const v = row[h];
          const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
          return `<td>${escapeHtml(s)}</td>`;
        })
        .join("");
      return `    <tr>${cells}</tr>`;
    })
    .join("\n");
  return ["<table>", "  <thead>", thead, "  </thead>", "  <tbody>", tbody, "  </tbody>", "</table>"].join("\n");
}
