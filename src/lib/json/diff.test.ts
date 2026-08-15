import { describe, expect, it } from "vitest";
import {
  diffJson,
  summarizeDiffFromText,
  summarizeDiff,
  tryParseStructured,
} from "./diff";

describe("summarizeDiff (index-based default)", () => {
  it("detects added, removed, and changed values", () => {
    const s = summarizeDiff({ a: 1, b: 2 }, { a: 1, b: 3, c: 4 });
    expect(s.added).toBe(1);
    expect(s.removed).toBe(0);
    expect(s.changed).toBe(1);
    const paths = s.rows.map((r) => r.path);
    expect(paths).toContain("$.b");
    expect(paths).toContain("$.c");
  });

  it("treats identical documents as no diff", () => {
    const s = summarizeDiff({ a: [1, 2] }, { a: [1, 2] });
    expect(s.total).toBe(0);
  });
});

describe("order-insensitive array comparison", () => {
  it("recognizes reordered primitive arrays as equivalent", () => {
    const s = summarizeDiff(
      { users: [1, 2, 3] },
      { users: [3, 2, 1] },
      { ignoreArrayOrder: true },
    );
    expect(s.total).toBe(0);
  });

  it("flags a missing element in order-insensitive mode", () => {
    const s = summarizeDiff(
      { users: [1, 2, 3] },
      { users: [1, 2] },
      { ignoreArrayOrder: true },
    );
    expect(s.total).toBe(1);
    expect(s.rows[0]!.change).toBe("removed");
  });

  it("still reports differences by default (index-based)", () => {
    const s = summarizeDiff({ users: [1, 2, 3] }, { users: [3, 2, 1] });
    expect(s.total).toBeGreaterThan(0);
  });

  it("matches arrays of objects by key when provided", () => {
    const s = summarizeDiff(
      { users: [{ id: 1, name: "A" }, { id: 2, name: "B" }] },
      { users: [{ id: 2, name: "B" }, { id: 1, name: "A" }] },
      { ignoreArrayOrder: true, arrayKey: "id" },
    );
    expect(s.total).toBe(0);
  });

  it("reports a changed object when matched by key but values differ", () => {
    const s = summarizeDiff(
      { users: [{ id: 1, name: "A" }] },
      { users: [{ id: 1, name: "C" }] },
      { ignoreArrayOrder: true, arrayKey: "id" },
    );
    expect(s.total).toBeGreaterThan(0);
    expect(s.rows.some((r) => r.change === "changed")).toBe(true);
  });

  it("handles duplicate elements as a multiset in order-insensitive mode", () => {
    const s = summarizeDiff(
      { xs: ["a", "a", "b"] },
      { xs: ["a", "b", "b"] },
      { ignoreArrayOrder: true },
    );
    expect(s.total).toBe(2);
  });
});

describe("diffJson returns rows", () => {
  it("returns the rows array", () => {
    const rows = diffJson({ a: 1 }, { a: 2 });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.path).toBe("$.a");
  });
});

describe("summarizeDiffFromText (multi-format)", () => {
  it("diffs JSON text", () => {
    const s = summarizeDiffFromText('{"a":1,"b":2}', '{"a":1,"b":3}');
    expect(s).not.toBeNull();
    expect(s!.changed).toBe(1);
  });

  it("diffs YAML text structurally", () => {
    const s = summarizeDiffFromText("a: 1\nb: 2\n", "a: 1\nb: 3\n");
    expect(s).not.toBeNull();
    expect(s!.changed).toBe(1);
  });

  it("diffs XML text structurally", () => {
    const s = summarizeDiffFromText("<root><a>1</a></root>", "<root><a>2</a></root>");
    expect(s).not.toBeNull();
  });

  it("returns null when one side is not parseable", () => {
    const s = summarizeDiffFromText("not valid {{json", '{"a":1}');
    expect(s).toBeNull();
  });

  it("treats empty text as empty object", () => {
    const s = summarizeDiffFromText("", '{"a":1}');
    expect(s).not.toBeNull();
    expect(s!.added).toBe(1);
  });
});

describe("tryParseStructured", () => {
  it("parses JSON, YAML, XML, and rejects plain text", () => {
    expect(tryParseStructured('{"a":1}')).not.toBeNull();
    expect(tryParseStructured("a: 1\nb: 2")).not.toBeNull();
    expect(tryParseStructured("<r><a>1</a></r>")).not.toBeNull();
    expect(tryParseStructured("just some prose text")).toBeNull();
  });
});
