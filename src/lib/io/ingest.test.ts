import { describe, expect, it, vi } from "vitest";
import { AbortError, fetchUrlText, readFileAsTextGuarded } from "./ingest";
import { InputTooLargeError } from "./size";

describe("readFileAsTextGuarded", () => {
  it("reads small blobs under the cap", async () => {
    const blob = new Blob(["hello world"], { type: "text/plain" });
    const r = await readFileAsTextGuarded(blob, 1024);
    expect(r.text).toBe("hello world");
    expect(r.truncated).toBe(false);
    expect(r.bytes).toBe(blob.size);
  });

  it("returns truncated prefix when blob exceeds cap", async () => {
    const big = "x".repeat(10_000);
    const blob = new Blob([big], { type: "text/plain" });
    const r = await readFileAsTextGuarded(blob, 1000);
    expect(r.truncated).toBe(true);
    expect(r.bytes).toBe(1000);
    expect(r.text.length).toBe(1000);
  });

  it("throws AbortError on pre-aborted signal", async () => {
    const blob = new Blob(["hello"]);
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(readFileAsTextGuarded(blob, 1024, ctrl.signal)).rejects.toBeInstanceOf(AbortError);
  });
});

describe("fetchUrlText", () => {
  it("returns text under cap", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("payload body", { status: 200 }),
    );
    try {
      const r = await fetchUrlText("https://example.test/x", { maxBytes: 1024, timeoutMs: 1000 });
      expect(r.text).toBe("payload body");
      expect(r.truncated).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });

  it("truncates streaming response body that exceeds maxBytes", async () => {
    const big = "y".repeat(5000);
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(big, { status: 200 }),
    );
    try {
      const r = await fetchUrlText("https://example.test/x", { maxBytes: 100, timeoutMs: 1000 });
      expect(r.truncated).toBe(true);
      expect(r.bytes).toBe(100);
      expect(r.text.length).toBe(100);
    } finally {
      spy.mockRestore();
    }
  });

  it("throws InputTooLargeError when no-stream response exceeds cap", async () => {
    const big = "z".repeat(2000);
    const resNoBody = new Response(big, { status: 200 });
    Object.defineProperty(resNoBody, "body", { value: null });
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(resNoBody);
    try {
      await expect(
        fetchUrlText("https://example.test/x", { maxBytes: 100, timeoutMs: 1000 }),
      ).rejects.toBeInstanceOf(InputTooLargeError);
    } finally {
      spy.mockRestore();
    }
  });

  it("rejects on timeout", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new AbortError()));
      });
    });
    try {
      await expect(
        fetchUrlText("https://example.test/slow", { maxBytes: 1024, timeoutMs: 10 }),
      ).rejects.toBeInstanceOf(AbortError);
    } finally {
      spy.mockRestore();
    }
  });

  it("forwards caller abort signal", async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(
      fetchUrlText("https://example.test/x", { maxBytes: 1024, timeoutMs: 1000, signal: ctrl.signal }),
    ).rejects.toBeInstanceOf(AbortError);
  });

  it("rejects on non-2xx response", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 500, statusText: "Internal Server Error" }),
    );
    try {
      await expect(
        fetchUrlText("https://example.test/x", { maxBytes: 1024, timeoutMs: 1000 }),
      ).rejects.toThrow(/Fetch failed/);
    } finally {
      spy.mockRestore();
    }
  });
});
