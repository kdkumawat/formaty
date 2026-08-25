import { describe, expect, it } from "vitest";
import { parseInstantInput } from "./parse";

const KOLKATA = "Asia/Kolkata";
const CONTEXT = {
  defaultTimeZone: KOLKATA,
  defaultDate: { year: 2026, month: 8, day: 23 },
};

describe("parseInstantInput", () => {
  it("parses ISO-8601 instants", () => {
    const r = parseInstantInput("2026-08-23T05:00:00Z", CONTEXT);
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.epochMs).toBe(Date.parse("2026-08-23T05:00:00.000Z"));
  });

  it("parses unix seconds vs milliseconds", () => {
    const sec = parseInstantInput("1787451600", CONTEXT);
    const ms = parseInstantInput("1787451600000", CONTEXT);
    expect(sec.status).toBe("ok");
    expect(ms.status).toBe("ok");
    if (sec.status === "ok") expect(sec.epochMs).toBe(1787451600 * 1000);
    if (ms.status === "ok") expect(ms.epochMs).toBe(1787451600000);
  });

  it("parses 10:30 UTC", () => {
    const r = parseInstantInput("10:30 UTC", CONTEXT);
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.epochMs).toBe(Date.parse("2026-08-23T10:30:00.000Z"));
    }
  });

  it("parses 10:30 Asia/Kolkata", () => {
    const r = parseInstantInput("10:30 Asia/Kolkata", CONTEXT);
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.epochMs).toBe(Date.parse("2026-08-23T05:00:00.000Z"));
    }
  });

  it("parses offset times", () => {
    const r = parseInstantInput("10:30 UTC+05:30", CONTEXT);
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.epochMs).toBe(Date.parse("2026-08-23T05:00:00.000Z"));
    }
  });

  it("parses date + time + IANA", () => {
    const r = parseInstantInput("2026-08-24 10:30 Asia/Kolkata", CONTEXT);
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.epochMs).toBe(Date.parse("2026-08-24T05:00:00.000Z"));
    }
  });

  it("returns invalid for garbage", () => {
    const r = parseInstantInput("not a time", CONTEXT);
    expect(r.status).toBe("invalid");
  });
});
