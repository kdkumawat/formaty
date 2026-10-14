import { describe, expect, it } from "vitest";
import { inScope } from "./scope";

describe("inScope", () => {
  it("splits categories across scopes", () => {
    expect(inScope("Transform", "All")).toBe(true);
    expect(inScope("Transform", "Commands")).toBe(true);
    expect(inScope("Tabs", "Commands")).toBe(false);
    expect(inScope("Utils", "Commands")).toBe(false);
    expect(inScope("Tabs", "Tabs")).toBe(true);
    expect(inScope("Utils", "Utilities")).toBe(true);
    expect(inScope("View", "Utilities")).toBe(false);
  });
});
