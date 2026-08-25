import { describe, expect, it } from "vitest";
import {
  defaultWindow,
  hourMarkers,
  instantToX,
  maybePanWindow,
  snapInstant,
  trackWidthPx,
  xToInstant,
} from "./timeline";

const START = Date.parse("2026-08-23T00:00:00.000Z");
const END = Date.parse("2026-08-24T00:00:00.000Z");
const WINDOW = { start: START, end: END };
const WIDTH = 1000;

describe("timeline coordinates", () => {
  it("maps the same x to the same instant regardless of timezone", () => {
    const mid = START + 12 * 3600 * 1000;
    const x = instantToX(mid, WINDOW, WIDTH);
    expect(x).toBe(500);
    expect(xToInstant(x, WINDOW, WIDTH)).toBe(mid);
  });

  it("snaps to 15-minute UTC steps", () => {
    expect(snapInstant(Date.parse("2026-08-23T10:07:00.000Z"))).toBe(
      Date.parse("2026-08-23T10:00:00.000Z"),
    );
    expect(snapInstant(Date.parse("2026-08-23T10:08:00.000Z"))).toBe(
      Date.parse("2026-08-23T10:15:00.000Z"),
    );
  });

  it("pans when the cursor is near an edge", () => {
    const nearEnd = END - 30 * 60 * 1000;
    const next = maybePanWindow(nearEnd, WINDOW);
    expect(next.end).toBeGreaterThan(WINDOW.end);
    expect(next.end - next.start).toBe(WINDOW.end - WINDOW.start);
  });

  it("re-centers when the instant leaves the window", () => {
    const outside = END + 6 * 3600 * 1000;
    const next = maybePanWindow(outside, WINDOW);
    expect(outside).toBeGreaterThanOrEqual(next.start);
    expect(outside).toBeLessThanOrEqual(next.end);
  });

  it("emits hour markers in the primary timezone", () => {
    const marks = hourMarkers(WINDOW.start, WINDOW.end, "Asia/Kolkata");
    expect(marks.length).toBeGreaterThanOrEqual(23);
    expect(marks[0]?.hour).toBeGreaterThanOrEqual(0);
    expect(marks[0]?.hour).toBeLessThan(24);
  });

  it("uses at least 72px per hour for the scrollable track", () => {
    expect(trackWidthPx(WINDOW, 200)).toBe(24 * 72);
    expect(trackWidthPx(WINDOW, 3000)).toBe(3000);
  });

  it("builds a span-length default window around an instant", () => {
    const instant = Date.parse("2026-08-23T05:00:00.000Z");
    const w = defaultWindow(instant, 24);
    expect(w.end - w.start).toBe(24 * 3600 * 1000);
    expect(instant).toBeGreaterThanOrEqual(w.start);
    expect(instant).toBeLessThanOrEqual(w.end);
  });
});
