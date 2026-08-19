import { describe, expect, it } from "vitest";
import {
  analyzeSingleList,
  buildListSummary,
  cleanListInput,
  compareLists,
  compareListsCountAware,
  computeCountDeltas,
  DEFAULT_LIST_PARSE_OPTIONS,
  formatCountDeltaSummary,
  formatListItems,
  formatSqlClause,
  parseListText,
  sortListText,
  type ListItem,
  type ListParseOptions,
} from "./listCompare";

const base: ListParseOptions = { ...DEFAULT_LIST_PARSE_OPTIONS };

describe("parseListText", () => {
  it("splits newline-separated values", () => {
    expect(parseListText("a\nb\nc", base)).toEqual(["a", "b", "c"]);
  });

  it("handles CRLF line endings", () => {
    expect(parseListText("a\r\nb\r\nc", base)).toEqual(["a", "b", "c"]);
  });

  it("parses JSON arrays", () => {
    expect(parseListText('["a", "b", 3, true]', base)).toEqual(["a", "b", "3", "true"]);
  });

  it("auto-detects comma-separated values", () => {
    expect(parseListText("a,b,c", base)).toEqual(["a", "b", "c"]);
  });

  it("respects quoted commas (does not split inside quotes)", () => {
    expect(parseListText('"a,1","b,2"', base)).toEqual(['"a,1"', '"b,2"']);
    expect(parseListText('"a,1","b,2"', { ...base, stripQuotes: true })).toEqual(["a,1", "b,2"]);
  });

  it("drops empty lines by default", () => {
    expect(parseListText("a\n\nb\n", base)).toEqual(["a", "b"]);
  });

  it("preserves exact values when trim is off", () => {
    expect(parseListText("  a  \n b ", base)).toEqual(["  a  ", " b "]);
  });

  it("trims when requested", () => {
    expect(parseListText("  a  \n b ", { ...base, trim: true })).toEqual(["a", "b"]);
  });

  it("strips outer quotes when requested", () => {
    expect(parseListText("'abc'\n\"def\"", { ...base, stripQuotes: true })).toEqual(["abc", "def"]);
  });

  it("returns [] for empty input", () => {
    expect(parseListText("   \n  ", base)).toEqual([]);
  });
});

describe("compareLists", () => {
  it("computes all set buckets", () => {
    const r = compareLists("a\nb\nc", "b\nc\nd", base);
    expect(r.common.map((i) => i.value)).toEqual(["b", "c"]);
    expect(r.leftOnly.map((i) => i.value)).toEqual(["a"]);
    expect(r.rightOnly.map((i) => i.value)).toEqual(["d"]);
    expect(r.union.length).toBe(4);
    expect(r.symmetric.map((i) => i.value).sort()).toEqual(["a", "d"]);
    expect(r.stats).toMatchObject({ common: 2, leftOnly: 1, rightOnly: 1, union: 4, symmetric: 2 });
  });

  it("detects duplicates per side", () => {
    const r = compareLists("a\na\nb", "b\nb\nc", base);
    expect(r.leftDupes.map((i) => i.value)).toEqual(["a"]);
    expect(r.rightDupes.map((i) => i.value)).toEqual(["b"]);
  });

  it("handles empty inputs", () => {
    const r = compareLists("", "a\nb", base);
    expect(r.leftOnly).toEqual([]);
    expect(r.rightOnly.length).toBe(2);
    expect(r.stats.common).toBe(0);
  });

  it("is order-insensitive for buckets", () => {
    const r1 = compareLists("a\nb", "b\na", base);
    expect(r1.stats.common).toBe(2);
    expect(r1.stats.symmetric).toBe(0);
  });

  it("supports case-insensitive matching without mutating display values", () => {
    const r = compareLists("Alpha", "alpha", { ...base, caseInsensitive: true });
    expect(r.stats.common).toBe(1);
    expect(r.common[0]!.value).toBe("Alpha");
  });

  it("supports numeric normalization ('01' == 1)", () => {
    const r = compareLists("01", "1", { ...base, numericNormalize: true });
    expect(r.stats.common).toBe(1);
  });

  it("preserves exact values by default (case-sensitive, no normalization)", () => {
    const r = compareLists("Alpha", "alpha", base);
    expect(r.stats.common).toBe(0);
  });

  it("handles special characters and unicode", () => {
    const r = compareLists("café 🎉", "café 🎉", base);
    expect(r.stats.common).toBe(1);
    const q = compareLists("it's \"quoted\"", "it's \"quoted\"", base);
    expect(q.stats.common).toBe(1);
  });

  it("handles large lists (50k ids) without error", () => {
    const big = Array.from({ length: 50_000 }, (_, i) => `id-${i}`).join("\n");
    const big2 = Array.from({ length: 50_000 }, (_, i) => `id-${i + 1}`).join("\n");
    const r = compareLists(big, big2, base);
    expect(r.stats.common).toBe(49_999);
    expect(r.stats.leftOnly).toBe(1);
    expect(r.stats.rightOnly).toBe(1);
  });
});

