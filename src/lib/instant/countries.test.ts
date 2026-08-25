import { describe, expect, it } from "vitest";
import {
  COUNTRY_CATALOG,
  countryByCode,
  countryByIana,
  searchCountries,
} from "./countries";
import { isValidIana } from "./catalog";

describe("countries catalog", () => {
  it("has unique ISO codes", () => {
    const codes = COUNTRY_CATALOG.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("every entry has a valid IANA timezone", () => {
    for (const c of COUNTRY_CATALOG) {
      expect(isValidIana(c.iana), `${c.name} (${c.code}) → ${c.iana}`).toBe(true);
    }
  });

  it("searchCountries ranks name matches highest", () => {
    const top = searchCountries("Argentina", 3);
    expect(top[0]?.name).toBe("Argentina");
  });

  it("searchCountries matches ISO code", () => {
    const top = searchCountries("jp", 3);
    expect(top[0]?.name).toBe("Japan");
  });

  it("searchCountries matches capital city", () => {
    const top = searchCountries("Brasília", 3);
    expect(top[0]?.name).toBe("Brazil");
  });

  it("searchCountries prefix-substring mix", () => {
    const top = searchCountries("braz", 3);
    expect(top.some((c) => c.name === "Brazil")).toBe(true);
  });

  it("empty query returns alphabetical slice", () => {
    const top = searchCountries("", 5);
    expect(top.length).toBe(5);
    const names = top.map((c) => c.name);
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);
  });

  it("countryByCode resolves US", () => {
    expect(countryByCode("US")?.name).toBe("United States");
  });

  it("countryByIana resolves primary zones", () => {
    expect(countryByIana("Asia/Tokyo")?.name).toBe("Japan");
  });
});
