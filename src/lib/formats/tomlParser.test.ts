import { describe, expect, it } from "vitest";
import { tomlAdapter } from "./tomlParser";
import type { JsonValue } from "@/lib/json/core";

describe("tomlAdapter.stringify", () => {
  it("writes plain integers and floats without digit separators", () => {
    const out = tomlAdapter.stringify({ id: 460078, n: -1234567, f: 1234567.5, a: [1234, 12345], t: { c: 1000 } });
    expect(out).toContain("id = 460078");
    expect(out).toContain("n = -1234567");
    expect(out).toContain("f = 1234567.5");
    expect(out).toContain("a = [ 1234, 12345 ]");
    expect(out).toContain("c = 1000");
    expect(out).not.toMatch(/\d_\d/);
  });

  it("leaves string contents alone", () => {
    const data = { s: "a 1_234", m: "x\n1_234\ny" };
    expect(tomlAdapter.parse(tomlAdapter.stringify(data))).toEqual(data);
  });

  it("round-trips floats and integers", () => {
    const data: JsonValue = { id: 460078, pi: 3.14159, big: 9007199254740991, neg: -42 };
    expect(tomlAdapter.parse(tomlAdapter.stringify(data))).toEqual(data);
  });
});
