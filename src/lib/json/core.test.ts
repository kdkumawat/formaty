import { describe, expect, it } from "vitest";
import { generateOpenApiSpec, searchJson, toHtmlTable, toMarkdownTable } from "./core";

describe("toMarkdownTable", () => {
  it("renders an array of objects", () => {
    const md = toMarkdownTable([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
    expect(md).toBe(
      "| id | name |\n| --- | --- |\n| 1 | Alice |\n| 2 | Bob |",
    );
  });

  it("escapes pipe characters in cells", () => {
    const md = toMarkdownTable([{ value: "a|b" }]);
    expect(md).toContain("| a\\|b |");
  });

  it("renders nested objects as JSON in the cell", () => {
    const md = toMarkdownTable([{ meta: { a: 1 } }]);
    expect(md).toContain('{"a":1}');
  });

  it("returns empty string for an empty array", () => {
    expect(toMarkdownTable([])).toBe("");
  });

  it("turns primitives into a single value column", () => {
    expect(toMarkdownTable("hello")).toContain("| value |");
    expect(toMarkdownTable(42)).toContain("| 42 |");
  });
});

describe("toHtmlTable", () => {
  it("renders a full table with escaped cells", () => {
    const html = toHtmlTable([{ name: "<b>X</b>" }]);
    expect(html).toContain("<table>");
    expect(html).toContain("<th>name</th>");
    expect(html).toContain("<td>&lt;b&gt;X&lt;/b&gt;</td>");
  });

  it("returns empty string for an empty array", () => {
    expect(toHtmlTable([])).toBe("");
  });
});

describe("generateOpenApiSpec", () => {
  it("emits a valid OpenAPI 3.1 skeleton with the inferred schema", () => {
    const spec = JSON.parse(
      generateOpenApiSpec({ id: 1, name: "Alice" }) as string,
    ) as Record<string, unknown>;
    expect(spec.openapi).toBe("3.1.0");
    expect((spec.info as { title: string }).title).toBe("API");
    const root = (spec.components as { schemas: Record<string, { type: string; properties?: Record<string, unknown> }> }).schemas.Root;
    expect(root.type).toBe("object");
    expect(Object.keys(root.properties ?? {})).toEqual(["id", "name"]);
  });

  it("respects custom title/version/path options", () => {
    const spec = JSON.parse(
      generateOpenApiSpec({ ok: true }, { title: "Users", version: "2.0.0", path: "/users" }) as string,
    ) as Record<string, unknown>;
    expect((spec.info as { title: string; version: string }).title).toBe("Users");
    expect((spec.info as { version: string }).version).toBe("2.0.0");
    expect(spec.paths).toHaveProperty("/users");
  });

  it("wraps arrays as array schemas", () => {
    const spec = JSON.parse(generateOpenApiSpec([{ id: 1 }]) as string) as Record<string, unknown>;
    const root = (spec.components as { schemas: Record<string, { type: string }> }).schemas.Root;
    expect(root.type).toBe("array");
  });
});

describe("searchJson", () => {
  const data = {
    users: [
      { id: 1, name: "Alice", active: true },
      { id: 2, name: "alice-dev", active: false },
    ],
    meta: { owner: "Alice" },
  };

  it("searches values case-insensitively by default", () => {
    const matches = searchJson(data, "alice", "value", false);
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(matches.some((m) => m.path === "meta.owner")).toBe(true);
  });

  it("respects case sensitivity", () => {
    const loose = searchJson(data, "alice", "value", false).length;
    const strict = searchJson(data, "alice", "value", true).length;
    expect(strict).toBeLessThanOrEqual(loose);
  });

  it("searches keys", () => {
    const matches = searchJson(data, "id", "key", false);
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("returns zero matches for missing text", () => {
    expect(searchJson(data, "zzzz-not-here", "value", false)).toHaveLength(0);
  });

  it("handles empty query", () => {
    expect(searchJson(data, "", "value", false)).toHaveLength(0);
  });
});
