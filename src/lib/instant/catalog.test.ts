import { describe, expect, it } from "vitest";
import { searchZoneAbbreviations, zoneByAbbreviation } from "./catalog";

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
