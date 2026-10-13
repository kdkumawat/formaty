import { describe, expect, it } from "vitest";
import { matchToken, pushRecent, rank, type Searchable } from "./commandSearch";

const cmd = (id: string, label: string, category = "Transform", keywords: string[] = [], disabled = false): Searchable => ({ id, label, category, keywords, disabled });

const yaml = cmd("yaml", "Convert to YAML", "Transform", ["yaml", "yml", "convert"]);
const json = cmd("json", "Convert to JSON", "Transform", ["json", "convert"]);
const url = cmd("url", "Open URL encode/decode", "Utils", ["url", "percent", "uri", "encode", "decode", "query string"]);
const dedup = cmd("dedup", "Remove duplicate array items", "Output", ["dedupe", "duplicates", "unique", "dedup"]);
const single = cmd("single", "Dedupe and sort one list", "Compare", ["compare", "dedupe", "duplicates", "unique", "sort"]);
const all = [yaml, json, url, dedup, single];
const ids = (r: { item: Searchable }[]) => r.map((x) => x.item.id);

describe("matchToken", () => {
  it("matches word prefixes, word initials, and 3+ character runs inside a word", () => {
    expect(matchToken("dedup", "Dedupe and sort")?.indices).toEqual([0, 1, 2, 3, 4]);
    expect(matchToken("ctj", "Convert to JSON")?.indices).toEqual([0, 8, 11]);
    expect(matchToken("nco", "Open URL encode/decode")?.indices).toEqual([10, 11, 12]);
  });

  it("rejects loose subsequences and short mid-word runs", () => {
    expect(matchToken("dedupe", "Open URL encode/decode")).toBeNull();
    expect(matchToken("nc", "Open URL encode/decode")).toBeNull();
    expect(matchToken("yml", "yaml")).toBeNull();
  });
});

describe("rank", () => {
  it("does not return URL encode/decode for dedupe, and puts the label hit before the keyword hit", () => {
    expect(ids(rank(all, "dedupe"))).toEqual(["single", "dedup"]);
  });

  it("finds a command through its keywords", () => {
    expect(ids(rank(all, "yml"))).toEqual(["yaml"]);
  });

  it("finds initials", () => {
    expect(ids(rank(all, "ctj"))).toEqual(["json"]);
  });

  it("ranks a label hit above a keyword hit regardless of input order", () => {
    const viaKeyword = cmd("kw", "Open Foo", "Utils", ["yaml"]);
    expect(ids(rank([viaKeyword, yaml], "yaml"))).toEqual(["yaml", "kw"]);
  });

  it("ranks a word prefix above a match inside a word", () => {
    const inside = cmd("in", "Convert to JSON", "Transform", ["json"]);
    const prefix = cmd("pre", "Sonnet viewer");
    expect(ids(rank([inside, prefix], "son"))).toEqual(["pre", "in"]);
  });

  it("requires every token to match", () => {
    expect(ids(rank(all, "yaml convert"))).toEqual(["yaml"]);
    expect(ids(rank(all, "yaml json"))).toEqual([]);
  });

  it("keeps input order on ties, then lets recents and context break them", () => {
    expect(ids(rank([yaml, json], "conv"))).toEqual(["yaml", "json"]);
    expect(ids(rank([yaml, json], "conv", { recent: ["json"] }))).toEqual(["json", "yaml"]);
    expect(ids(rank([yaml, json], "conv", { inContext: (c) => c.id === "json" }))).toEqual(["json", "yaml"]);
    expect(ids(rank([yaml, json], "conv", { recent: ["yaml"], inContext: (c) => c.id === "json" }))).toEqual(["yaml", "json"]);
  });

  it("orders recents by recency", () => {
    expect(ids(rank([yaml, json], "conv", { recent: ["json", "yaml"] }))).toEqual(["json", "yaml"]);
    expect(ids(rank([yaml, json], "conv", { recent: ["yaml", "json"] }))).toEqual(["yaml", "json"]);
  });

  it("sorts disabled commands after enabled ones", () => {
    const off = { ...yaml, disabled: true };
    expect(ids(rank([off, json], "conv"))).toEqual(["json", "yaml"]);
  });

  it("returns everything in input order for an empty query", () => {
    expect(ids(rank(all, "  "))).toEqual(["yaml", "json", "url", "dedup", "single"]);
  });
});

describe("pushRecent", () => {
  it("puts the newest first and removes duplicates", () => {
    expect(pushRecent(["a", "b", "c"], "b")).toEqual(["b", "a", "c"]);
  });

  it("keeps at most five", () => {
    expect(pushRecent(["a", "b", "c", "d", "e"], "f")).toEqual(["f", "a", "b", "c", "d"]);
  });
});
