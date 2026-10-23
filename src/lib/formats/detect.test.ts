import { describe, expect, it } from "vitest";
import { detectFormat } from "./detect";

describe("detectFormat", () => {
  it("reads TOML that opens with a table header", () => {
    expect(detectFormat('[server]\nhost = "0.0.0.0"\nport = 8080')).toBe("toml");
    expect(detectFormat('[[workers]]\nname = "a"')).toBe("toml");
  });

  it("reads CSV whose header fields are quoted", () => {
    expect(detectFormat('"id","email","amount"\n"1","a@b.io","49.00"')).toBe("csv");
  });

  it("still reads JSON arrays and quoted JSON", () => {
    expect(detectFormat("[1, 2, 3]")).toBe("json");
    expect(detectFormat('[\n  {"id": 1}\n]')).toBe("json");
    expect(detectFormat('"name": "A"')).toBe("json");
  });
});