describe("compareListsCountAware", () => {
  it("reports count deltas for keys present on both sides", () => {
    const r = compareListsCountAware("A\nA\nB", "A\nB\nB", base);
    expect(r.stats.common).toBe(2);
    const aDelta = r.countDeltas.find((d) => d.key === "A");
    const bDelta = r.countDeltas.find((d) => d.key === "B");
    expect(aDelta).toMatchObject({ left: 2, right: 1, delta: -1 });
    expect(bDelta).toMatchObject({ left: 1, right: 2, delta: 1 });
  });

  it("keeps set behavior identical when counts match", () => {
    const r = compareListsCountAware("A\nA\nB", "A\nA\nB", base);
    expect(r.countDeltas).toEqual([]);
    expect(r.stats.symmetric).toBe(0);
  });

  it("formats a human-readable delta summary", () => {
    const r = compareListsCountAware("A\nA\nB", "A\nB\nB", base);
    const summary = formatCountDeltaSummary(r.countDeltas);
    expect(summary).toContain("A: 1 extra on left");
    expect(summary).toContain("B: 1 extra on right");
  });

  it("still detects side-only duplicates", () => {
    const r = compareListsCountAware("A\nA\nA", "B\nB", base);
    expect(r.leftDupes.map((i) => i.value)).toEqual(["A"]);
    expect(r.rightDupes.map((i) => i.value)).toEqual(["B"]);
  });
});

describe("buildListSummary", () => {
  it("groups left / right / common with counts and items", () => {
    const r = compareLists("a\nb\nc", "b\nc\nd", base);
    const s = buildListSummary(r);
    expect(s.sections.map((x) => x.bucket)).toEqual(["common", "leftOnly", "rightOnly"]);
    expect(s.sections.map((x) => x.count)).toEqual([2, 1, 1]);
    expect(s.sections[0]!.items.map((i) => i.value)).toEqual(["b", "c"]);
    expect(s.text).toContain("Common (2)");
    expect(s.text).toContain("  b");
    expect(s.text).toContain("Only left (1)");
    expect(s.text).toContain("Only right (1)");
  });

  it("includes duplicates sections only when duplicates exist", () => {
    const r = compareLists("a\na\nb", "b\nb\nc", base);
    const s = buildListSummary(r);
    expect(s.sections.map((x) => x.bucket)).toEqual(["common", "leftOnly", "rightOnly", "leftDupes", "rightDupes"]);
    const leftDupes = s.sections.find((x) => x.bucket === "leftDupes")!;
    expect(leftDupes.items.map((i) => i.value)).toEqual(["a"]);
    expect(s.text).toContain("Left duplicates (1)");
    expect(s.text).toContain("Right duplicates (1)");
  });

  it("omits zero-count sections", () => {
    const r = compareLists("a\nb", "a\nb", base);
    const s = buildListSummary(r);
    expect(s.sections.map((x) => x.bucket)).toEqual(["common"]);
    expect(s.text).not.toContain("Only left");
    expect(s.text).not.toContain("Only right");
  });

  it("annotates count mismatches inline in the Common section", () => {
    const r = compareLists("A\nA\nB", "A\nB\nB", base);
    const s = buildListSummary(r);
    expect(s.text).toContain("A ×2 left, ×1 right");
    expect(s.text).toContain("B ×1 left, ×2 right");
    expect(s.countDeltas).toHaveLength(2);
  });

  it("adds no delta notes when counts match", () => {
    const r = compareLists("A\nA\nB", "A\nA\nB", base);
    const s = buildListSummary(r);
    expect(s.countDeltas).toEqual([]);
    expect(s.text).not.toContain("left");
  });

  it("hides delta notes when showCountDeltas is false", () => {
    const r = compareLists("A\nA\nB", "A\nB\nB", base);
    const s = buildListSummary(r, { showCountDeltas: false });
    expect(s.countDeltas).toEqual([]);
    expect(s.text).not.toContain("×2 left");
  });

  it("includes the Changed section only when requested", () => {
    const r = compareLists("a\nb", "a\nb", base);
    r.changed = [{ value: "a", key: "a", count: 1 }];
    r.stats.changed = 1;
    const without = buildListSummary(r, { includeChanged: false });
    expect(without.sections.find((x) => x.bucket === "changed")).toBeUndefined();
    const withChanged = buildListSummary(r, { includeChanged: true });
    expect(withChanged.sections.map((x) => x.bucket)).toEqual(["common", "changed"]);
    expect(withChanged.text).toContain("Changed (1)");
  });

  it("omits the Changed section when it has no items", () => {
    const r = compareLists("a\nb", "a\nb", base);
    const s = buildListSummary(r, { includeChanged: true });
    expect(s.sections.find((x) => x.bucket === "changed")).toBeUndefined();
  });

  it("returns an empty report for empty inputs", () => {
    const r = compareLists("", "", base);
    const s = buildListSummary(r);
    expect(s.sections).toEqual([]);
    expect(s.text).toBe("");
  });

  it("reflects parse options (case-insensitive matching)", () => {
    const r = compareLists("Alpha", "alpha", { ...base, caseInsensitive: true });
    const s = buildListSummary(r);
    expect(s.sections.map((x) => x.bucket)).toEqual(["common"]);
    expect(s.sections[0]!.items[0]!.value).toBe("Alpha");
  });
});

