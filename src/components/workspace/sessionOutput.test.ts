import { describe, expect, it } from "vitest";
import { cleanSessionOutput, isStaleDiffOutput } from "./sessionOutput";

describe("isStaleDiffOutput", () => {
  it("ignores empty and ordinary output", () => {
    expect(isStaleDiffOutput(null)).toBe(false);
    expect(isStaleDiffOutput("  ")).toBe(false);
    expect(isStaleDiffOutput('{"a":1}')).toBe(false);
  });

  it("flags the old structural-diff error text", () => {
    expect(isStaleDiffOutput("Structural path diff requires valid JSON on both sides")).toBe(true);
  });

  it("flags the old validity payload", () => {
    expect(isStaleDiffOutput('{"leftValid":true,"rightValid":false,"note":"x"}')).toBe(true);
  });

  it("flags the old internal report but not user data that merely has similar keys", () => {
    const report = JSON.stringify({ summary: {}, changes: [{ path: "$.a", change: "added" }], truncated: false });
    expect(isStaleDiffOutput(report)).toBe(true);
    expect(isStaleDiffOutput('{"summary":"hi","path":"/x","change":"y","added":1}')).toBe(false);
  });
});

describe("cleanSessionOutput", () => {
  it("blanks stale output and passes the rest through", () => {
    expect(cleanSessionOutput(undefined)).toBe("");
    expect(cleanSessionOutput("Structural path diff requires valid JSON")).toBe("");
    expect(cleanSessionOutput("hello")).toBe("hello");
  });
});
