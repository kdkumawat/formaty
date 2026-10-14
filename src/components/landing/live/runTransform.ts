import { explainProblem } from "@/lib/formats/explain";
import { parseInput, stringifyOutput, type FormatKind, type InputFormatKind } from "@/lib/formats";
import { flattenJson, generateTypes, inferJsonSchema, minifyJson, removeEmptyDeep, unflattenJson, type JsonValue } from "@/lib/json/core";
import { generateSql, type SqlDialect } from "@/lib/json/generate/sql";
import type { OutputId } from "@/components/workspace/constants";

export interface Opts {
  indent: number;
  quote: "double" | "single";
  sortKeys: boolean;
  removeEmpty: boolean;
  table: string;
  dialect: SqlDialect;
  typeName: string;
}
export const DEFAULTS: Opts = { indent: 2, quote: "double", sortKeys: false, removeEmpty: false, table: "", dialect: "postgres", typeName: "" };

export type Run = { ok: true; output: string; data: JsonValue } | { ok: false; error: string };

/** The same pure functions the playground's worker calls. */
export function run(text: string, kind: InputFormatKind, sel: OutputId, o: Opts): Run {
  try {
    if (kind === "curl") throw new Error("A cURL command is sent from the playground, where it can be run and turned into code.");
    let data: JsonValue;
    try {
      data = parseInput(text, kind);
    } catch (e) {
      // Same plain wording as the playground.
      return { ok: false, error: explainProblem({ input: text, raw: e instanceof Error ? e.message : "", format: kind, forced: null }).message };
    }
    const [group, key] = sel.split(":");
    let output: string;
    if (group === "fmt") {
      const d = o.removeEmpty ? removeEmptyDeep(data) : data;
      output = stringifyOutput(d, key as FormatKind, { indentation: o.indent, quoteStyle: o.quote, sortKeys: o.sortKeys });
    } else if (sel === "type:sql") {
      output = generateSql(data, { dialect: o.dialect, tableName: o.table.trim() || undefined });
    } else if (group === "type") {
      output = generateTypes(data, key as Parameters<typeof generateTypes>[1], o.typeName.trim() || "JsonData");
    } else if (sel === "op:schema") output = JSON.stringify(inferJsonSchema(data), null, 2);
    else if (sel === "op:flatten") output = JSON.stringify(flattenJson(data), null, 2);
    else if (sel === "op:unflatten") output = JSON.stringify(unflattenJson(data as Record<string, JsonValue>), null, 2);
    else if (sel === "op:minify") output = minifyJson(data);
    else throw new Error("This output needs more room. Open the playground to use it.");
    return { ok: true, output, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not read this input." };
  }
}
