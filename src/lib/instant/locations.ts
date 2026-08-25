import type { CatalogCity } from "./catalog";
import { cityByIana } from "./catalog";
import type { Location } from "./types";

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function locationFromCity(city: CatalogCity, isPrimary: boolean): Location {
  return {
    id: newId(),
    iana: city.iana,
    city: city.city,
    country: city.country,
    countryCode: city.countryCode,
    isPrimary,
  };
}

export function locationFromCustom(input: {
  city: string;
  country: string;
  countryCode: string;
  iana: string;
  isPrimary: boolean;
}): Location {
  return {
    id: newId(),
    iana: input.iana,
    city: input.city.trim() || input.iana,
    country: input.country.trim(),
    countryCode: input.countryCode.trim().toUpperCase().slice(0, 3),
    isPrimary: input.isPrimary,
  };
}

export function locationFromIana(iana: string, isPrimary: boolean): Location {
  const known = cityByIana(iana);
  if (known) return locationFromCity(known, isPrimary);
  const city = iana.includes("/") ? iana.split("/").pop()!.replace(/_/g, " ") : iana;
  return { id: newId(), iana, city, country: "", countryCode: "", isPrimary };
}

export function withPrimary(locations: Location[], primaryIana: string): Location[] {
  return locations.map((l) => ({ ...l, isPrimary: l.iana === primaryIana }));
}

export function uniqueIanas(locations: Location[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of locations) {
    if (seen.has(l.iana)) continue;
    seen.add(l.iana);
    out.push(l.iana);
  }
  return out;
}
