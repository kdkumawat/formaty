import type { FormatAdapter } from "./types";
import type { JsonValue } from "@/lib/json/core";
import { formatJson, parseJsonInput } from "@/lib/json/core";

export const jsonAdapter: FormatAdapter = {
  kind: "json",
  parse(input: string): JsonValue {
    return parseJsonInput(input);
  },
  stringify(data: JsonValue, options?: Parameters<FormatAdapter["stringify"]>[1]): string {
    return formatJson(data, {
      indentation: options?.indentation ?? 2,
      quoteStyle: options?.quoteStyle ?? "double",
      sortKeys: options?.sortKeys ?? false,
    });
  },
};
