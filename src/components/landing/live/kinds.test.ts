import { describe, expect, it } from "vitest";
import { ALL_TOOL_ROUTES, TOOL_PRESETS } from "@/lib/seo";
import { UTIL_PAGES } from "@/lib/seoUtils";
import { initialInputs, optionsFor, resolveLive, STATIC_ROUTES } from "./kinds";

describe("resolveLive", () => {
  it("maps every tool route to a scene or to the explicit static list", () => {
    for (const r of ALL_TOOL_ROUTES) {
      expect(resolveLive(r).kind === "static", r).toBe(STATIC_ROUTES.includes(r));
    }
  });

  it("only lists static routes that exist", () => {
    for (const r of STATIC_ROUTES) expect(ALL_TOOL_ROUTES).toContain(r);
  });

  it("gives every scene that takes text a non-empty starting input", () => {
    for (const r of ALL_TOOL_ROUTES) {
      const spec = resolveLive(r);
      if (spec.kind === "static" || spec.kind === "util") continue;
      const { a } = initialInputs(spec, { inputExample: "x" }, TOOL_PRESETS[r]);
      expect(a.length, r).toBeGreaterThan(0);
    }
  });

  it("opens every util page on its own utility", () => {
    for (const [slug, page] of Object.entries(UTIL_PAGES)) {
      expect(resolveLive(slug, page.util), slug).toEqual({ kind: "util", util: page.util });
    }
  });

  it("opens each page on the output it is about", () => {
    expect(resolveLive("json-to-sql")).toEqual({ kind: "transform", override: null, sel: "type:sql" });
    expect(resolveLive("json-to-go")).toEqual({ kind: "transform", override: null, sel: "type:go" });
    expect(resolveLive("yaml-to-json")).toEqual({ kind: "transform", override: "yaml", sel: "fmt:json" });
    expect(resolveLive("json-to-xml")).toEqual({ kind: "transform", override: null, sel: "fmt:xml" });
    expect(resolveLive("toml-formatter")).toEqual({ kind: "transform", override: "toml", sel: "fmt:toml", raw: true });
    expect(resolveLive("schema-generator")).toEqual({ kind: "transform", override: null, sel: "op:schema" });
  });

  it("opens the list tools on the bucket and copy shape they are about", () => {
    expect(resolveLive("compare-lists")).toEqual({ kind: "compare", mode: "list", bucket: "leftOnly", format: "newline" });
    expect(resolveLive("find-duplicates-in-list")).toMatchObject({ kind: "compare", mode: "single" });
    expect(resolveLive("sql-in-clause-generator")).toMatchObject({ kind: "compare", format: "sql-in-single" });
  });

  it("gives the Monaco-bound tools the custom scene", () => {
    expect(resolveLive("jsonpath-tester")).toEqual({ kind: "custom", tool: "query" });
    expect(resolveLive("curl-to-python")).toEqual({ kind: "custom", tool: "curl", target: "python" });
  });

  it("selects an initial option that exists", () => {
    for (const r of ALL_TOOL_ROUTES) {
      const { options, initial } = optionsFor(resolveLive(r));
      if (options.length) expect(options.map((o) => o.id)).toContain(initial);
    }
  });
});
