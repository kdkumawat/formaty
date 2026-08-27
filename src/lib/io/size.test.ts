import { describe, expect, it } from "vitest";
import {
  HUGE_INPUT_BYTES,
  InputTooLargeError,
  LARGE_INPUT_BYTES,
  WORKER_INPUT_CAP_BYTES,
  assertBelowCap,
  classifySize,
} from "./size";

describe("classifySize", () => {
  it("returns small for zero/negative/NaN", () => {
    expect(classifySize(0)).toBe("small");
    expect(classifySize(-1)).toBe("small");
    expect(classifySize(NaN)).toBe("small");
  });

  it("returns small below LARGE_INPUT_BYTES", () => {
    expect(classifySize(LARGE_INPUT_BYTES - 1)).toBe("small");
    expect(classifySize(LARGE_INPUT_BYTES - 1024)).toBe("small");
  });

  it("returns large at and above LARGE_INPUT_BYTES, below HUGE_INPUT_BYTES", () => {
    expect(classifySize(LARGE_INPUT_BYTES)).toBe("large");
    expect(classifySize(LARGE_INPUT_BYTES + 1024)).toBe("large");
    expect(classifySize(HUGE_INPUT_BYTES - 1)).toBe("large");
    expect(classifySize(1024 * 1024)).toBe("large");
  });

  it("returns huge at and above HUGE_INPUT_BYTES", () => {
    expect(classifySize(HUGE_INPUT_BYTES)).toBe("huge");
    expect(classifySize(HUGE_INPUT_BYTES + 1024)).toBe("huge");
    expect(classifySize(WORKER_INPUT_CAP_BYTES)).toBe("huge");
  });
});

describe("assertBelowCap", () => {
  it("does not throw when below cap", () => {
    expect(() => assertBelowCap(100, 200)).not.toThrow();
    expect(() => assertBelowCap(0, 0)).not.toThrow();
  });

  it("throws InputTooLargeError when over cap", () => {
    try {
      assertBelowCap(300, 200, "fetched response");
    } catch (err) {
      expect(err).toBeInstanceOf(InputTooLargeError);
      const e = err as InputTooLargeError;
      expect(e.bytes).toBe(300);
      expect(e.cap).toBe(200);
      expect(e.message).toContain("fetched response");
      return;
    }
    expect.fail("expected throw");
  });
});
