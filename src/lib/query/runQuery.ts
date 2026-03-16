import { JSONPath } from "jsonpath-plus";
import * as jmespath from "jmespath";
import type { JsonValue } from "@/lib/json/core";

export type QueryLanguage = "jsonpath" | "jmespath";

export function runQuery(
  data: JsonValue,
  query: string,
  lang: QueryLanguage
): JsonValue {
  const trimmed = query.trim();
  if (!trimmed) return data;

  try {
    if (lang === "jsonpath") {
      const result = JSONPath({
        path: trimmed,
        json: data,
        resultType: "value",
      });
      return result as JsonValue;
    }
    if (lang === "jmespath") {
      const result = jmespath.search(data as object, trimmed);
      return result as JsonValue;
    }
  } catch (e) {
    throw e;
  }
  return data;
}
