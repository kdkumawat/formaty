import { describe, expect, it } from "vitest";
import {
  StringBuilder,
  flattenJsonIter,
  formatJsonIter,
  getStableKey,
  minifyJsonIter,
  stableStringify,
  toCsvIter,
  type JsonValue,
} from "./streaming";

describe("StringBuilder", () => {
  it("appends and joins", () => {
    const sb = new StringBuilder();
    sb.push("a").push("b").push("c");
    expect(sb.toString()).toBe("abc");
    expect(sb.length).toBe(3);
  });

  it("skips empty strings", () => {
    const sb = new StringBuilder();
    sb.push("").push("x").push("").push("y");
    expect(sb.toString()).toBe("xy");
  });

  it("pushMany joins with a separator", () => {
    const sb = new StringBuilder();
    sb.pushMany(["a", "b", "c"], ",");
    expect(sb.toString()).toBe("a,b,c");
  });

  it("coalesces to a single chunk on toString()", () => {
    const sb = new StringBuilder();
    sb.push("a").push("b").push("c");
    const s = sb.toString();
    expect(s).toBe("abc");
    // Calling toString again returns the same string.
    expect(sb.toString()).toBe(s);
  });
});

describe("stableStringify", () => {
  it("sorts object keys", () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it("handles nested objects", () => {
    expect(stableStringify({ b: { d: 4, c: 3 }, a: 1 })).toBe('{"a":1,"b":{"c":3,"d":4}}');
  });

  it("preserves array order", () => {
    expect(stableStringify([3, 1, 2])).toBe("[3,1,2]");
  });

  it("emits null for non-finite numbers", () => {
    expect(stableStringify(Number.NaN)).toBe("null");
    expect(stableStringify(Number.POSITIVE_INFINITY)).toBe("null");
  });
});

describe("getStableKey (memoized)", () => {
  it("returns the same key for equal subtrees without re-stringifying", () => {
    const cache = new WeakMap<object, string>();
    const a = { x: 1 };
    const b = { x: 1 };
    // Same reference → cached.
    const k1 = getStableKey(a, cache);
    const k2 = getStableKey(a, cache);
    expect(k1).toBe(k2);
    // Different reference but equal value → same key string.
    expect(getStableKey(b, cache)).toBe(k1);
  });

  it("returns 'null' for null/undefined scalars", () => {
    const cache = new WeakMap<object, string>();
    expect(getStableKey(null, cache)).toBe("null");
  });
});

describe("formatJsonIter vs JSON.stringify reference", () => {
  const cases: Array<[string, JsonValue]> = [
    ["null", null],
    ["true", true],
    ["int", 42],
    ["zero", 0],
    ["empty string", ""],
    ["string with quotes", 'a"b'],
    ["empty array", []],
    ["empty object", {}],
    ["flat object", { b: 1, a: 2 }],
    ["nested object", { a: { y: 2, x: 1 }, b: [3, 2, 1] }],
    ["array of objects", [{ id: 1, name: "alice" }, { id: 2, name: "bob" }]],
    ["deeply nested", { a: { b: { c: { d: { e: 1 } } } } }],
    ["mixed", { arr: [1, "two", null, true, { k: "v" }] }],
  ];

  for (const [name, value] of cases) {
    it(`matches JSON.stringify for ${name}`, () => {
      const expected = JSON.stringify(value, null, 2);
      const actual = formatJsonIter(value, 2);
      expect(actual).toBe(expected);
    });
  }

  it("respects indent=0 (compact but with separator spaces)", () => {
    const v = { a: 1, b: [1, 2] };
    const out = formatJsonIter(v, 0);
    // With indent=0, my impl uses minified form.
    expect(out).toBe('{"a":1,"b":[1,2]}');
  });

  it("respects indent=4", () => {
    const v = { a: 1, b: [1, 2] };
    const expected = JSON.stringify(v, null, 4);
    expect(formatJsonIter(v, 4)).toBe(expected);
  });
});

describe("minifyJsonIter", () => {
  it("matches JSON.stringify with no indent", () => {
    const cases: JsonValue[] = [
      null,
      true,
      42,
      "hello",
      [],
      {},
      { a: 1, b: [1, 2, 3], c: { d: "x" } },
      [{ id: 1 }, { id: 2 }],
    ];
    for (const v of cases) {
      expect(minifyJsonIter(v)).toBe(JSON.stringify(v));
    }
  });
});

describe("toCsvIter", () => {
  it("emits headers and rows for a flat array", () => {
    const out = toCsvIter(
      [
        { a: 1, b: "x" },
        { a: 2, b: "y" },
      ],
      ",",
    );
    expect(out).toBe("a,b\n1,x\n2,y\n");
  });

  it("quotes cells containing delimiters or newlines", () => {
    const out = toCsvIter([{ a: 'has,comma', b: 'has"quote' }], ",");
    expect(out).toBe('a,b\n"has,comma","has""quote"\n');
  });

  it("serializes nested objects as JSON", () => {
    const out = toCsvIter([{ a: { x: 1 } }], ",");
    expect(out).toBe('a\n{"x":1}\n');
  });

  it("returns scalar string for non-array root", () => {
    expect(toCsvIter(42, ",")).toBe("42");
  });
});

describe("flattenJsonIter vs recursive flattenJson", () => {
  it("matches the recursive impl for nested objects", async () => {
    const { flattenJson } = await import("./core");
    const input: JsonValue = { a: { b: { c: 1 } }, d: [10, 20, { e: 30 }] };
    expect(flattenJsonIter(input)).toEqual(flattenJson(input));
  });

  it("matches for arrays of objects", async () => {
    const { flattenJson } = await import("./core");
    const input: JsonValue = { rows: [{ id: 1 }, { id: 2 }] };
    expect(flattenJsonIter(input)).toEqual(flattenJson(input));
  });
});
