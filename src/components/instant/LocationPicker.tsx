"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  isValidIana,
  listIanaZones,
  searchCountries,
  searchIanaZones,
  searchLocations,
  SUGGESTED_CITIES,
  type CatalogCity,
  type CountryEntry,
} from "@/lib/instant/catalog";
import { projectInstant } from "@/lib/instant/engine";
import { locationFromCity, locationFromCustom } from "@/lib/instant/locations";
import type { Location } from "@/lib/instant/types";

interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (location: Location) => void;
  atInstant: number;
}

/** Group IANA zones by their first path segment (region) for a clean scrollable list. */
function groupByRegion(zones: string[]): Array<{ region: string; items: string[] }> {
  const buckets = new Map<string, string[]>();
  for (const z of zones) {
    const seg = z.split("/")[0] ?? "Other";
    if (!buckets.has(seg)) buckets.set(seg, []);
    buckets.get(seg)!.push(z);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([region, items]) => ({ region, items: [...items].sort() }));
}

export function LocationPicker({ open, onClose, onPick, atInstant }: LocationPickerProps) {
  const [q, setQ] = useState("");
  const [custom, setCustom] = useState(false);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [iana, setIana] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ianaFocus, setIanaFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const allZones = useMemo(() => (open ? listIanaZones() : []), [open]);
  // When the user types: curated cities (top 8) + scored IANA list (up to 80).
  const cityResults = useMemo(() => searchLocations(q, 8), [q]);
  const ianaResults = useMemo(() => searchIanaZones(q, 80), [q]);
  // Countries first — type "Brazil" and pick the country to add its capital.
  const countryResults = useMemo(() => searchCountries(q, 6), [q]);
  // When the picker opens empty: show ALL IANA zones grouped by region.
  const grouped = useMemo(() => groupByRegion(allZones), [allZones]);
  // IANA suggestions for the Custom tab combobox - kept in sync with the
  // typed value (top 30 scored matches). Empty typed value lists everything.
  const ianaSuggestions = useMemo(() => searchIanaZones(iana, 30), [iana]);
  // If the typed value matches a country name or code, surface it first so
  // "India" lands on Asia/Kolkata, not "Indian/Antananarivo". Only the best
  // match is shown — countries are an entry point, not a catalog.
  const matchedCountry = useMemo(() => {
    const t = iana.trim();
    if (!t) return null;
    return searchCountries(t, 1)[0] ?? null;
  }, [iana]);
  // When the user types a query that doesn't match any city/IANA, offer it as a custom zone.
  const queryAsZone = useMemo(() => {
    const t = q.trim();
    if (!t) return null;
    const isCity = cityResults.some((c) => c.city.toLowerCase() === t.toLowerCase());
    const isIana = ianaResults.some((r) => r.iana.toLowerCase() === t.toLowerCase());
    if (isCity || isIana) return null;
    if (isValidIana(t)) return { iana: t, label: t.replace(/_/g, " ") };
    return null;
  }, [q, cityResults, ianaResults]);

  useEffect(() => {
    if (open) {
      setQ("");
      setCustom(false);
      setCity("");
      setCountry("");
      setCountryCode("");
      setIana("");
      setError(null);
      setIanaFocus(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  if (!open) return null;

  const submitCustom = () => {
    const zone = iana.trim();
    if (!zone || !isValidIana(zone)) {
      setError("Enter a valid IANA timezone (for example Asia/Kolkata).");
      return;
    }
    if (!city.trim()) {
      setError("City is required.");
      return;
    }
    onPick(
      locationFromCustom({
        city,
        country,
        countryCode,
        iana: zone,
        isPrimary: false,
      }),
    );
    onClose();
  };

  const pickCity = (c: CatalogCity) => {
    onPick(locationFromCity(c, false));
    onClose();
  };

  const pickIana = (zone: string) => {
    const cityName = zone.includes("/") ? zone.split("/").pop()!.replace(/_/g, " ") : zone;
    onPick(
      locationFromCustom({
        city: cityName,
        country: zone.split("/")[0] ?? "",
        countryCode: "",
        iana: zone,
        isPrimary: false,
      }),
    );
    onClose();
  };

  const pickCountry = (c: CountryEntry) => {
    onPick(
      locationFromCustom({
        city: c.capital,
        country: c.name,
        countryCode: c.code,
        iana: c.iana,
        isPrimary: false,
      }),
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh]" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Add location"
      >
        <div className="flex border-b border-[var(--workspace-border)]">
          <button
            type="button"
            className={`flex-1 py-2.5 text-xs font-semibold ${!custom ? "text-primary" : "text-[var(--workspace-text-muted)]"}`}
            onClick={() => setCustom(false)}
          >
            Search
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 text-xs font-semibold ${custom ? "text-primary" : "text-[var(--workspace-text-muted)]"}`}
            onClick={() => setCustom(true)}
          >
            Custom
          </button>
        </div>

        {!custom ? (
          <>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") onClose();
                if (e.key === "Enter") {
                  if (countryResults[0]) pickCountry(countryResults[0]);
                  else if (cityResults[0]) pickCity(cityResults[0]);
                  else if (ianaResults[0]) pickIana(ianaResults[0].iana);
                  else if (queryAsZone) pickIana(queryAsZone.iana);
                }
              }}
              placeholder="City, country, IN, or Asia/Kolkata"
              className="w-full border-b border-[var(--workspace-border)] bg-transparent px-4 py-2.5 text-xs text-[var(--workspace-text)] outline-none placeholder:text-[var(--workspace-text-muted)]"
              aria-autocomplete="list"
              aria-controls={listId}
            />
            <ul id={listId} role="listbox" className="max-h-96 overflow-y-auto py-1">
              {q.trim() ? (
                <>
                  {countryResults.length > 0 && (
                    <li className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                      Countries
                    </li>
                  )}
                  {countryResults.map((c, i) => {
                    const p = projectInstant(atInstant, c.iana);
                    return (
                      <li key={`country-${c.code}`} role="option" aria-selected={i === 0}>
                        <button
                          type="button"
                          className="flex w-full items-baseline justify-between gap-3 px-4 py-2 text-left hover:bg-[var(--workspace-background)]"
                          onClick={() => pickCountry(c)}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm text-[var(--workspace-text)]">
                              {c.name}
                              <span className="ml-1.5 font-mono text-[10px] text-[var(--workspace-text-muted)]">
                                {c.code}
                              </span>
                            </span>
                            <span className="text-[11px] text-[var(--workspace-text-muted)]">
                              {c.capital} · {c.iana}
                            </span>
                          </span>
                          <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--workspace-text-muted)]">
                            UTC{p.offsetLabel}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {cityResults.length > 0 && (
                    <li className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                      Cities
                    </li>
                  )}
              {cityResults.map((c, i) => {
                const p = projectInstant(atInstant, c.iana);
                return (
                  <li key={`city-${c.iana}-${c.city}`} role="option" aria-selected={i === 0}>
                    <button
                      type="button"
                      className="flex w-full items-baseline justify-between gap-3 px-4 py-2 text-left hover:bg-[var(--workspace-background)]"
                      onClick={() => pickCity(c)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-[var(--workspace-text)]">
                          {c.city}
                          {c.countryCode ? (
                            <span className="ml-1.5 font-mono text-[10px] text-[var(--workspace-text-muted)]">
                              {c.countryCode}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-[11px] text-[var(--workspace-text-muted)]">
                          {c.country}
                          {c.country ? " · " : ""}
                          {c.iana}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--workspace-text-muted)]">
                        UTC{p.offsetLabel}
                      </span>
                    </button>
                  </li>
                );
              })}
              {ianaResults.length > 0 && (
                <li className="mt-1 px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                  Timezones
                </li>
              )}
              {ianaResults.map((z) => {
                const p = projectInstant(atInstant, z.iana);
                return (
                  <li key={`zone-${z.iana}`} role="option">
                    <button
                      type="button"
                      className="flex w-full items-baseline justify-between gap-3 px-4 py-2 text-left hover:bg-[var(--workspace-background)]"
                      onClick={() => pickIana(z.iana)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-[var(--workspace-text)]">{z.label}</span>
                        <span className="font-mono text-[11px] text-[var(--workspace-text-muted)]">{z.iana}</span>
                      </span>
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--workspace-text-muted)]">
                        UTC{p.offsetLabel}
                      </span>
                    </button>
                  </li>
                );
              })}
              {queryAsZone ? (
                <li className="mt-1 border-t border-[var(--workspace-border)] px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                  Add as raw IANA
                </li>
              ) : null}
              {queryAsZone ? (
                <li role="option">
                  <button
                    type="button"
                    className="flex w-full items-baseline justify-between gap-3 px-4 py-2 text-left hover:bg-[var(--workspace-background)]"
                    onClick={() => pickIana(queryAsZone.iana)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-[var(--workspace-text)]">{queryAsZone.label}</span>
                      <span className="font-mono text-[11px] text-[var(--workspace-text-muted)]">{queryAsZone.iana}</span>
                    </span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wider text-primary">Use</span>
                  </button>
                </li>
              ) : null}
              {countryResults.length === 0 && cityResults.length === 0 && ianaResults.length === 0 && !queryAsZone ? (
                <li className="px-4 py-6 text-sm text-[var(--workspace-text-muted)]">
                  No matches. Try a city, country, code, or IANA zone.
                </li>
              ) : null}
                </>
              ) : (
                <>
                  <li className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                    Popular
                  </li>
                  {SUGGESTED_CITIES.map((c) => {
                    const p = projectInstant(atInstant, c.iana);
                    return (
                      <li key={`sug-${c.iana}-${c.city}`} role="option">
                        <button
                          type="button"
                          className="flex w-full items-baseline justify-between gap-3 px-4 py-2 text-left hover:bg-[var(--workspace-background)]"
                          onClick={() => pickCity(c)}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm text-[var(--workspace-text)]">
                              {c.city}
                              {c.countryCode ? (
                                <span className="ml-1.5 font-mono text-[10px] text-[var(--workspace-text-muted)]">
                                  {c.countryCode}
                                </span>
                              ) : null}
                            </span>
                            <span className="text-[11px] text-[var(--workspace-text-muted)]">
                              {c.country} · {c.iana}
                            </span>
                          </span>
                          <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--workspace-text-muted)]">
                            UTC{p.offsetLabel}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {grouped.map(({ region, items }) => (
                    <li key={region}>
                      <div className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                        {region}
                        <span className="ml-1.5 font-normal text-[var(--workspace-text-muted)]/70">{items.length}</span>
                      </div>
                      <ul>
                        {items.map((ianaZone) => {
                          const p = projectInstant(atInstant, ianaZone);
                          return (
                            <li key={`zone-${ianaZone}`} role="option">
                              <button
                                type="button"
                                className="flex w-full items-baseline justify-between gap-3 px-4 py-1.5 text-left hover:bg-[var(--workspace-background)]"
                                onClick={() => pickIana(ianaZone)}
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-sm text-[var(--workspace-text)]">
                                    {ianaZone.split("/").slice(1).join("/").replace(/_/g, " ") || ianaZone}
                                  </span>
                                  <span className="font-mono text-[11px] text-[var(--workspace-text-muted)]">{ianaZone}</span>
                                </span>
                                <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--workspace-text-muted)]">
                                  UTC{p.offsetLabel}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </>
        ) : (
          <form
            className="flex flex-col gap-3 px-4 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              submitCustom();
            }}
          >
            <label className="block text-[10px] text-[var(--workspace-text-muted)]">
              City
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="mt-1 h-7 w-full rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-2 text-xs text-[var(--workspace-text)] outline-none"
              />
            </label>
            <div className="grid grid-cols-[1fr_5rem] gap-2">
              <label className="block text-[10px] text-[var(--workspace-text-muted)]">
                Country
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-1 h-7 w-full rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-2 text-xs text-[var(--workspace-text)] outline-none"
                />
              </label>
              <label className="block text-[10px] text-[var(--workspace-text-muted)]">
                Code
                <input
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder="IN"
                  className="mt-1 h-7 w-full rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-2 font-mono text-xs uppercase text-[var(--workspace-text)] outline-none"
                />
              </label>
            </div>
            <label className="block text-[10px] text-[var(--workspace-text-muted)]">
              Timezone (IANA)
              <div className="relative mt-1">
                <input
                  value={iana}
                  onChange={(e) => setIana(e.target.value)}
                  onFocus={() => setIanaFocus(true)}
                  onBlur={() => window.setTimeout(() => setIanaFocus(false), 120)}
                  placeholder="Asia/Kolkata"
                  className="h-7 w-full rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-2 font-mono text-xs text-[var(--workspace-text)] outline-none focus:border-primary/40"
                  aria-autocomplete="list"
                />
                {ianaFocus && (ianaSuggestions.length > 0 || matchedCountry) && (
                  <ul
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-primary/30 bg-[var(--workspace-panel)] py-1 text-xs shadow-2xl"
                  >
                    {matchedCountry && (
                      <li className="px-3 pb-1 pt-1.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                        Country
                      </li>
                    )}
                    {matchedCountry && (
                      <li role="option">
                        <button
                          type="button"
                          className="flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left hover:bg-[var(--workspace-background)]"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setIana(matchedCountry.iana);
                            setCountry(matchedCountry.name);
                            setCountryCode(matchedCountry.code);
                            if (!city.trim()) setCity(matchedCountry.capital);
                            setIanaFocus(false);
                          }}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-medium text-[var(--workspace-text)]">
                              {matchedCountry.name}
                            </span>
                            <span className="font-mono text-[10px] text-[var(--workspace-text-muted)]">
                              {matchedCountry.iana}
                            </span>
                          </span>
                          <span className="shrink-0 text-[10px] uppercase tracking-wider text-primary">Use</span>
                        </button>
                      </li>
                    )}
                    {ianaSuggestions.length > 0 && (
                      <li className="px-3 pb-1 pt-1.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                        IANA zones
                      </li>
                    )}
                    {ianaSuggestions.map((z) => (
                      <li key={z.iana} role="option">
                        <button
                          type="button"
                          className="flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left hover:bg-[var(--workspace-background)]"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setIana(z.iana);
                            setIanaFocus(false);
                          }}
                        >
                          <span className="truncate font-mono text-xs text-[var(--workspace-text)]">{z.iana}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </label>
            {error && (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="h-8 rounded-lg bg-primary/15 text-xs font-semibold text-primary"
            >
              Add location
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
