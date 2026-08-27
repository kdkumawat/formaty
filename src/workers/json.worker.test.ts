import { describe, expect, it } from "vitest";
import { dispatch } from "./json.worker";
import { InputTooLargeError } from "@/lib/io/size";

describe("worker dispatch", () => {
  it("rejects unsupported actions with an error response", () => {
    const r = dispatch("nope", {});
    expect(r.ok).toBe(false);
    expect(r.error).toContain("Unsupported action");
  });

  it("parses JSON via 'parse' action", () => {
    const r = dispatch("parse", { input: '{"a":1}' });
    expect(r.ok).toBe(true);
    expect(r.result).toEqual({ a: 1 });
  });

  it("rejects string inputs above the worker cap", () => {
    const oversize = "x".repeat(200 * 1024 * 1024 + 1);
    const r = dispatch("parseFormat", { input: oversize, format: "json" });
    expect(r.ok).toBe(false);
    expect(r.error).toBeDefined();
  });

  it("propagates parse errors as error responses", () => {
    const r = dispatch("parse", { input: "{not json" });
    expect(r.ok).toBe(false);
    expect(r.error).toBeDefined();
  });

  it("formats JSON", () => {
    const r = dispatch("format", { json: { a: 1, b: [1, 2] } });
    expect(r.ok).toBe(true);
    expect(String(r.result)).toContain('"a": 1');
  });

  it("minifies JSON", () => {
    const r = dispatch("minify", { json: { a: 1, b: [1, 2] } });
    expect(r.ok).toBe(true);
    expect(r.result).toBe('{"a":1,"b":[1,2]}');
  });

  it("sorts keys deeply", () => {
    const r = dispatch("sort", { json: { b: 1, a: 2 } });
    expect(r.ok).toBe(true);
    expect(Object.keys(r.result as object)).toEqual(["a", "b"]);
  });

  it("deduplicates arrays deeply", () => {
    const r = dispatch("dedup", { json: { arr: [1, 1, 2, 2, 3] } });
    expect(r.ok).toBe(true);
    expect((r.result as { arr: number[] }).arr).toEqual([1, 2, 3]);
  });

  it("flattens and unflattens roundtrip", () => {
    const flat = dispatch("flatten", { json: { a: { b: { c: 1 } } } });
    expect(flat.ok).toBe(true);
    const back = dispatch("unflatten", { json: flat.result });
    expect(back.ok).toBe(true);
    expect(back.result).toEqual({ a: { b: { c: 1 } } });
  });

  it("searches JSON values", () => {
    const r = dispatch("search", { json: { a: 1, b: "x" }, query: "x", mode: "value" });
    expect(r.ok).toBe(true);
    expect(Array.isArray(r.result)).toBe(true);
  });

  it("validates against an AJV schema and evicts it", () => {
    const r = dispatch("validate", {
      schema: { type: "object", properties: { a: { type: "number" } }, required: ["a"] },
      json: { a: 1 },
    });
    expect(r.ok).toBe(true);
    expect((r.result as { valid: boolean }).valid).toBe(true);
    // Second call should still work — confirms schema was evicted without breaking AJV.
    const r2 = dispatch("validate", {
      schema: { type: "string" },
      json: "ok",
    });
    expect(r2.ok).toBe(true);
  });

  it("generates TypeScript types", () => {
    const r = dispatch("generateTs", { json: { a: 1, b: "x" }, rootName: "Foo" });
    expect(r.ok).toBe(true);
    expect(String(r.result)).toContain("interface Foo");
  });

  it("infers a JSON schema", () => {
    const r = dispatch("schema", { json: { a: 1, b: "x" } });
    expect(r.ok).toBe(true);
    expect((r.result as { type: string }).type).toBe("object");
  });

  it("converts JSON to YAML/XML/CSV", () => {
    expect(dispatch("convert", { json: { a: 1 }, kind: "yaml" }).ok).toBe(true);
    expect(dispatch("convert", { json: { a: 1 }, kind: "xml" }).ok).toBe(true);
    expect(dispatch("convert", { json: [{ a: 1 }], kind: "csv", csvDelimiter: "," }).ok).toBe(true);
  });
});

describe("InputTooLargeError", () => {
  it("carries byte and cap values", () => {
    const e = new InputTooLargeError(100, 50, "test");
    expect(e.bytes).toBe(100);
    expect(e.cap).toBe(50);
    expect(e.message).toContain("test");
    expect(e.name).toBe("InputTooLargeError");
  });
});
