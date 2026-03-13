import yaml from "js-yaml";
import type { FormatAdapter } from "./types";
import type { JsonValue } from "@/lib/json/core";

export const yamlAdapter: FormatAdapter = {
  kind: "yaml",
  parse(input: string): JsonValue {
    return yaml.load(input) as JsonValue;
  },
  stringify(data: JsonValue, options?: Parameters<FormatAdapter["stringify"]>[1]): string {
    const indent = Math.max(1, Math.min(10, options?.indentation ?? 2));
    return yaml.dump(data, { lineWidth: -1, indent });
  },
};
