import type { FormatAdapter } from "./types";
import type { JsonValue } from "@/lib/json/core";
import { formatJson } from "@/lib/json/core";

export const jsonAdapter: FormatAdapter = {
  kind: "json",
  parse(input: string): JsonValue {
    return JSON.parse(input) as JsonValue;
  },
  stringify(data: JsonValue, options?: Parameters<FormatAdapter["stringify"]>[1]): string {
    return formatJson(data, {
      indentation: options?.indentation ?? 2,
      quoteStyle: options?.quoteStyle ?? "double",
      sortKeys: options?.sortKeys ?? false,
    });
  },
};