describe("computeCountDeltas", () => {
  it("reports deltas only for keys on both sides with different counts", () => {
    const r = compareListsCountAware("A\nA\nB", "A\nB\nB", base);
    expect(r.countDeltas).toEqual(computeCountDeltas(r));
    expect(r.countDeltas.map((d) => d.key).sort()).toEqual(["A", "B"]);
  });
});

describe("analyzeSingleList", () => {
  it("counts unique and duplicate items", () => {
    const a = analyzeSingleList("A\nB\nA\nC\nC", base);
    expect(a.rawCount).toBe(5);
    expect(a.uniqueCount).toBe(3);
    expect(a.duplicateKeys).toBe(2);
    expect(a.duplicateOccurrences).toBe(2);
    expect(a.unique.map((i) => i.value)).toEqual(["A", "B", "C"]);
    expect(a.duplicates.map((i) => i.value)).toEqual(["A", "C"]);
    expect(a.counts[0]!.value).toBe("A");
    expect(a.counts[0]!.count).toBe(2);
  });

  it("handles empty input", () => {
    const a = analyzeSingleList("", base);
    expect(a.rawCount).toBe(0);
    expect(a.uniqueCount).toBe(0);
    expect(a.duplicateKeys).toBe(0);
  });

  it("handles all-same input", () => {
    const a = analyzeSingleList("x\nx\nx", base);
    expect(a.uniqueCount).toBe(1);
    expect(a.duplicateKeys).toBe(1);
    expect(a.duplicateOccurrences).toBe(2);
  });
});

describe("sortListText", () => {
  it("sorts ascending and descending", () => {
    expect(sortListText("b\na\nc", base, "asc")).toBe("a\nb\nc");
    expect(sortListText("b\na\nc", base, "desc")).toBe("c\nb\na");
  });

  it("sorts numbers numerically", () => {
    expect(sortListText("10\n2\n1", base, "numeric-asc")).toBe("1\n2\n10");
  });

  it("returns input unchanged for none", () => {
    expect(sortListText("b\na", base, "none")).toBe("b\na");
  });
});

