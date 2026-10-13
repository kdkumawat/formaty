import { describe, expect, it } from "vitest";
import { fuzzyMatch } from "./fuzzy";

describe("fuzzyMatch", () => {
  it("returns null when the query is not a subsequence", () => {
    expect(fuzzyMatch("xyz", "Convert to YAML")).toBeNull();
    expect(fuzzyMatch("lmay", "yaml")).toBeNull();
  });

  it("matches case-insensitively and reports indices", () => {
    expect(fuzzyMatch("YML", "yaml")?.indices).toEqual([0, 2, 3]);
  });

  it("matches everything with score 0 for an empty query", () => {
    expect(fuzzyMatch("", "anything")).toEqual({ score: 0, indices: [] });
  });

  it("scores prefix above word-start above mid-word", () => {
    const prefix = fuzzyMatch("js", "JSON formatter")!.score;
    const wordStart = fuzzyMatch("js", "Convert to JSON")!.score;
    const mid = fuzzyMatch("js", "Adjust")!.score;
    expect(prefix).toBeGreaterThan(wordStart);
    expect(wordStart).toBeGreaterThan(mid);
  });

  it("prefers consecutive characters", () => {
    expect(fuzzyMatch("yam", "yaml")!.score).toBeGreaterThan(fuzzyMatch("yam", "yxaxm")!.score);
  });

  it("picks word-start letters for initials", () => {
    expect(fuzzyMatch("ctj", "Convert to JSON")?.indices).toEqual([0, 8, 11]);
  });
});
