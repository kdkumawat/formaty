import { describe, expect, it } from "vitest";
import { cleanJson } from "./devtools";

describe("cleanJson", () => {
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
