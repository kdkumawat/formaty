import type { JsonValue } from "@/lib/json/core";
import type { CustomTool } from "./kinds";

/**
 * Runs the real function for the custom scenes (query, cURL code, diff, schema check). Every branch
 * imports its own module on first use. Throws a plain Error on bad input; the caller shows the message
 * and keeps the last good result.
 */
export async function runCustom(tool: CustomTool, a: string, b: string, option: string): Promise<string> {
  switch (tool) {
    case "query": {
      const [{ parseJsonInput, formatJson }, { runQuery }] = await Promise.all([
        import("@/lib/json/core"),
        import("@/lib/query/runQuery"),
      ]);
      const out = runQuery(parseJsonInput(a), b, option as "jsonpath" | "jmespath");
      return typeof out === "string" ? out : formatJson(out as JsonValue);
    }
    case "curl": {
      const [{ parseCurl }, { generateCurlCode }] = await Promise.all([
        import("@/lib/curl/parseCurl"),
        import("@/lib/curl/codegen"),
      ]);
      const parsed = parseCurl(a);
      if (!parsed.url) throw new Error("No URL found. Start with: curl https://...");
      return generateCurlCode(parsed, option as "fetch" | "axios" | "python" | "go");
    }
    case "diff": {
      const { summarizeDiffFromText } = await import("@/lib/json/diff");
      const s = summarizeDiffFromText(a, b);
      if (!s) throw new Error("Both sides must be valid JSON, YAML, XML, TOML or CSV.");
      if (!s.total) return "No differences.";
      const head = `${s.total} differences: ${s.added} added, ${s.removed} removed, ${s.changed} changed`;
      const rows = s.rows.map((r) =>
        r.change === "added" ? `+ ${r.path}: ${r.right}` : r.change === "removed" ? `- ${r.path}: ${r.left}` : `~ ${r.path}: ${r.left} -> ${r.right}`,
      );
      return [head, "", ...rows].join("\n");
    }
    case "validate": {
      const [{ parseJsonInput }, { default: Ajv }] = await Promise.all([import("@/lib/json/core"), import("ajv")]);
      const check = new Ajv({ allErrors: true, strict: false }).compile(parseJsonInput(b) as object);
      if (check(parseJsonInput(a))) return "Valid. The document matches the schema.";
      return (check.errors ?? []).map((e) => `${e.instancePath || "(root)"} ${e.message ?? "is invalid"}`).join("\n");
    }
  }
}
