import { describe, expect, it } from "vitest";
import { decodeState, encodeState, MAX_SHARE_HASH_CHARS, SHARE_TOO_LARGE } from "./shareState";

describe("shareState encode/decode", () => {
  it("roundtrips a simple state", () => {
    const state = { input: '{"a":1}', viewMode: "tree" as const };
    const hash = encodeState(state);
    expect(hash.startsWith("j:")).toBe(true);
    expect(decodeState(hash)).toEqual(state);
  });

  it("roundtrips a full workspace state including compare fields", () => {
    const state = {
      input: "",
      diffLeftInput: "a\nb\nc",
      diffRightInput: "b\nc\nd",
      diffKind: "list" as const,
      listCompareOptions: { caseInsensitive: true },
      csvColumn: "id",
      queryText: "$.users[*].id",
      preset: "compare-db-exports",
    };
    const hash = encodeState(state);
    expect(decodeState(hash)).toEqual(state);
  });

  it("ignores unknown fields for backwards compatibility", () => {
    const hash = encodeState({ input: "x", someFutureField: { a: 1 } } as never);
    const decoded = decodeState(hash);
    expect(decoded).toMatchObject({ input: "x" });
  });

  it("handles unicode and special characters in input", () => {
    const state = { input: '{"emoji":"🎉","quotes":"it\'s \\"quoted\\""}' };
    const hash = encodeState(state);
    expect(decodeState(hash)).toEqual(state);
  });

  it("uses compression prefix for large payloads", () => {
    const state = { input: JSON.stringify({ big: "x".repeat(110_000) }) };
    const hash = encodeState(state);
    expect(hash.startsWith("e:")).toBe(true);
    const decoded = decodeState(hash);
    expect(decoded?.input).toBe(state.input);
  });

  it("returns null for garbage input", () => {
    expect(decodeState("")).toBeNull();
    expect(decodeState("garbage")).toBeNull();
    expect(decodeState("j:%7B%7B")).toBeNull();
  });

  it("handles very large compressed payloads", () => {
    const big = JSON.stringify(
      Array.from({ length: 2_000 }, (_, i) => ({ id: i, name: `user-${i}`, tags: ["a", "b"] })),
    );
    const state = { input: big };
    const hash = encodeState(state);
    expect(hash).not.toBe(SHARE_TOO_LARGE);
    const decoded = decodeState(hash);
    expect(decoded?.input?.length).toBe(big.length);
    expect(decoded?.input).toBe(big);
  });

  it("refuses to encode payloads whose hash exceeds MAX_SHARE_HASH_CHARS", () => {
    // lz-string compresses repetitive input aggressively, so use a
    // pseudo-random base36 string that won't compress below the 32kB cap.
    const big = Array.from({ length: 100_000 }, (_, i) => i.toString(36)).join("");
    const state = { input: big };
    const hash = encodeState(state);
    expect(hash).toBe(SHARE_TOO_LARGE);
    expect(decodeState(SHARE_TOO_LARGE)).toBeNull();
  });

  it("exposes MAX_SHARE_HASH_CHARS as 32_000", () => {
    expect(MAX_SHARE_HASH_CHARS).toBe(32_000);
  });
});
