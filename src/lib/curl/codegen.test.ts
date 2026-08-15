import { describe, expect, it } from "vitest";
import { parseCurl } from "./parseCurl";
import { generateCurlCode, CURL_TARGETS } from "./codegen";

describe("curl codegen", () => {
  it("generates fetch code for a simple GET", () => {
    const parsed = parseCurl('curl -X GET "https://api.example.com/users?limit=10" -H "Accept: application/json"');
    const code = generateCurlCode(parsed, "fetch");
    expect(code).toContain("await fetch(");
    expect(code).toContain('"https://api.example.com/users?limit=10"');
    expect(code).toContain('"Accept": "application/json"');
  });

  it("generates axios code with method, url, and headers", () => {
    const parsed = parseCurl('curl -X GET "https://api.example.com/users?limit=10" -H "Accept: application/json"');
    const code = generateCurlCode(parsed, "axios");
    expect(code).toContain("axios.request({");
    expect(code).toContain('method: "GET"');
    expect(code).toContain('url: "https://api.example.com/users?limit=10"');
    expect(code).toContain('"Accept": "application/json"');
  });

  it("generates Python requests code with JSON body", () => {
    const parsed = parseCurl(
      `curl -X POST "https://api.example.com/users" -H "Content-Type: application/json" -d '{"name":"A"}'`,
    );
    const code = generateCurlCode(parsed, "python");
    expect(code).toContain("requests.request(");
    expect(code).toContain('"POST"');
    expect(code).toContain("json={");
    expect(code).toContain('"name": "A"');
  });

  it("generates Go code with headers", () => {
    const parsed = parseCurl('curl -X GET "https://api.example.com/users" -H "Authorization: Bearer TOKEN"');
    const code = generateCurlCode(parsed, "go");
    expect(code).toContain('http.NewRequest("GET"');
    expect(code).toContain("Authorization");
    expect(code).toContain("Bearer TOKEN");
    expect(code).toContain("http.DefaultClient.Do(req)");
  });

  it("exposes the four documented targets", () => {
    const ids = CURL_TARGETS.map((t) => t.id);
    expect(ids).toEqual(["fetch", "axios", "python", "go"]);
  });

  it("preserves headers and body for fetch POST", () => {
    const parsed = parseCurl(
      `curl -X POST "https://api.example.com/users" -H "Content-Type: application/json" -H "X-Key: 123" -d '{"name":"A"}'`,
    );
    const code = generateCurlCode(parsed, "fetch");
    expect(code).toContain('"X-Key": "123"');
    expect(code).toContain("method: \"POST\"");
    expect(code).toContain("JSON.stringify(");
    expect(code).toContain('"name": "A"');
  });

  it("throws for non-curl input", () => {
    expect(() => parseCurl("just some text")).toThrow();
  });
});