describe("formatListItems exports", () => {
  const items: ListItem[] = [
    { value: "a'b", key: "a'b", count: 1 },
    { value: "c", key: "c", count: 1 },
  ];

  it("escapes single quotes in SQL IN", () => {
    expect(formatListItems(items, "sql-in-single")).toBe("'a''b', 'c'");
  });

  it("escapes double quotes in SQL IN (double)", () => {
    const quoted: ListItem[] = [{ value: 'say "hi"', key: 'say "hi"', count: 1 }];
    expect(formatListItems(quoted, "sql-in-double")).toBe('"say ""hi"""');
  });

  it("emits SQL VALUES rows", () => {
    expect(formatListItems(items, "sql-values")).toBe("('a''b'),\n('c')");
  });

  it("emits PostgreSQL ARRAY", () => {
    expect(formatListItems(items, "sql-array")).toBe("ARRAY['a''b', 'c']");
  });

  it("emits JSON arrays preserving strings", () => {
    expect(formatListItems(items, "json-array")).toBe(JSON.stringify(["a'b", "c"], null, 2));
  });

  it("emits JSON arrays with numbers when possible", () => {
    const nums: ListItem[] = [
      { value: "3", key: "3", count: 1 },
      { value: "1.5", key: "1.5", count: 1 },
      { value: "abc", key: "abc", count: 1 },
    ];
    const parsed = JSON.parse(formatListItems(nums, "json-array-numbers"));
    expect(parsed).toEqual([3, 1.5, "abc"]);
  });

  it("emits CSV quoted values", () => {
    const tricky: ListItem[] = [{ value: 'say "hi"', key: "x", count: 1 }];
    expect(formatListItems(tricky, "csv-quoted")).toBe('"say ""hi"""');
  });

  it("emits YAML list and quotes items with special characters", () => {
    expect(formatListItems(items, "yaml-list")).toBe("- \"a'b\"\n- c");
  });

  it("escapes regex alternation", () => {
    const specials: ListItem[] = [{ value: "a.b", key: "a.b", count: 1 }];
    expect(formatListItems(specials, "regex-alt")).toBe("a\\.b");
  });

  it("emits JS and Python lists", () => {
    const xs: ListItem[] = [{ value: "x'y", key: "x'y", count: 1 }];
    expect(formatListItems(xs, "js-array-single")).toBe("['x\\'y']");
    expect(formatListItems(xs, "python-list")).toBe('["x\'y"]');
  });

  it("emits Go slice with escaped double quotes", () => {
    const xs: ListItem[] = [{ value: 'say "hi"', key: "x", count: 1 }];
    expect(formatListItems(xs, "go-slice")).toBe('[]string{"say \\"hi\\""}');
  });

  it("emits Markdown table", () => {
    const md = formatListItems(items, "markdown-table");
    expect(md).toContain("| value |");
    expect(md).toContain("| --- |");
    expect(md).toContain("| a'b |");
  });

  it("emits HTML table and escapes HTML", () => {
    const xs: ListItem[] = [{ value: "<b>&</b>", key: "x", count: 1 }];
    const html = formatListItems(xs, "html-table");
    expect(html).toContain("<table>");
    expect(html).toContain("&lt;b&gt;&amp;&lt;/b&gt;");
  });

  it("returns empty string for empty items", () => {
    expect(formatListItems([], "newline")).toBe("");
  });

  it("sorts by frequency when requested", () => {
    const xs: ListItem[] = [
      { value: "b", key: "b", count: 1 },
      { value: "a", key: "a", count: 5 },
    ];
    expect(formatListItems(xs, "newline", "frequency")).toBe("a\nb");
  });
});

describe("formatSqlClause", () => {
  const items: ListItem[] = Array.from({ length: 5 }, (_, i) => ({
    value: `v${i}`,
    key: `v${i}`,
    count: 1,
  }));

  it("builds IN with the chosen column and quoting", () => {
    const sql = formatSqlClause(items, { column: "user_id", quote: "single" });
    expect(sql).toBe("user_id IN ('v0', 'v1', 'v2', 'v3', 'v4')");
  });

  it("builds NOT IN", () => {
    const sql = formatSqlClause(items, { quote: "single", notIn: true });
    expect(sql.startsWith("id NOT IN (")).toBe(true);
  });

  it("builds PostgreSQL ANY()", () => {
    const sql = formatSqlClause(items, { quote: "single", any: true });
    expect(sql).toBe("id = ANY(ARRAY['v0', 'v1', 'v2', 'v3', 'v4'])");
  });

  it("builds INSERT statements with table name", () => {
    const sql = formatSqlClause(items, { quote: "single", insert: true, table: "users" });
    expect(sql).toContain("INSERT INTO users (id) VALUES");
    expect(sql).toContain("('v0')");
  });

  it("chunks large lists into multiple clauses", () => {
    const big: ListItem[] = Array.from({ length: 10 }, (_, i) => ({
      value: `${i}`,
      key: `${i}`,
      count: 1,
    }));
    const sql = formatSqlClause(big, { quote: "single", chunkSize: 3 });
    const clauses = sql.split("\nOR ");
    expect(clauses.length).toBe(4);
    expect(clauses[0]!.includes("'0', '1', '2'")).toBe(true);
  });

  it("chunks INSERT statements", () => {
    const big: ListItem[] = Array.from({ length: 6 }, (_, i) => ({
      value: `${i}`,
      key: `${i}`,
      count: 1,
    }));
    const sql = formatSqlClause(big, { quote: "single", insert: true, chunkSize: 2 });
    const statements = sql.split("\n\n").filter((s) => s.startsWith("INSERT"));
    expect(statements.length).toBe(3);
  });

  it("uses unquoted numbers with quote 'none'", () => {
    const nums: ListItem[] = [{ value: "42", key: "42", count: 1 }];
    expect(formatSqlClause(nums, { quote: "none" })).toBe("id IN (42)");
  });

  it("returns a comment for empty lists", () => {
    expect(formatSqlClause([], { quote: "single" })).toContain("-- empty list");
  });

  it("escapes single quotes in values", () => {
    const xs: ListItem[] = [{ value: "O'Brien", key: "x", count: 1 }];
    expect(formatSqlClause(xs, { quote: "single" })).toBe("id IN ('O''Brien')");
  });
});

