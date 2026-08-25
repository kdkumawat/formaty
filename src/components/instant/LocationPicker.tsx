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
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
  /** Arrow-key cursor. Resets when the query or tab changes. */
  const [focusIdx, setFocusIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
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

  // Flat ordered list of selectable results — drives arrow-key nav and
  // highlights the focused row. Search mode and the empty-query browse mode
  // share this so the user can always press Up/Down then Enter.
  type Result =
    | { key: string; kind: "country"; entry: CountryEntry }
    | { key: string; kind: "city"; city: CatalogCity }
    | { key: string; kind: "zone"; iana: string; label: string };
  const browseZoneLabel = (z: string) =>
    z.split("/").slice(1).join("/").replace(/_/g, " ") || z;
  const results: Result[] = useMemo(() => {
    if (custom) return [];
    if (q.trim()) {
      return [
        ...countryResults.map(
          (c): Result => ({ key: `country-${c.code}`, kind: "country", entry: c }),
        ),
        ...cityResults.map(
          (c): Result => ({ key: `city-${c.iana}-${c.city}`, kind: "city", city: c }),
        ),
        ...ianaResults.map(
          (z): Result => ({ key: `zone-${z.iana}`, kind: "zone", iana: z.iana, label: z.label }),
        ),
        ...(queryAsZone
          ? ([
              {
                key: `query-${queryAsZone.iana}`,
                kind: "zone" as const,
                iana: queryAsZone.iana,
                label: queryAsZone.label,
              },
            ] as Result[])
          : []),
      ];
    }
    // Empty query: popular cities first, then the full IANA list grouped
    // by region (region grouping is purely visual — the flat list is the
    // source of truth for keyboard nav).
    return [
      ...SUGGESTED_CITIES.map(
        (c): Result => ({ key: `sug-${c.iana}-${c.city}`, kind: "city", city: c }),
      ),
      ...allZones.map(
        (z): Result => ({ key: `allzone-${z}`, kind: "zone", iana: z, label: browseZoneLabel(z) }),
      ),
    ];
  }, [custom, q, countryResults, cityResults, ianaResults, queryAsZone, allZones]);

  const pickResult = (r: Result) => {
    if (r.kind === "country") return pickCountry(r.entry);
    if (r.kind === "city") return pickCity(r.city);
    return pickIana(r.iana);
  };

  // Flat idx lookup for the per-section render below.
  const idxByKey = useMemo(() => {
    const m = new Map<string, number>();
    results.forEach((r, i) => m.set(r.key, i));
    return m;
  }, [results]);

  // Reset the keyboard cursor when the result set changes shape (query,
  // tab switch, or first open) so the user always lands on the first hit.
  useEffect(() => {
    setFocusIdx(0);
  }, [q, custom, open]);

  // Keep the focused row in view as the user arrows down through long lists.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLElement>(`[data-idx="${focusIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [focusIdx]);

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

  // Render a single selectable row. Index + focus drive the keyboard
  // cursor and the active highlight; the list parent supplies the section
  // header so the visual structure is preserved.
  const rowClass = (focused: boolean) =>
    `flex w-full items-baseline justify-between gap-3 px-4 py-2 text-left text-sm text-[var(--workspace-text)] transition-colors ${
      focused
        ? "bg-primary/15 text-[var(--workspace-text)]"
        : "hover:bg-[var(--workspace-background)]"
    }`;
  const renderResultRow = (r: Result, idx: number) => {
    const focused = idx === focusIdx;
    const rowId = `${listId}-${idx}`;
    if (r.kind === "country") {
      const p = projectInstant(atInstant, r.entry.iana);
      return (
        <li
          key={r.key}
          id={rowId}
          data-idx={idx}
          role="option"
          aria-selected={focused}
        >
          <button
            type="button"
            className={rowClass(focused)}
            onMouseEnter={() => setFocusIdx(idx)}
            onClick={() => pickResult(r)}
          >
            <span className="min-w-0">
              <span className="block truncate text-sm text-[var(--workspace-text)]">
                {r.entry.name}
                <span className="ml-1.5 font-mono text-[10px] text-[var(--workspace-text-muted)]">
                  {r.entry.code}
                </span>
              </span>
              <span className="text-[11px] text-[var(--workspace-text-muted)]">
                {r.entry.capital} · {r.entry.iana}
              </span>
            </span>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--workspace-text-muted)]">
              UTC{p.offsetLabel}
            </span>
          </button>
        </li>
      );
    }
    if (r.kind === "city") {
      const p = projectInstant(atInstant, r.city.iana);
      return (
        <li
          key={r.key}
          id={rowId}
          data-idx={idx}
          role="option"
          aria-selected={focused}
        >
          <button
            type="button"
            className={rowClass(focused)}
            onMouseEnter={() => setFocusIdx(idx)}
            onClick={() => pickResult(r)}
          >
            <span className="min-w-0">
              <span className="block truncate text-sm text-[var(--workspace-text)]">
                {r.city.city}
                {r.city.countryCode ? (
                  <span className="ml-1.5 font-mono text-[10px] text-[var(--workspace-text-muted)]">
                    {r.city.countryCode}
                  </span>
                ) : null}
              </span>
              <span className="text-[11px] text-[var(--workspace-text-muted)]">
                {r.city.country}
                {r.city.country ? " · " : ""}
                {r.city.iana}
              </span>
            </span>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--workspace-text-muted)]">
              UTC{p.offsetLabel}
            </span>
          </button>
        </li>
      );
    }
    // zone
    const p = projectInstant(atInstant, r.iana);
    const isQueryZone = r.key.startsWith("query-");
    return (
      <li
        key={r.key}
        id={rowId}
        data-idx={idx}
        role="option"
        aria-selected={focused}
      >
        <button
          type="button"
          className={rowClass(focused)}
          onMouseEnter={() => setFocusIdx(idx)}
          onClick={() => pickResult(r)}
        >
          <span className="min-w-0">
            <span className="block truncate text-sm text-[var(--workspace-text)]">
              {r.label}
            </span>
            <span className="font-mono text-[11px] text-[var(--workspace-text-muted)]">
              {r.iana}
            </span>
          </span>
          {isQueryZone ? (
            <span className="shrink-0 text-[10px] uppercase tracking-wider text-primary">Use</span>
          ) : (
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--workspace-text-muted)]">
              UTC{p.offsetLabel}
            </span>
          )}
        </button>
      </li>
    );
  };

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
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        aria-label="Add a city"
        className="max-h-[90vh] w-full max-w-md gap-0 overflow-hidden rounded-2xl border border-[var(--workspace-text-muted)]/30 bg-[var(--secondary)] p-0 text-[var(--workspace-text)] shadow-2xl"
      >
        <DialogTitle className="sr-only">Add a city</DialogTitle>
        {/* Segmented tab switch matching the workspace settings panel
            (General | Compare | Utils). Same container + active fill so the
            user gets a single pattern across the app. */}
        <div
          className="flex items-center gap-px border-b border-[var(--workspace-text-muted)]/20 bg-[var(--workspace-background)] p-1"
          role="tablist"
          aria-label="Location source"
        >
          {(
            [
              ["search", "Search"],
              ["custom", "Custom"],
            ] as const
          ).map(([key, label]) => {
            const active = key === "custom" ? custom : !custom;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`h-7 flex-1 rounded-md text-[11px] font-semibold transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-[var(--workspace-text)]"
                }`}
                onClick={() => setCustom(key === "custom")}
              >
                {label}
              </button>
            );
          })}
        </div>

        {!custom ? (
          <>
            <Input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  onClose();
                  return;
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setFocusIdx((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setFocusIdx((i) => Math.max(0, i - 1));
                  return;
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  const r = results[focusIdx];
                  if (r) pickResult(r);
                }
              }}
              placeholder="City, country, IN, or Asia/Kolkata"
              className="h-9 rounded-none border-0 border-b border-[var(--workspace-text-muted)]/20 bg-[var(--workspace-background)] px-4 text-sm text-[var(--workspace-text)] placeholder:text-[var(--workspace-text-muted)] focus-visible:ring-0"
              aria-autocomplete="list"
              aria-controls={listId}
              aria-activedescendant={results[focusIdx] ? `${listId}-${focusIdx}` : undefined}
            />
            <ul
              id={listId}
              ref={listRef}
              role="listbox"
              className="max-h-[60vh] overflow-y-auto py-1"
            >
              {q.trim() ? (
                <>
                  {countryResults.length > 0 && (
                    <li className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                      Countries
                    </li>
                  )}
                  {countryResults.map((c) => {
                    const key = `country-${c.code}`;
                    const idx = idxByKey.get(key);
                    if (idx == null) return null;
                    const r: Result = { key, kind: "country", entry: c };
                    return renderResultRow(r, idx);
                  })}
                  {cityResults.length > 0 && (
                    <li className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                      Cities
                    </li>
                  )}
                  {cityResults.map((c) => {
                    const key = `city-${c.iana}-${c.city}`;
                    const idx = idxByKey.get(key);
                    if (idx == null) return null;
                    const r: Result = { key, kind: "city", city: c };
                    return renderResultRow(r, idx);
                  })}
                  {ianaResults.length > 0 && (
                    <li className="mt-1 px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                      Timezones
                    </li>
                  )}
                  {ianaResults.map((z) => {
                    const key = `zone-${z.iana}`;
                    const idx = idxByKey.get(key);
                    if (idx == null) return null;
                    const r: Result = { key, kind: "zone", iana: z.iana, label: z.label };
                    return renderResultRow(r, idx);
                  })}
                  {queryAsZone ? (
                    <li className="mt-1 border-t border-[var(--hairline)] px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                      Add as raw IANA
                    </li>
                  ) : null}
                  {queryAsZone
                    ? (() => {
                        const key = `query-${queryAsZone.iana}`;
                        const idx = idxByKey.get(key);
                        if (idx == null) return null;
                        const r: Result = {
                          key,
                          kind: "zone",
                          iana: queryAsZone.iana,
                          label: queryAsZone.label,
                        };
                        return renderResultRow(r, idx);
                      })()
                    : null}
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
                    const key = `sug-${c.iana}-${c.city}`;
                    const idx = idxByKey.get(key);
                    if (idx == null) return null;
                    const r: Result = { key, kind: "city", city: c };
                    return renderResultRow(r, idx);
                  })}
                  {grouped.map(({ region, items }) => (
                    <li key={region}>
                      <div className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                        {region}
                        <span className="ml-1.5 font-normal text-[var(--workspace-text-muted)]/70">{items.length}</span>
                      </div>
                      <ul>
                        {items.map((ianaZone) => {
                          const key = `allzone-${ianaZone}`;
                          const idx = idxByKey.get(key);
                          if (idx == null) return null;
                          const r: Result = {
                            key,
                            kind: "zone",
                            iana: ianaZone,
                            label: ianaZone.split("/").slice(1).join("/").replace(/_/g, " ") || ianaZone,
                          };
                          return renderResultRow(r, idx);
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
            <div className="space-y-1.5">
              <Label htmlFor="loc-city" className="text-[10px] uppercase tracking-wider text-[var(--workspace-text-muted)]">
                City
              </Label>
              <Input
                id="loc-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>
            <div className="grid grid-cols-[1fr_5rem] gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="loc-country" className="text-[10px] uppercase tracking-wider text-[var(--workspace-text-muted)]">
                  Country
                </Label>
                <Input
                  id="loc-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc-code" className="text-[10px] uppercase tracking-wider text-[var(--workspace-text-muted)]">
                  Code
                </Label>
                <Input
                  id="loc-code"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder="IN"
                  className="h-8 font-mono text-xs uppercase"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-iana" className="text-[10px] uppercase tracking-wider text-[var(--workspace-text-muted)]">
                Timezone (IANA)
              </Label>
              <div className="relative">
                <Input
                  id="loc-iana"
                  value={iana}
                  onChange={(e) => setIana(e.target.value)}
                  onFocus={() => setIanaFocus(true)}
                  onBlur={() => window.setTimeout(() => setIanaFocus(false), 120)}
                  placeholder="Asia/Kolkata"
                  className="h-8 font-mono text-xs"
                  aria-autocomplete="list"
                />
                {ianaFocus && (ianaSuggestions.length > 0 || matchedCountry) && (
                  <ul
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-primary/30 bg-[var(--ink-2)] py-1 text-xs shadow-2xl"
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
            </div>
            {error && (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" size="sm" className="mt-1">
              Add city
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
