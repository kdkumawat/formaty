import { describe, expect, it } from "vitest";
import {
  localMidnights,
  projectInstant,
  resolveLocalDateTime,
} from "./engine";

const KOLKATA_1030_UTC_MS = Date.parse("2026-08-23T05:00:00.000Z");

describe("projectInstant", () => {
  it("projects UTC, Kolkata, New York DST, and Tokyo from one instant", () => {
    const utc = projectInstant(KOLKATA_1030_UTC_MS, "UTC");
    expect(utc.hour).toBe(5);
    expect(utc.minute).toBe(0);
    expect(utc.offsetLabel).toBe("+00:00");

    const kolkata = projectInstant(KOLKATA_1030_UTC_MS, "Asia/Kolkata");
    expect(kolkata).toMatchObject({
      year: 2026,
      month: 8,
      day: 23,
      hour: 10,
      minute: 30,
      offsetLabel: "+05:30",
    });
    expect(kolkata.abbreviation).toMatch(/IST|GMT\+5:30/);

    const tokyo = projectInstant(KOLKATA_1030_UTC_MS, "Asia/Tokyo");
    expect(tokyo.hour).toBe(14);
    expect(tokyo.minute).toBe(0);
    expect(tokyo.offsetLabel).toBe("+09:00");

    const ny = projectInstant(KOLKATA_1030_UTC_MS, "America/New_York");
    expect(ny.hour).toBe(1);
    expect(ny.minute).toBe(0);
    expect(ny.offsetLabel).toBe("-04:00");
  });

  it("uses London BST in summer and GMT in winter", () => {
    const summer = projectInstant(Date.parse("2026-07-15T12:00:00.000Z"), "Europe/London");
    expect(summer.offsetLabel).toBe("+01:00");
    expect(summer.abbreviation).toMatch(/BST|GMT\+1/);

    const winter = projectInstant(Date.parse("2026-01-15T12:00:00.000Z"), "Europe/London");
    expect(winter.offsetLabel).toBe("+00:00");
    expect(winter.abbreviation).toMatch(/GMT|UTC/);
  });

  it("can show different local dates for the same instant", () => {
    const instant = Date.parse("2026-08-23T22:30:00.000Z");
    const london = projectInstant(instant, "Europe/London");
    const tokyo = projectInstant(instant, "Asia/Tokyo");
    expect(london.day).toBe(23);
    expect(tokyo.day).toBe(24);
  });
});

describe("resolveLocalDateTime", () => {
  it("maps Kolkata wall time to the matching UTC instant", () => {
    const result = resolveLocalDateTime({
      timeZone: "Asia/Kolkata",
      year: 2026,
      month: 8,
      day: 23,
      hour: 10,
      minute: 30,
    });
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.epochMs).toBe(KOLKATA_1030_UTC_MS);
    }
  });

  it("flags the US spring-forward gap as nonexistent", () => {
    const result = resolveLocalDateTime({
      timeZone: "America/New_York",
      year: 2026,
      month: 3,
      day: 8,
      hour: 2,
      minute: 30,
    });
    expect(result.status).toBe("nonexistent");
    if (result.status === "nonexistent") {
      expect(result.nearestEpochMs).toBeGreaterThan(0);
      expect(result.message).toMatch(/does not exist/i);
    }
  });

  it("flags the US fall-back overlap as ambiguous with two offsets", () => {
    const result = resolveLocalDateTime({
      timeZone: "America/New_York",
      year: 2026,
      month: 11,
      day: 1,
      hour: 1,
      minute: 30,
    });
    expect(result.status).toBe("ambiguous");
    if (result.status === "ambiguous") {
      expect(result.laterEpochMs - result.earlierEpochMs).toBe(60 * 60 * 1000);
      expect(result.earlierOffsetLabel).not.toBe(result.laterOffsetLabel);
    }
  });

  it("honors earlier/later when the caller disambiguates", () => {
    const wall = {
      timeZone: "America/New_York",
      year: 2026,
      month: 11,
      day: 1,
      hour: 1,
      minute: 30,
    };
    const earlier = resolveLocalDateTime(wall, "earlier");
    const later = resolveLocalDateTime(wall, "later");
    expect(earlier.status).toBe("ok");
    expect(later.status).toBe("ok");
    if (earlier.status === "ok" && later.status === "ok") {
      expect(later.epochMs - earlier.epochMs).toBe(60 * 60 * 1000);
    }
  });
});

describe("localMidnights", () => {
  it("returns local midnight instants inside the window", () => {
    const start = Date.parse("2026-08-23T10:00:00.000Z");
    const end = Date.parse("2026-08-24T20:00:00.000Z");
    const marks = localMidnights(start, end, "Asia/Tokyo");
    expect(marks.length).toBeGreaterThanOrEqual(1);
    for (const ms of marks) {
      const p = projectInstant(ms, "Asia/Tokyo");
      expect(p.hour).toBe(0);
      expect(p.minute).toBe(0);
    }
  });
});
