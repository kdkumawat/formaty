import { describe, expect, it } from "vitest";
import { cleanJson, generateUuidV7, passwordBits } from "./devtools";

describe("cleanJson", () => {
  it("removes line and block comments, and leaves // inside strings alone", () => {
    const commented = ["{", "  // note", "  name: 'formaty', /* inline */", "  tags: ['local', 'fast',],", "} // done"].join("\n");
    expect(JSON.parse(cleanJson(commented))).toEqual({ name: "formaty", tags: ["local", "fast"] });
    expect(JSON.parse(cleanJson(`{'a': 'http://x', "b": "see // here", c: 'it\\'s https://y'}`))).toEqual({
      a: "http://x",
      b: "see // here",
      c: "it's https://y",
    });
  });

  it("pretty-prints already-valid JSON", () => {
    expect(cleanJson('{"a":1}')).toBe('{\n  "a": 1\n}');
  });

  it("fixes smart quotes", () => {
    expect(cleanJson("{“a”: “b”}")).toBe('{\n  "a": "b"\n}');
  });

  it("quotes unquoted keys", () => {
    expect(cleanJson("{a: 1, b: 2}")).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });

  it("removes trailing commas", () => {
    expect(cleanJson('{"a": 1, "b": [1, 2, 3,],}')).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2,\n    3\n  ]\n}');
  });

  it("converts single-quoted strings to double quotes", () => {
    expect(cleanJson("{'name': 'Aisha'}")).toBe('{\n  "name": "Aisha"\n}');
  });

  it("keeps apostrophes inside single-quoted values as escaped chars", () => {
    // it's → the apostrophe is inside a single-quoted string, not a delimiter
    expect(JSON.parse(cleanJson("{name: 'it\\'s fine'}"))).toEqual({ name: "it's fine" });
  });

  it("maps Python literals True/False/None", () => {
    expect(JSON.parse(cleanJson("{active: True, gone: False, x: None}"))).toEqual({
      active: true,
      gone: false,
      x: null,
    });
  });

  it("unwraps doubled-quote wrappers from logs/CSV", () => {
    expect(JSON.parse(cleanJson('""{""a"": 1}""'))).toEqual({ a: 1 });
  });

  it("repairs several issues at once", () => {
    const input = "{ user: { name: 'Aisha', active: True, tags: ['x', 'y',], } }";
    expect(JSON.parse(cleanJson(input))).toEqual({
      user: { name: "Aisha", active: true, tags: ["x", "y"] },
    });
  });

  it("throws a short error for hopeless input", () => {
    expect(() => cleanJson("just some words")).toThrow(/Could not clean/);
  });
});

describe("generateUuidV7", () => {
  it("is a well-formed v7 UUID carrying the current time", () => {
    const before = Date.now();
    const id = generateUuidV7();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    const ms = parseInt(id.replace(/-/g, "").slice(0, 12), 16);
    expect(ms).toBeGreaterThanOrEqual(before);
    expect(ms).toBeLessThanOrEqual(Date.now());
  });
});

describe("passwordBits", () => {
  it("scales with length and pool size", () => {
    expect(passwordBits(16, { lower: true, upper: false, digits: false, symbols: false })).toBe(75);
    expect(passwordBits(32)).toBeGreaterThan(passwordBits(16));
    expect(passwordBits(16, { lower: false, upper: false, digits: false, symbols: false })).toBe(0);
  });
});
