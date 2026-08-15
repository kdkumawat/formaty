import { describe, expect, it } from "vitest";
import { getPreset, PRESETS } from "./presets";

describe("presets", () => {
  it("defines every recipe with label, description, and keywords", () => {
    for (const p of PRESETS) {
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
      expect(p.keywords.length).toBeGreaterThan(0);
    }
  });

  it("has unique ids", () => {
    const ids = PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("looks up presets by id", () => {
    expect(getPreset("json-to-sql")?.label).toContain("SQL");
    expect(getPreset("compare-db-exports")?.label).toContain("Compare");
  });

  it("returns undefined for unknown ids", () => {
    expect(getPreset("does-not-exist")).toBeUndefined();
  });

  it("covers the core advertised workflows", () => {
    const ids = PRESETS.map((p) => p.id);
    for (const expected of [
      "flatten-to-csv",
      "json-to-typescript",
      "json-to-sql",
      "api-response-types",
      "compare-db-exports",
      "extract-ids-to-sql-in",
      "dedupe-sort-list",
      "validate-against-schema",
    ]) {
      expect(ids).toContain(expected);
    }
  });
});
