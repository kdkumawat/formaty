import { describe, expect, it } from "vitest";
import { parseInstantQuery, serializeInstantQuery } from "./url";
import { copyHuman, copyIso, copyUnix, copyUnixMs } from "./copy";
import {
  isValidIana,
  listIanaZones,
  searchIanaZones,
  searchLocations,
} from "./catalog";
import type { Location } from "./types";

describe("url state", () => {
  it("round-trips instant, primary tz, locations, format, and seconds", () => {
    const q = serializeInstantQuery({
      at: Date.parse("2026-08-23T05:00:00.000Z"),
      tz: "Asia/Kolkata",
      locations: ["Asia/Kolkata", "Europe/London", "America/New_York"],
      fmt: "24h",
      sec: true,
    });
    expect(q.get("at")).toBe("2026-08-23T05:00:00Z");
    expect(q.get("tz")).toBe("Asia/Kolkata");
    expect(q.get("locations")).toBe("Asia/Kolkata,Europe/London,America/New_York");
    expect(q.get("fmt")).toBe("24h");
    expect(q.get("sec")).toBe("1");

    const parsed = parseInstantQuery(q);
    expect(parsed.at).toBe(Date.parse("2026-08-23T05:00:00.000Z"));
    expect(parsed.start).toBeNull();
    expect(parsed.end).toBeNull();
    expect(parsed.tz).toBe("Asia/Kolkata");
    expect(parsed.locations).toEqual(["Asia/Kolkata", "Europe/London", "America/New_York"]);
    expect(parsed.fmt).toBe("24h");
    expect(parsed.sec).toBe(true);
  });

  it("round-trips a range via start= and end=", () => {
    const start = Date.parse("2026-08-23T05:00:00.000Z");
    const end = Date.parse("2026-08-23T07:00:00.000Z");
    const q = serializeInstantQuery({
      at: start,
      start,
      end,
      tz: "UTC",
      locations: ["UTC"],
      fmt: "24h",
      sec: false,
    });
    expect(q.get("start")).toBe("2026-08-23T05:00:00Z");
    expect(q.get("end")).toBe("2026-08-23T07:00:00Z");
    const parsed = parseInstantQuery(q);
    expect(parsed.start).toBe(start);
    expect(parsed.end).toBe(end);
  });

  it("ignores invalid start=/end= without throwing", () => {
    const parsed = parseInstantQuery(new URLSearchParams("start=nope&end=also-nope"));
    expect(parsed.start).toBeNull();
    expect(parsed.end).toBeNull();
  });

  it("ignores invalid at= without throwing", () => {
    const q = new URLSearchParams("at=not-a-date&tz=Asia/Kolkata");
    const parsed = parseInstantQuery(q);
    expect(parsed.at).toBeNull();
    expect(parsed.tz).toBe("Asia/Kolkata");
  });
});

describe("copy", () => {
  it("copies unix seconds as floor(ms/1000)", () => {
    const ms = Date.parse("2026-08-23T05:00:00.000Z");
    expect(copyUnix(ms)).toBe(String(Math.floor(ms / 1000)));
    expect(copyUnixMs(ms)).toBe(String(ms));
    expect(copyIso(ms)).toBe("2026-08-23T05:00:00Z");
  });

  it("formats a human conversion across locations", () => {
    const locations: Location[] = [
      { id: "1", iana: "Asia/Kolkata", city: "Kolkata", country: "India", countryCode: "IN", isPrimary: true },
      { id: "2", iana: "Europe/London", city: "London", country: "United Kingdom", countryCode: "GB", isPrimary: false },
    ];
    const text = copyHuman(Date.parse("2026-08-23T05:00:00.000Z"), locations, "12h", false);
    expect(text).toMatch(/Kolkata/);
    expect(text).toMatch(/London/);
    expect(text).toMatch(/10:30/);
  });
});

describe("catalog search", () => {
  it("finds London by city and IANA", () => {
    expect(searchLocations("London")[0]?.iana).toBe("Europe/London");
    expect(searchLocations("Europe/London")[0]?.iana).toBe("Europe/London");
  });

  it("finds cities by country name or code", () => {
    // Germany matches "Germany" (country) and "DE" (code).
    const byName = searchLocations("Germany");
    const byCode = searchLocations("DE");
    expect(byName.some((c) => c.iana === "Europe/Berlin")).toBe(true);
    expect(byCode.some((c) => c.iana === "Europe/Berlin")).toBe(true);
  });
});

describe("IANA zone search", () => {
  it("returns the full zone list when query is empty (or many zones)", () => {
    const zones = listIanaZones();
    expect(zones.length).toBeGreaterThanOrEqual(50);
    expect(zones).toContain("UTC");
    // Some runtimes (Bun) expose Asia/Calcutta instead of Asia/Kolkata for
    // legacy reasons; both refer to the same zone and both are valid.
    expect(
      zones.includes("Asia/Kolkata") || zones.includes("Asia/Calcutta"),
    ).toBe(true);
  });

  it("scored IANA search ranks exact matches first", () => {
    const r = searchIanaZones("UTC", 10);
    expect(r[0]?.iana).toBe("UTC");
  });

  it("scored IANA search matches by region prefix", () => {
    const r = searchIanaZones("Europe", 10);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((x) => x.iana.startsWith("Europe/"))).toBe(true);
  });

  it("accepts arbitrary valid IANA identifiers even when not in the curated list", () => {
    // Pacific/Pitcairn is a real zone but isn't in the curated CITY_CATALOG.
    expect(isValidIana("Pacific/Pitcairn")).toBe(true);
    // The all-zones list (Intl.supportedValuesOf) covers it.
    const zones = listIanaZones();
    if (zones.includes("Pacific/Pitcairn")) {
      expect(searchIanaZones("Pitcairn")[0]?.iana).toBe("Pacific/Pitcairn");
    }
  });
});
