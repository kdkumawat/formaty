import Papa from "papaparse";
import type { FormatAdapter } from "./types";
import type { JsonValue } from "@/lib/json/core";
import { toCsv } from "@/lib/json/core";

export const csvAdapter: FormatAdapter = {
  kind: "csv",
  parse(input: string): JsonValue {
    const result = Papa.parse(input, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });
    if (result.errors.length > 0) {
      throw new Error(result.errors[0].message ?? "CSV parse error");
    }
    return (result.data as Record<string, string>[]) as JsonValue;
  },
  stringify(data: JsonValue, options?: Parameters<FormatAdapter["stringify"]>[1]): string {
    return toCsv(data, options?.csvDelimiter ?? ",");
  },
};
