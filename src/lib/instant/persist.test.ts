// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("loadPrefs legacy zones", () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("upgrades saved Asia/Calcutta to Asia/Kolkata with the modern label", async () => {
    const { loadPrefs } = await import("./persist");
    store.set(
      "formaty-instant-prefs",
      JSON.stringify({
        primaryTimezone: "Asia/Calcutta",
        spanHours: 24,
        locations: [
          { id: "a", iana: "Asia/Calcutta", city: "Calcutta", country: "", countryCode: "", isPrimary: true },
          { id: "b", iana: "UTC", city: "UTC", country: "Worldwide", countryCode: "UN", isPrimary: false },
        ],
      }),
    );
    const p = loadPrefs()!;
    expect(p.primaryTimezone).toBe("Asia/Kolkata");
    expect(p.locations[0]).toMatchObject({ id: "a", iana: "Asia/Kolkata", city: "Kolkata", isPrimary: true });
    expect(p.locations[1].iana).toBe("UTC");
  });
});
