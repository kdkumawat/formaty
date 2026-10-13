import Papa from "papaparse";
import type { FormatAdapter } from "./types";
import type { JsonValue } from "@/lib/json/core";
import { toCsv } from "@/lib/json/core";

export const csvAdapter: FormatAdapter = {
  kind: "csv",
  parse(input: string): JsonValue {
    // Stream row-by-row via Papa's `step` callback. The parser is synchronous
    // and walks the input in 10kB chunks internally; pushing to a string[]
    // buffer avoids the second materialization pass that the bulk API does
    // before returning `data`. Surfaces the first error without aborting the
    // whole parse — the parser keeps going for the remaining rows.
    const rows: Record<string, string>[] = [];
    let firstError: Papa.ParseError | null = null;
    Papa.parse<Record<string, string>>(input, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      step: (result) => {
        // A single column has no delimiter to detect: that is fine, not an error.
        const err = result.errors.find((e) => e.code !== "UndetectableDelimiter");
        if (firstError === null && err) firstError = err;
        if (result.data) rows.push(result.data);
      },
    });
    if (firstError) {
      const { message, row } = firstError as Papa.ParseError;
      // `row` counts data rows from zero; the header is line 1 (quoted line breaks can shift this).
      throw new Error(typeof row === "number" ? `${message} (line ${row + 2})` : message);
    }
    return rows as JsonValue;
  },
  stringify(data: JsonValue, options?: Parameters<FormatAdapter["stringify"]>[1]): string {
    return toCsv(data, options?.csvDelimiter ?? ",");
  },
};
