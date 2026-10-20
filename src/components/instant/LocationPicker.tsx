"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  isValidIana,
  listIanaZones,
  searchCountries,
  searchIanaZones,
  searchLocations,
  searchZoneAbbreviations,
  SUGGESTED_CITIES,
  type CatalogCity,
  type CountryEntry,
} from "@/lib/instant/catalog";
import { Button, Segmented, TextField } from "@/components/kit";
import { projectInstant } from "@/lib/instant/engine";
import { locationFromCity, locationFromCustom } from "@/lib/instant/locations";
import type { Location } from "@/lib/instant/types";

interface LocationPickerProps {
  open: boolean;
  anchor: HTMLElement | null;
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

export function LocationPicker({ open, anchor, onClose, onPick, atInstant }: LocationPickerProps) {
  // Anchor the popover to the trigger button. Recompute on scroll/resize so
  // the popover stays glued to the button when the sticky header moves.
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; maxHeight: number } | null>(null);
  useLayoutEffect(() => {
    if (!open || !anchor) {
      setPos(null);
      return;
    }
    const update = () => {
      const r = anchor.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Start at the button's left edge, clamped so the whole popover stays on-screen.
      const width = Math.min(384, vw - 16);
      const left = Math.min(Math.max(8, r.left), vw - width - 8);
      // Open below, or above when the button sits low (the Add button lives in the board footer).
      const below = vh - r.bottom - 14;
      const above = r.top - 14;
      setPos(
        below >= 480 || below >= above
          ? { left, top: r.bottom + 6, maxHeight: below }
          : { left, bottom: vh - r.top + 6, maxHeight: above },
      );
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchor]);

  // Click outside (button + popover are exempt) closes. mousedown so the
  // popover's own clicks fire before close.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (popRef.current?.contains(t)) return;
      if (anchor?.contains(t)) return;
      onClose();
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open, anchor, onClose]);

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
  // Timezone abbreviations (PST, PDT, IST, CET, …) map to representative zones.
  const abbrResults = useMemo(() => searchZoneAbbreviations(q, 4), [q]);
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
    | { key: string; kind: "zone"; iana: string; label: string; abbr?: string };
  const browseZoneLabel = (z: string) =>
    z.split("/").slice(1).join("/").replace(/_/g, " ") || z;
  const results: Result[] = useMemo(() => {
    if (custom) return [];
    if (q.trim()) {
      return [
        ...countryResults.map(
          (c): Result => ({ key: `country-${c.code}`, kind: "country", entry: c }),
        ),
        ...abbrResults.map(
          (z): Result => ({ key: `abbr-${z.iana}-${z.label}`, kind: "zone", iana: z.iana, label: z.label, abbr: z.label.split(" ")[0] }),
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
  }, [custom, q, countryResults, abbrResults, cityResults, ianaResults, queryAsZone, allZones]);

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
    `flex w-full items-baseline justify-between gap-3 px-4 py-2 text-left transition-colors ${
      focused
        ? "bg-control-hover text-[var(--workspace-text)]"
        : "hover:bg-control"
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
              <span className="block truncate text-[13px] text-[var(--workspace-text)]">
                {r.entry.name}
                <span className="ml-1.5 font-mono text-[12px] text-[var(--workspace-text-muted)]">
                  {r.entry.code}
                </span>
              </span>
              <span className="text-[12px] text-[var(--workspace-text-muted)]">
                {r.entry.capital} · {r.entry.iana}
              </span>
            </span>
            <span className="shrink-0 font-mono text-[12px] tabular-nums text-[var(--workspace-text-muted)]">
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
              <span className="block truncate text-[13px] text-[var(--workspace-text)]">
                {r.city.city}
                {r.city.countryCode ? (
                  <span className="ml-1.5 font-mono text-[12px] text-[var(--workspace-text-muted)]">
                    {r.city.countryCode}
                  </span>
                ) : null}
              </span>
              <span className="text-[12px] text-[var(--workspace-text-muted)]">
                {r.city.country}
                {r.city.country ? " · " : ""}
                {r.city.iana}
              </span>
            </span>
            <span className="shrink-0 font-mono text-[12px] tabular-nums text-[var(--workspace-text-muted)]">
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
            <span className="block truncate text-[13px] text-[var(--workspace-text)]">
              {r.abbr ? (
                <span className="mr-1.5 rounded bg-control px-1 py-px font-mono text-[12px] font-semibold text-[var(--workspace-text)]">
                  {r.abbr}
                </span>
              ) : null}
              {r.label.replace(/^[A-Z]{2,5} · /, "")}
            </span>
            <span className="font-mono text-[12px] text-[var(--workspace-text-muted)]">
              {r.iana}
            </span>
          </span>
          {isQueryZone ? (
            <span className="shrink-0 text-[12px] font-medium text-[var(--workspace-text)]">Use</span>
          ) : (
            <span className="shrink-0 font-mono text-[12px] tabular-nums text-[var(--workspace-text-muted)]">
              UTC{p.offsetLabel}
            </span>
          )}
        </button>
      </li>
    );
  };

  if (!open || !pos) return null;

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
    <div
      ref={popRef}
      role="dialog"
      aria-label="Add location"
      style={{ position: "fixed", left: pos.left, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight, zIndex: 60 }}
      className="w-96 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-lg bg-popover text-[var(--workspace-text)] shadow-menu"
    >
      <div className="border-b border-[var(--workspace-border)] p-2">
        <Segmented<"search" | "custom">
          aria-label="Location source"
          value={custom ? "custom" : "search"}
          onChange={(v) => setCustom(v === "custom")}
          className="w-full [&>button]:flex-1"
          options={[
            { value: "search", label: "Search" },
            { value: "custom", label: "Custom" },
          ]}
        />
      </div>

        {!custom ? (
          <>
            <TextField
              ref={inputRef}
              wrapperClassName="m-2 w-[calc(100%-1rem)]"
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
                            aria-autocomplete="list"
              aria-controls={listId}
              aria-activedescendant={results[focusIdx] ? `${listId}-${focusIdx}` : undefined}
            />
            <ul
              id={listId}
              ref={listRef}
              role="listbox"
              className="max-h-96 overflow-y-auto py-1"
            >
              {q.trim() ? (
                <>
                  {countryResults.length > 0 && (
                    <li className="px-4 pb-1 pt-2 text-[12px] font-medium text-[var(--workspace-text-muted)]">
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
                  {abbrResults.length > 0 && (
                    <li className="px-4 pb-1 pt-2 text-[12px] font-medium text-[var(--workspace-text-muted)]">
                      Timezone abbreviations
                    </li>
                  )}
                  {abbrResults.map((z) => {
                    const key = `abbr-${z.iana}-${z.label}`;
                    const idx = idxByKey.get(key);
                    if (idx == null) return null;
                    const r: Result = { key, kind: "zone", iana: z.iana, label: z.label, abbr: z.label.split(" ")[0] };
                    return renderResultRow(r, idx);
                  })}
                  {cityResults.length > 0 && (
                    <li className="px-4 pb-1 pt-2 text-[12px] font-medium text-[var(--workspace-text-muted)]">
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
                    <li className="mt-1 px-4 pb-1 pt-2 text-[12px] font-medium text-[var(--workspace-text-muted)]">
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
                    <li className="mt-1 border-t border-[var(--workspace-border)] px-4 pb-1 pt-2 text-[12px] font-medium text-[var(--workspace-text-muted)]">
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
                  {countryResults.length === 0 && abbrResults.length === 0 && cityResults.length === 0 && ianaResults.length === 0 && !queryAsZone ? (
                    <li className="px-4 py-6 text-[13px] text-[var(--workspace-text-muted)]">
                      No matches. Try a city, country, code, or IANA zone.
                    </li>
                  ) : null}
                </>
              ) : (
                <>
                  <li className="px-4 pb-1 pt-2 text-[12px] font-medium text-[var(--workspace-text-muted)]">
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
                      <div className="px-4 pb-1 pt-2 text-[12px] font-medium text-[var(--workspace-text-muted)]">
                        {region}
                        <span className="ml-1.5 font-normal text-[var(--workspace-text-muted)]">{items.length}</span>
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
            <label className="block text-[12px] text-[var(--workspace-text-muted)]">
              City
              <TextField
                wrapperClassName="mt-1 w-full"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </label>
            <div className="grid grid-cols-[1fr_5rem] gap-2">
              <label className="block text-[12px] text-[var(--workspace-text-muted)]">
                Country
                <TextField
                  wrapperClassName="mt-1 w-full"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </label>
              <label className="block text-[12px] text-[var(--workspace-text-muted)]">
                Code
                <TextField
                  wrapperClassName="mt-1 w-full"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder="IN"
                  className="font-mono"
                />
              </label>
            </div>
            <label className="block text-[12px] text-[var(--workspace-text-muted)]">
              Timezone (IANA)
              <div className="relative mt-1">
                <TextField
                  wrapperClassName="w-full"
                  value={iana}
                  onChange={(e) => setIana(e.target.value)}
                  onFocus={() => setIanaFocus(true)}
                  onBlur={() => window.setTimeout(() => setIanaFocus(false), 120)}
                  placeholder="Asia/Kolkata"
                  className="font-mono"
                  aria-autocomplete="list"
                />
                {ianaFocus && (ianaSuggestions.length > 0 || matchedCountry) && (
                  <ul
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg bg-popover py-1 text-[13px] shadow-menu"
                  >
                    {matchedCountry && (
                      <li className="px-3 pb-1 pt-1.5 text-[12px] font-medium text-[var(--workspace-text-muted)]">
                        Country
                      </li>
                    )}
                    {matchedCountry && (
                      <li role="option" aria-selected={false}>
                        <button
                          type="button"
                          className="flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left hover:bg-control"
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
                            <span className="block truncate text-[13px] font-medium text-[var(--workspace-text)]">
                              {matchedCountry.name}
                            </span>
                            <span className="font-mono text-[12px] text-[var(--workspace-text-muted)]">
                              {matchedCountry.iana}
                            </span>
                          </span>
                          <span className="shrink-0 text-[12px] font-medium text-[var(--workspace-text)]">Use</span>
                        </button>
                      </li>
                    )}
                    {ianaSuggestions.length > 0 && (
                      <li className="px-3 pb-1 pt-1.5 text-[12px] font-medium text-[var(--workspace-text-muted)]">
                        IANA zones
                      </li>
                    )}
                    {ianaSuggestions.map((z) => (
                      <li key={z.iana} role="option" aria-selected={false}>
                        <button
                          type="button"
                          className="flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left hover:bg-control"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setIana(z.iana);
                            setIanaFocus(false);
                          }}
                        >
                          <span className="truncate font-mono text-[13px] text-[var(--workspace-text)]">{z.iana}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </label>
            {error && (
              <p className="text-[13px] text-bad" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              
            >
              Add location
            </Button>
          </form>
        )}
    </div>
  );
}
