import { describe, expect, it } from "vitest";
import type { UtilTab } from "@/lib/utils/devtools";
import { TOOL_META, detectReadings, looksEncoded, toolReadings } from "./readings";

const JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("looksEncoded", () => {
  it("picks decode for encoded-looking input", () => {
    expect(looksEncoded("base64", "SGVsbG8sIEZvcm1hdHkh")).toBe(true);
    expect(looksEncoded("url", "a%20b")).toBe(true);
    expect(looksEncoded("html", "&lt;b&gt;")).toBe(true);
    expect(looksEncoded("url", "plain text")).toBe(false);
  });
});

describe("toolReadings", () => {
  it("encodes and decodes base64", () => {
    expect(toolReadings("base64", "Hello", "encode")[0].value).toBe("SGVsbG8=");
    expect(toolReadings("base64", "SGVsbG8=", "decode")[0].value).toBe("Hello");
  });
  it("reports problems as error rows", () => {
    expect(toolReadings("base64", "!!!", "decode")[0].error).toBe(true);
  });
  it("reads every tool's own example without a problem", () => {
    for (const [id, meta] of Object.entries(TOOL_META) as [UtilTab, { example: string }][]) {
      const rows = toolReadings(id, meta.example, looksEncoded(id, meta.example) ? "decode" : "encode");
      expect(rows.filter((r) => r.error), id).toEqual([]);
    }
  });
});

describe("detectReadings", () => {
  it("treats a JWT as a JWT only", () => {
    const r = detectReadings(JWT);
    expect(r.every((x) => x.open === "jwt")).toBe(true);
  });
  it("suppresses encoding readings for cron, JSON and colours", () => {
    expect(detectReadings("0 9 * * 1-5")).toHaveLength(1);
    expect(detectReadings('{"a":1}')).toHaveLength(1);
    expect(detectReadings("#F2B544").every((x) => x.open === "color")).toBe(true);
  });
  it("reads a unix timestamp", () => {
    expect(detectReadings("1516239022").some((x) => x.label === "Unix timestamp")).toBe(true);
  });

  const caseRows = (s: string) => detectReadings(s).filter((x) => x.open === "case").map((x) => [x.label, x.value]);

  it("offers the common cases for a short phrase, most used first", () => {
    expect(caseRows("max retry count")).toEqual([
      ["snake_case", "max_retry_count"],
      ["kebab-case", "max-retry-count"],
      ["camelCase", "maxRetryCount"],
      ["PascalCase", "MaxRetryCount"],
      ["CONSTANT_CASE", "MAX_RETRY_COUNT"],
      ["UPPERCASE", "MAX RETRY COUNT"],
      ["Title Case", "Max Retry Count"],
    ]);
  });
  it("starts with snake_case for a camelCase identifier", () => {
    const rows = caseRows("getUserName");
    expect(rows[0]).toEqual(["snake_case", "get_user_name"]);
    expect(rows).toContainEqual(["kebab-case", "get-user-name"]);
    expect(rows).toContainEqual(["lowercase", "getusername"]);
  });
  it("skips a case that equals the input", () => {
    const rows = caseRows("user-profile-id");
    expect(rows.map((r) => r[0])).not.toContain("kebab-case");
    expect(rows.map((r) => r[0])).not.toContain("lowercase");
    expect(rows[0]).toEqual(["snake_case", "user_profile_id"]);
  });
  it("does not repeat the same value under two names", () => {
    expect(caseRows("hello")).toEqual([
      ["PascalCase", "Hello"],
      ["CONSTANT_CASE", "HELLO"],
    ]);
  });
  it("offers no case rows for long text or specific detections", () => {
    expect(caseRows("The quick brown fox jumps over the lazy dog near the river")).toEqual([]);
    expect(caseRows("550e8400-e29b-41d4-a716-446655440000")).toEqual([]);
    expect(caseRows("2024-01-15")).toEqual([]);
    expect(caseRows("a, b; c")).toEqual([]);
    expect(caseRows("first line\nsecond line")).toEqual([]);
  });
});
