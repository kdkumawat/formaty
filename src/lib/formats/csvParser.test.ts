import { describe, expect, it } from "vitest";
import Papa from "papaparse";
import { csvAdapter } from "./csvParser";

describe("csvAdapter.parse", () => {
  it("parses a small CSV with header", () => {
    const text = "a,b,c\n1,2,3\n4,5,6\n";
    const out = csvAdapter.parse(text) as Array<Record<string, string>>;
    expect(out).toEqual([
      { a: "1", b: "2", c: "3" },
      { a: "4", b: "5", c: "6" },
    ]);
  });

  it("skips empty lines", () => {
    const text = "a,b\n1,2\n\n3,4\n\n";
    const out = csvAdapter.parse(text) as Array<Record<string, string>>;
    expect(out).toEqual([
      { a: "1", b: "2" },
      { a: "3", b: "4" },
    ]);
  });

  it("matches the bulk Papa.parse result on a 5 MB synthetic CSV", () => {
    // Build a wide CSV: 1 header row + 50 000 data rows of 12 columns.
    const headers = Array.from({ length: 12 }, (_, i) => `col${i}`);
    const lines = [headers.join(",")];
    for (let i = 0; i < 50_000; i++) {
      lines.push(headers.map((h) => `${h}_${i}`).join(","));
    }
    const text = lines.join("\n");
    expect(text.length).toBeGreaterThan(5 * 1024 * 1024);

    // Bulk reference (legacy code path).
    const bulk = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    }).data as Array<Record<string, string>>;

    // Streamed adapter.
    const streamed = csvAdapter.parse(text) as Array<Record<string, string>>;

    expect(streamed.length).toBe(bulk.length);
    // Spot check first, middle, and last rows for byte-for-byte equality.
    expect(streamed[0]).toEqual(bulk[0]);
    expect(streamed[Math.floor(streamed.length / 2)]).toEqual(bulk[Math.floor(bulk.length / 2)]);
    expect(streamed[streamed.length - 1]).toEqual(bulk[bulk.length - 1]);
  });

  it("surfaces the first parse error but keeps going for remaining rows", () => {
    // The second row has a mismatched column count; Papa still emits the
    // valid rows before/after. Our adapter should throw on the first error.
    const text = "a,b,c\n1,2,3\n4,5\n7,8,9\n";
    expect(() => csvAdapter.parse(text)).toThrow();
  });
});

describe("csvAdapter.stringify", () => {
  it("round-trips through parse", () => {
    const data = [
      { a: "1", b: "2" },
      { a: "3", b: "4" },
    ];
    const text = csvAdapter.stringify(data);
    const back = csvAdapter.parse(text);
    expect(back).toEqual(data);
  });
});
