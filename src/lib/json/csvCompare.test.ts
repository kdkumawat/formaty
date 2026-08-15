import { describe, expect, it } from "vitest";
import {
  compareCsvByColumn,
  detectCsvColumns,
  pickDefaultColumn,
} from "./csvCompare";
import { DEFAULT_LIST_PARSE_OPTIONS } from "./listCompare";

const CSV_A = `id,name,email
1,Alice,alice@example.com
2,Bob,bob@example.com
3,Carol,carol@example.com
3,Carol,duplicate-row`;

const CSV_B = `id,name,email
2,Bob,bob@example.com
3,Carol,CHANGED-EMAIL@example.com
4,Dan,dan@example.com`;

describe("detectCsvColumns", () => {
  it("detects header columns", () => {
    expect(detectCsvColumns(CSV_A)).toEqual(["id", "name", "email"]);
  });

  it("returns null for non-CSV input", () => {
    expect(detectCsvColumns("apple\nbanana\ncherry")).toBeNull();
    expect(detectCsvColumns("")).toBeNull();
  });

  it("returns null for a plain single-column list", () => {
    expect(detectCsvColumns("1001\n1002\n1003")).toBeNull();
  });
});

describe("pickDefaultColumn", () => {
  it("picks the first common column", () => {
    expect(pickDefaultColumn(["id", "name"], ["name", "id"])).toBe("id");
  });

  it("falls back to the left side's first column", () => {
    expect(pickDefaultColumn(["id"], ["other"])).toBe("id");
  });

  it("returns null when left is empty", () => {
    expect(pickDefaultColumn([], [])).toBeNull();
  });
});

describe("compareCsvByColumn", () => {
  it("compares by the key column and fills all buckets", () => {
    const res = compareCsvByColumn(CSV_A, CSV_B, "id", DEFAULT_LIST_PARSE_OPTIONS);
    expect(res).not.toBeNull();
    const r = res!.result;
    // Keys: A has {1,2,3}, B has {2,3,4}
    expect(r.stats.common).toBe(2); // 2, 3
    expect(r.stats.leftOnly).toBe(1); // 1
    expect(r.stats.rightOnly).toBe(1); // 4
    // Row 3 changed email on the right side
    expect(r.stats.changed).toBe(1);
    expect(r.changed.map((i) => i.value)).toEqual(["3"]);
  });

  it("returns null when the column is missing on either side", () => {
    expect(compareCsvByColumn(CSV_A, CSV_B, "missing", DEFAULT_LIST_PARSE_OPTIONS)).toBeNull();
  });

  it("returns null when either side is not CSV", () => {
    expect(compareCsvByColumn("not csv", CSV_B, "id", DEFAULT_LIST_PARSE_OPTIONS)).toBeNull();
  });

  it("reports row counts", () => {
    const res = compareCsvByColumn(CSV_A, CSV_B, "id", DEFAULT_LIST_PARSE_OPTIONS)!;
    expect(res.leftRowCount).toBe(4);
    expect(res.rightRowCount).toBe(3);
    expect(res.columns.common).toEqual(["id", "name", "email"]);
  });

  it("handles duplicate keys within one side (dupe buckets)", () => {
    const res = compareCsvByColumn(CSV_A, CSV_B, "id", DEFAULT_LIST_PARSE_OPTIONS)!;
    expect(res.result.stats.leftDupes).toBe(1); // id 3 appears twice in A
  });

  it("is case-insensitive per options", () => {
    const a = "id,name\nAbC,alice";
    const b = "id,name\nabc,ALICE";
    const res = compareCsvByColumn(a, b, "id", {
      ...DEFAULT_LIST_PARSE_OPTIONS,
      caseInsensitive: true,
    });
    expect(res).not.toBeNull();
    expect(res!.result.stats.common).toBe(1);
    // without the option, the same keys differ
    const strict = compareCsvByColumn(a, b, "id", DEFAULT_LIST_PARSE_OPTIONS);
    expect(strict!.result.stats.common).toBe(0);
  });

  it("requires the same column name on both sides", () => {
    const res = compareCsvByColumn("id,name\n1,Alice", "ID,NAME\n1,ALICE", "id", DEFAULT_LIST_PARSE_OPTIONS);
    expect(res).toBeNull();
  });
});
