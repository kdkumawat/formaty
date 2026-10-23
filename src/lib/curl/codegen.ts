/**
 * Code generation from a parsed cURL command.
 *
 * Emitters are registered in CURL_TARGETS so additional languages can be
 * added without touching the UI. Each emitter returns complete, copy-ready
 * source for the request described by `parsed`.
 */
import type { CurlParsed } from "./parseCurl";

export type CurlTargetId = "fetch" | "axios" | "python" | "go";

export interface CurlTarget {
  id: CurlTargetId;
  label: string;
  /** Short label for tight UI buttons, e.g. "fetch" or "Python". */
  short: string;
  /** File extension for downloads. */
  ext: string;
  /** Tool page route when one exists (e.g. /curl-to-fetch). */
  seoRoute?: string;
}

export const CURL_TARGETS: CurlTarget[] = [
  { id: "fetch", label: "JavaScript fetch", short: "fetch", ext: "js", seoRoute: "curl-to-fetch" },
  { id: "axios", label: "Axios (Node/browser)", short: "axios", ext: "js", seoRoute: "curl-to-axios" },
  { id: "python", label: "Python requests", short: "Python", ext: "py", seoRoute: "curl-to-python" },
  { id: "go", label: "Go net/http", short: "Go", ext: "go", seoRoute: "curl-to-go" },
];

export function getCurlTarget(id: string): CurlTarget | undefined {
  return CURL_TARGETS.find((t) => t.id === id);
}

function looksLikeJson(s: string): boolean {
  const t = s.trim();
  return t.startsWith("{") || t.startsWith("[");
}

function prettyJson(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}

/** Pretty JSON for use inside generated code: lines after the first are indented by `pad` to sit under the property that holds them. */
function nestedJson(s: string, pad: string): string {
  return prettyJson(s).split("\n").join(`\n${pad}`);
}

const PY_LITERALS: Record<string, string> = { true: "True", false: "False", null: "None" };

/** JSON text as a Python literal (4-space indent, True/False/None), or null when it doesn't parse. */
function pythonLiteral(s: string): string | null {
  let value: unknown;
  try {
    value = JSON.parse(s);
  } catch {
    return null;
  }
  return JSON.stringify(value, null, 4).replace(/"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b/g, (t) => PY_LITERALS[t] ?? t);
}

function headerLines(headers: Record<string, string>): string[] {
  return Object.entries(headers).map(([k, v]) => `${k}: ${v}`);
}

/** Quote a string for a single-quoted JS string literal (no line breaks). */
function jsSingle(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}

/** Quote a string for a double-quoted Go string literal (no line breaks). */
function goDouble(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

/**
 * Generate source code for the parsed request in the requested language.
 */
export function generateCurlCode(parsed: CurlParsed, target: CurlTargetId): string {
  const method = parsed.method.toUpperCase();
  const url = parsed.url;
  const headers = headerLines(parsed.headers);
  const hasBody = Boolean(parsed.body && method !== "GET" && method !== "HEAD");
  const body = parsed.body ?? "";

  switch (target) {
    case "fetch": {
      const lines: string[] = ["const response = await fetch("];
      lines.push(`  "${url}",`);
      if (method !== "GET" || headers.length > 0 || hasBody) {
        lines.push("  {");
        if (method !== "GET") lines.push(`    method: "${method}",`);
        if (headers.length > 0) {
          lines.push("    headers: {");
          headers.forEach((h) => {
            const [k, ...rest] = h.split(": ");
            lines.push(`      "${k}": "${jsSingle(rest.join(": "))}",`);
          });
          lines.push("    },");
        }
        if (hasBody) {
          if (looksLikeJson(body)) {
            lines.push(`    body: JSON.stringify(${nestedJson(body, "    ")}),`);
          } else {
            lines.push(`    body: ${JSON.stringify(body)},`);
          }
        }
        lines.push("  }");
      }
      lines.push(");");
      lines.push("");
      lines.push("const data = await response.json();");
      return lines.join("\n");
    }

    case "axios": {
      const lines: string[] = ["import axios from \"axios\";", ""];
      lines.push("const response = await axios.request({");
      lines.push(`  method: "${method}",`);
      lines.push(`  url: "${url}",`);
      if (headers.length > 0) {
        lines.push("  headers: {");
        headers.forEach((h) => {
          const [k, ...rest] = h.split(": ");
          lines.push(`    "${k}": "${jsSingle(rest.join(": "))}",`);
        });
        lines.push("  },");
      }
      if (hasBody) {
        if (looksLikeJson(body)) {
          lines.push(`  data: ${nestedJson(body, "  ")},`);
        } else {
          lines.push(`  data: ${JSON.stringify(body)},`);
        }
      }
      lines.push("});");
      lines.push("");
      lines.push("const data = response.data;");
      return lines.join("\n");
    }

    case "python": {
      const lines: string[] = ["import requests", ""];
      lines.push(`response = requests.request(`);
      lines.push(`    "${method}",`);
      lines.push(`    ${JSON.stringify(url)},`);
      if (headers.length > 0) {
        lines.push("    headers={");
        headers.forEach((h) => {
          const [k, ...rest] = h.split(": ");
          lines.push(`        ${JSON.stringify(k)}: ${JSON.stringify(rest.join(": "))},`);
        });
        lines.push("    },");
      }
      if (hasBody) {
        const py = looksLikeJson(body) ? pythonLiteral(body) : null;
        if (py !== null) {
          lines.push(`    json=${py.split("\n").join("\n    ")},`);
        } else {
          lines.push(`    data=${JSON.stringify(body)},`);
        }
      }
      lines.push(")");
      lines.push("");
      lines.push("data = response.json()");
      return lines.join("\n");
    }

    case "go": {
      const lines: string[] = ["import (", '\t"bytes"', '\t"fmt"', '\t"net/http"', ")", "", "func main() {"];
      const bodyVar = hasBody ? "body" : "";
      if (hasBody) {
        lines.push(`\tbody := []byte(${JSON.stringify(body)})`);
      }
      lines.push(`\treq, err := http.NewRequest("${method}", "${goDouble(url)}", ${bodyVar ? "bytes.NewReader(body)" : "nil"})`);
      lines.push("\tif err != nil {");
      lines.push("\t\tpanic(err)");
      lines.push("\t}");
      headers.forEach((h) => {
        const [k, ...rest] = h.split(": ");
        lines.push(`\treq.Header.Set("${goDouble(k)}", "${goDouble(rest.join(": "))}")`);
      });
      lines.push("\tresp, err := http.DefaultClient.Do(req)");
      lines.push("\tif err != nil {");
      lines.push("\t\tpanic(err)");
      lines.push("\t}");
      lines.push("\tdefer resp.Body.Close()");
      lines.push("\tfmt.Println(resp.Status)");
      lines.push("}");
      return lines.join("\n");
    }

    default:
      return "";
  }
}
