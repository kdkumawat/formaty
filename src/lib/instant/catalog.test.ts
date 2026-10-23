import { describe, expect, it } from "vitest";
import { canonicalZone, resolveZoneToken, searchIanaZones, searchZoneAbbreviations, zoneByAbbreviation } from "./catalog";

describe("zoneByAbbreviation", () => {
  it("maps PDT to America/Los_Angeles", () => {
    expect(zoneByAbbreviation("PDT")).toBe("America/Los_Angeles");
  });

  it("is case-insensitive and trims", () => {
    expect(zoneByAbbreviation(" pdt ")).toBe("America/Los_Angeles");
  });

  it("maps IST and CET", () => {
    expect(zoneByAbbreviation("IST")).toBe("Asia/Kolkata");
    expect(zoneByAbbreviation("CET")).toBe("Europe/Paris");
  });

  it("returns null for unknown abbreviations", () => {
    expect(zoneByAbbreviation("XYZ")).toBeNull();
  });
});

describe("searchZoneAbbreviations", () => {
  it("finds prefix matches like PT", () => {
    const r = searchZoneAbbreviations("P", 10);
    expect(r.some((z) => z.iana === "America/Los_Angeles")).toBe(true);
  });

  it("labels results with the abbreviation", () => {
    const r = searchZoneAbbreviations("PDT", 5);
    expect(r[0]?.label).toContain("PDT");
    expect(r[0]?.iana).toBe("America/Los_Angeles");
  });

  it("returns nothing for an empty query", () => {
    expect(searchZoneAbbreviations("")).toEqual([]);
  });
});

describe("canonicalZone", () => {
  it.each([
    ["Asia/Calcutta", "Asia/Kolkata"],
    ["asia/saigon", "Asia/Ho_Chi_Minh"],
    ["Asia/Katmandu", "Asia/Kathmandu"],
    ["Asia/Rangoon", "Asia/Yangon"],
    ["Europe/Kiev", "Europe/Kyiv"],
    ["America/Buenos_Aires", "America/Argentina/Buenos_Aires"],
    ["Asia/Dacca", "Asia/Dhaka"],
    ["Asia/Thimbu", "Asia/Thimphu"],
    ["Pacific/Truk", "Pacific/Chuuk"],
    ["Atlantic/Faeroe", "Atlantic/Faroe"],
    ["America/Godthab", "America/Nuuk"],
    ["Asia/Ulan_Bator", "Asia/Ulaanbaatar"],
    ["US/Pacific", "America/Los_Angeles"],
    ["Europe/Paris", "Europe/Paris"],
  ])("%s -> %s", (from, to) => {
    expect(canonicalZone(from)).toBe(to);
  });

  it("resolveZoneToken and zone search never surface legacy ids", () => {
    expect(resolveZoneToken("Asia/Calcutta")).toBe("Asia/Kolkata");
    expect(resolveZoneToken("Europe/Kiev")).toBe("Europe/Kyiv");
    expect(searchIanaZones("calcutta").some((r) => r.iana === "Asia/Calcutta")).toBe(false);
    expect(searchIanaZones("kolkata")[0].iana).toBe("Asia/Kolkata");
  });
});
