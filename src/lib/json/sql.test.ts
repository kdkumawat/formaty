import { describe, expect, it } from "vitest";
import { generateSql } from "./core";

const SAMPLE = [
  { id: 1, name: "Alice", active: true },
  { id: 2, name: "Bob", active: false },
];

describe("generateSql", () => {
  it("emits CREATE TABLE and INSERT seed rows for sqlite", () => {
    const sql = generateSql(SAMPLE, { dialect: "sqlite" });
    expect(sql).toContain("CREATE TABLE");
    expect(sql).toContain("INSERT INTO");
    expect(sql).toContain("'Alice'");
    expect(sql).toContain("'Bob'");
  });

  it("uses dialect-specific column types", () => {
    const scored = [{ id: 1, score: 9.5, active: true }];
    const sqlite = generateSql(scored, { dialect: "sqlite" });
    const postgres = generateSql(scored, { dialect: "postgres" });
    const mysql = generateSql(scored, { dialect: "mysql" });
    expect(sqlite).toContain("REAL");
    expect(postgres).toContain("DOUBLE PRECISION");
    expect(mysql).toContain("DOUBLE");
    expect(postgres).toContain("BOOLEAN");
    expect(mysql).toContain("TINYINT(1)");
  });

  it("honors a custom table name", () => {
    const sql = generateSql(SAMPLE, { dialect: "sqlite", tableName: "customers" });
    expect(sql).toContain("CREATE TABLE customers");
    expect(sql).toContain("INSERT INTO customers");
  });

  it("supports schema qualification for postgres", () => {
    const sql = generateSql(SAMPLE, { dialect: "postgres", schemaName: "public" });
    expect(sql).toContain('"public".');
  });

  it("supports backtick quoting for mysql", () => {
    const sql = generateSql(SAMPLE, { dialect: "mysql", quoteStyle: "backtick" });
    expect(sql).toContain("`");
  });

  it("handles empty arrays gracefully", () => {
    const sql = generateSql([], { dialect: "sqlite" });
    expect(sql).toContain("Unable to infer object schema");
  });

  it("handles nested objects as separate tables", () => {
    const nested = [{ id: 1, profile: { city: "NYC" } }];
    const sql = generateSql(nested, { dialect: "sqlite" });
    expect(sql).toContain("profile");
  });

  it("handles primitive roots without crashing", () => {
    const sql = generateSql(42, { dialect: "sqlite" });
    expect(typeof sql).toBe("string");
  });
});