describe("cleanListInput", () => {
  it("strips surrounding double quotes", () => {
    expect(cleanListInput('"foo"\n"bar"')).toBe("foo\nbar");
  });

  it("strips surrounding single quotes", () => {
    expect(cleanListInput("'foo'\n'bar'")).toBe("foo\nbar");
  });

  it("collapses multiple spaces", () => {
    expect(cleanListInput("hello   world")).toBe("hello world");
  });

  it("removes blank lines", () => {
    expect(cleanListInput("a\n\n\nb")).toBe("a\nb");
  });

  it("trims whitespace per line", () => {
    expect(cleanListInput("  foo  \n  bar  ")).toBe("foo\nbar");
  });

  it("handles empty input", () => {
    expect(cleanListInput("")).toBe("");
  });

  it("normalizes mixed mess", () => {
    const input = '  \"  Alice  \"  \n\n  \'Bob\'  \n  \"Charlie\"  ';
    expect(cleanListInput(input)).toBe("Alice\nBob\nCharlie");
  });

  it("strips orphan/incomplete quotes (trailing only)", () => {
    expect(cleanListInput('user_1001\nuser_1006"')).toBe("user_1001\nuser_1006");
  });

  it("strips orphan/incomplete quotes (leading only)", () => {
    expect(cleanListInput("'user_a\nuser_b")).toBe("user_a\nuser_b");
  });

  it("strips trailing commas", () => {
    expect(cleanListInput("user_1001,\nuser_1002,")).toBe("user_1001\nuser_1002");
  });

  it("handles the user_1001..user_1006 quote scenario", () => {
    const input = 'user_1001\nuser_1002\nuser_1003\nuser_1002\nuser_1004\nuser_1005\nuser_1003\n"user_1006"';
    const expected = 'user_1001\nuser_1002\nuser_1003\nuser_1002\nuser_1004\nuser_1005\nuser_1003\nuser_1006';
    expect(cleanListInput(input)).toBe(expected);
  });

  it("splits double-quoted comma-separated single line", () => {
    expect(cleanListInput('"foo","bar","baz"')).toBe("foo\nbar\nbaz");
  });

  it("splits single-quoted comma-separated single line", () => {
    expect(cleanListInput("'foo','bar','baz'")).toBe("foo\nbar\nbaz");
  });

  it("splits double-quoted comma list with spaces", () => {
    expect(cleanListInput('"foo", "bar", "baz"')).toBe("foo\nbar\nbaz");
  });

  it("splits JSON array wrapper", () => {
    expect(cleanListInput('["foo","bar","baz"]')).toBe("foo\nbar\nbaz");
  });

  it("splits parenthesized quoted comma list", () => {
    expect(cleanListInput('("foo","bar","baz")')).toBe("foo\nbar\nbaz");
  });

  it("splits bare comma-separated list without quotes", () => {
    expect(cleanListInput("foo, bar, baz")).toBe("foo\nbar\nbaz");
  });

  it("splits bare comma list with no spaces", () => {
    expect(cleanListInput("foo,bar,baz")).toBe("foo\nbar\nbaz");
  });

  it("splits JSON array of bare values", () => {
    expect(cleanListInput("[foo, bar, baz]")).toBe("foo\nbar\nbaz");
  });

  it("splits mixed quoted/unquoted comma list", () => {
    expect(cleanListInput('"foo", bar, "baz"')).toBe("foo\nbar\nbaz");
  });

  it("splits multi-line comma-separated input", () => {
    expect(cleanListInput("foo, bar\nbaz, qux")).toBe("foo\nbar\nbaz\nqux");
  });
});
