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

  describe("day words", () => {
    // 2026-08-23 20:00 UTC = 2026-08-24 01:30 in Kolkata, so "today" differs by zone.
    const now = Date.parse("2026-08-23T20:00:00Z");
    const ctx = { ...CONTEXT, now };
    const ms = (iso: string) => Date.parse(iso);
    const ok = (input: string) => {
      const r = parseInstantInput(input, ctx);
      expect(r.status).toBe("ok");
      return r.status === "ok" ? r.epochMs : NaN;
    };

    it("tomorrow 9am is next day in the home zone", () => {
      expect(ok("tomorrow 9am")).toBe(ms("2026-08-25T03:30:00Z"));
    });
    it("today 17:30 uses real today in home zone", () => {
      expect(ok("today 17:30")).toBe(ms("2026-08-24T12:00:00Z"));
    });
    it("yesterday with a zone token uses that zone's date", () => {
      expect(ok("yesterday 10:30 Asia/Tokyo")).toBe(ms("2026-08-23T01:30:00Z"));
    });
    it("handles 'tomorrow 9 pm' and UTC offsets", () => {
      expect(ok("tomorrow 9 pm UTC")).toBe(ms("2026-08-24T21:00:00Z"));
      expect(ok("today 10:00 UTC+05:30")).toBe(ms("2026-08-24T04:30:00Z"));
    });
    it("now is the current instant; bare tomorrow keeps time of day", () => {
      expect(ok("now")).toBe(now);
      expect(ok("tomorrow")).toBe(now + 24 * 3600e3);
      expect(ok("yesterday UTC")).toBe(now - 24 * 3600e3);
    });
    it("still rejects junk", () => {
      expect(parseInstantInput("tomorrow banana", ctx).status).toBe("invalid");
    });
  });

  it("accepts 10:30 PM and 9am without mistaking am/pm for a zone", () => {
    const pm = parseInstantInput("10:30 PM UTC", CONTEXT);
    expect(pm.status === "ok" && pm.epochMs).toBe(Date.parse("2026-08-23T22:30:00Z"));
    const am = parseInstantInput("9am", CONTEXT);
    expect(am.status === "ok" && am.epochMs).toBe(Date.parse("2026-08-23T03:30:00Z"));
  });
});
