import { describe, expect, it } from "vitest";
import { solarElevationDeg, sunGradient, ZONE_COORDS } from "./sun";

describe("solarElevationDeg", () => {
  it("is high at local noon near the equator and low at local midnight", () => {
    const singapore = ZONE_COORDS["Asia/Singapore"]!;
    const noon = Date.parse("2026-03-20T04:00:00.000Z"); // ~12:00 SGT
    const midnight = Date.parse("2026-03-20T16:00:00.000Z");
    expect(solarElevationDeg(singapore.lat, singapore.lng, noon)).toBeGreaterThan(40);
    expect(solarElevationDeg(singapore.lat, singapore.lng, midnight)).toBeLessThan(-10);
  });

  it("builds a CSS gradient with sunrise/sunset stops", () => {
    const coord = ZONE_COORDS["Europe/London"]!;
    const g = sunGradient(
      Date.parse("2026-06-21T00:00:00.000Z"),
      Date.parse("2026-06-22T00:00:00.000Z"),
      coord,
    );
    expect(g.startsWith("linear-gradient(to right")).toBe(true);
    expect(g).toContain("%");
  });
});
