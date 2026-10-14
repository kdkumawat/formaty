import { describe, expect, it } from "vitest";
import { verifyHmac } from "./jwtVerify";
import { decodeJwt } from "@/lib/utils/devtools";

// The jwt.io sample token.
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("verifyHmac", () => {
  const { raw } = decodeJwt(TOKEN);
  it("accepts the right secret", async () => {
    expect(await verifyHmac(raw, "HS256", "your-256-bit-secret")).toBe(true);
  });
  it("rejects any other secret", async () => {
    expect(await verifyHmac(raw, "HS256", "wrong")).toBe(false);
  });
  it("throws on algorithms it cannot check", async () => {
    await expect(verifyHmac(raw, "RS256", "x")).rejects.toThrow();
  });
});
