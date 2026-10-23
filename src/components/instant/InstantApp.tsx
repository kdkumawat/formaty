"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ComputerDesktopIcon,
  MoonIcon,
  ShareIcon,
  SunIcon,
} from "@heroicons/react/16/solid";
import { Toaster, toast } from "@/components/Toast";
import {
  Button, Chip, IconButton, Menu, MenuContent, MenuRadioGroup, MenuRadioItem, MenuTrigger, NumberField,
  ResultActions, Segmented, TextField, Tooltip, type CopyFormat,
} from "@/components/kit";
import { useTheme } from "@/hooks/useTheme";
import { LocationPicker } from "@/components/instant/LocationPicker";
import { TimelineBoard } from "@/components/instant/TimelineBoard";
import {
  detectLocalIana,
  detectTimeFormat,
  type CatalogCity,
} from "@/lib/instant/catalog";
import { copyAll, copyHuman, copyIso, copyUnix, copyUnixMs } from "@/lib/instant/copy";
import {
  formatLocalTime,
  isoUtc,
  projectInstant,
  resolveLocalDateTime,
  shiftLocalDate,
} from "@/lib/instant/engine";
import { locationFromCity, locationFromIana, uniqueIanas } from "@/lib/instant/locations";
import { parseInstantInput } from "@/lib/instant/parse";
import { loadOnboarded, loadPrefs, loadTabSettings, saveOnboarded, savePrefs, saveTabSettings } from "@/lib/instant/persist";
import { getInstantSettings, setInstantSettings, subscribeInstantSettings, subscribeInstantShifts } from "@/lib/instant/settingsBus";
import { registerInstantActions } from "@/lib/instant/actionBus";
import { defaultWindow, maybePanWindow } from "@/lib/instant/timeline";
import type { Location, TimeFormat, TimelineSpanHours } from "@/lib/instant/types";
import { parseInstantQuery, serializeInstantQuery } from "@/lib/instant/url";

const COPY_FORMATS: CopyFormat[] = [
  { id: "human", label: "Summary", group: "Text" },
  { id: "all", label: "Every zone with IANA id", group: "Text" },
  { id: "iso", label: "ISO 8601 UTC", group: "Timestamp" },
  { id: "unix", label: "Unix seconds", group: "Timestamp" },
  { id: "unixms", label: "Unix milliseconds", group: "Timestamp" },
];

const longDate = (ms: number, timeZone: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(ms));

type DstNotice =
  | { kind: "nonexistent"; message: string; nearestEpochMs: number }
  | {
      kind: "ambiguous";
      earlierEpochMs: number;
      laterEpochMs: number;
      earlierAbbreviation: string;
      laterAbbreviation: string;
    };

/**
 * Instant — compare one moment across every timezone you care about.
 *
 * UX shape:
 *   header  ·  brand · unified smart input · "Now" pill · copy · share · reset
 *   primary ·  large current time + day nav + chips for every added location
 *   controls ·  hour quick-nav (−1d/−1h/+1h/+1d), range/span picker, "Today" snap
 *   timeline ·  horizontal hour-strip board
 *   footer  ·  raw Unix timestamp converter with per-row copy
 */
export function InstantApp({
  embedded = false,
  /** Workspace tab id. When set, Instant state is persisted per-tab so
   *  switching tabs preserves locations, primary zone, the selected
   *  moment, mode/range, and display preferences. Omit for the
   *  standalone /utils/instant page (which uses the global Instant
   *  prefs + URL query). */
  settingsKey,
}: {
  embedded?: boolean;
  settingsKey?: string;
} = {}) {
  const searchParams = useSearchParams();
  // Standalone page owns its own theme toggle so visitors can flip modes
  // without going back to the landing. Default is system (handled in
  // useTheme) and the choice persists in localStorage like the rest of
  // the app.
  const { themeMode, setThemeMode } = useTheme();
  const [copyFormat, setCopyFormat] = useState("human");
  const [ready, setReady] = useState(false);
  const [primaryTimezone, setPrimaryTimezone] = useState("UTC");
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedInstant, setSelectedInstant] = useState(() => Date.now());
  const [mode, setMode] = useState<"instant" | "range">("instant");
  const [range, setRange] = useState<{ start: number; end: number } | null>(null);
  const [spanHours, setSpanHours] = useState<TimelineSpanHours>(24);
  const [timeWindow, setTimeWindow] = useState(() => defaultWindow(Date.now(), 24));
  const [isLive, setIsLive] = useState(true);
  const [showSeconds, setShowSeconds] = useState(false);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("12h");
  const [hoverInstant, setHoverInstant] = useState<number | null>(null);
  const [nowInstant, setNowInstant] = useState(() => Date.now());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [dstNotice, setDstNotice] = useState<DstNotice | null>(null);
  const [onboard, setOnboard] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);
  const hydrated = useRef(false);
  // Anchor the Location popover to the + Location button so the popover
  // tracks the button's position on scroll.
  const [locationAnchor, setLocationAnchor] = useState<HTMLButtonElement | null>(null);
  const locationButtonRef = useCallback((el: HTMLButtonElement | null) => {
    setLocationAnchor(el);
  }, []);

  const commitInstant = useCallback((ms: number, live = false) => {
    setSelectedInstant(ms);
    setIsLive(live);
    setDstNotice(null);
    setTimeWindow((w) => maybePanWindow(ms, w));
  }, []);

  const commitRange = useCallback((start: number, end: number) => {
    const a = Math.min(start, end);
    const b = Math.max(start, end);
    setRange({ start: a, end: b });
    setSelectedInstant(a);
    setIsLive(false);
    setDstNotice(null);
    setTimeWindow((w) => maybePanWindow(b, maybePanWindow(a, w)));
  }, []);

  // Reset the hydration guard when the per-tab key changes so a workspace
  // tab switch re-loads the stored Instant state (the component may stay
  // mounted if both tabs use the utils pane).
  useEffect(() => {
    hydrated.current = false;
  }, [settingsKey]);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const q = parseInstantQuery(new URLSearchParams(searchParams.toString()));
    const prefs = loadPrefs();
    // Per-tab settings take precedence over global prefs/URL so each workspace
    // tab keeps its own Instant state across remounts.
    const tab = settingsKey ? loadTabSettings(settingsKey) : null;
    // In embedded mode, the workspace settings panel may have already seeded
    // a spanHours/timeFormat/showSeconds that beats both the URL and prefs.
    const bus = getInstantSettings();
    const localIana = detectLocalIana();
    const fmt = tab?.timeFormat ?? q.fmt ?? prefs?.timeFormat ?? bus.timeFormat ?? detectTimeFormat();
    const sec = tab?.showSeconds ?? q.sec ?? prefs?.showSeconds ?? bus.showSeconds ?? false;
    const tz = tab?.primaryTimezone ?? q.tz ?? prefs?.primaryTimezone ?? localIana;
    const span = (tab?.spanHours ?? prefs?.spanHours ?? bus.spanHours ?? 24) as TimelineSpanHours;

    let locs: Location[];
    if (tab?.locations?.length) {
      locs = tab.locations.map((l) => ({ ...l, isPrimary: l.iana === tz }));
    } else if (q.locations.length) {
      locs = q.locations.map((iana) => locationFromIana(iana, iana === tz));
      if (!locs.some((l) => l.iana === tz)) {
        locs = [locationFromIana(tz, true), ...locs.map((l) => ({ ...l, isPrimary: false }))];
      }
    } else if (prefs?.locations?.length) {
      locs = prefs.locations.map((l) => ({ ...l, isPrimary: l.iana === (prefs.primaryTimezone || tz) }));
    } else {
      // First-run default: the user's local zone + UTC, matching Reset.
      const localLoc = locationFromIana(tz, true);
      const utcLoc = locationFromIana("UTC", false);
      locs = tz === "UTC" ? [utcLoc] : [localLoc, utcLoc];
    }

    setPrimaryTimezone(tz);
    setLocations(locs);
    setTimeFormat(fmt);
    setShowSeconds(sec);
    const hasAt = q.at != null;
    const hasRange = q.start != null && q.end != null && q.start !== q.end;
    const hasLive = q.live && !hasAt && !hasRange;
    // Per-tab state restores the moment + mode even without a URL query.
    const useTabMoment = tab && hasAt === false && hasRange === false && !hasLive;
    const instant = hasRange
      ? Math.min(q.start!, q.end!)
      : hasAt
        ? q.at!
        : useTabMoment
          ? tab!.selectedInstant
          : Date.now();
    setSelectedInstant(instant);
    setIsLive(hasAt || hasRange ? false : hasLive ? true : useTabMoment ? tab!.isLive : true);
    if (hasRange) {
      setMode("range");
      setRange({ start: Math.min(q.start!, q.end!), end: Math.max(q.start!, q.end!) });
    } else if (useTabMoment && tab!.mode === "range" && tab!.range) {
      setMode("range");
      setRange(tab!.range);
    } else {
      setMode("instant");
      setRange(null);
    }
    setTimeWindow(defaultWindow(instant, span));
    setSpanHours(span);
    setOnboard(tab ? !tab.onboarded : !loadOnboarded());
    setReady(true);
  }, [searchParams, settingsKey]);

  useEffect(() => {
    if (!ready) return;
    if (settingsKey) {
      saveTabSettings(settingsKey, {
        locations,
        primaryTimezone,
        timeFormat,
        showSeconds,
        spanHours,
        selectedInstant,
        isLive,
        mode,
        range,
        onboarded: !onboard,
      });
    } else {
      savePrefs({ locations, primaryTimezone, timeFormat, showSeconds, spanHours });
    }
  }, [ready, settingsKey, locations, primaryTimezone, timeFormat, showSeconds, spanHours, selectedInstant, isLive, mode, range, onboard]);

  // Mirror the live settings into the settings bus so the workspace settings
  // panel reflects them when the user opens the gear. One-way write is
  // intentional: the panel only edits via the bus, and InstantApp owns the
  // canonical state.
  useEffect(() => {
    if (!ready) return;
    setInstantSettings({ spanHours, timeFormat, showSeconds });
  }, [ready, spanHours, timeFormat, showSeconds]);

  // Reverse direction: when the workspace settings panel flips a toggle or
  // moves the stepper, the bus fires and we apply it to local state.
  const busRef = useRef({ spanHours, timeFormat, showSeconds });
  busRef.current = { spanHours, timeFormat, showSeconds };
  useEffect(() => {
    if (!ready) return;
    return subscribeInstantSettings((s) => {
      const local = busRef.current;
      if (s.spanHours !== local.spanHours) setSpanHours(s.spanHours);
      if (s.timeFormat !== local.timeFormat) setTimeFormat(s.timeFormat);
      if (s.showSeconds !== local.showSeconds) setShowSeconds(s.showSeconds);
    });
  }, [ready]);

  // Settings panel can request shifts (-1h, +1h, today, etc.). Wired up
  // after goNow/commitInstant are declared below.

  // (Publish handlers to the action bus — declared after resetAll below.)

  useEffect(() => {
    if (!ready || embedded) return;
    const q = serializeInstantQuery({
      at: selectedInstant,
      tz: primaryTimezone,
      locations: uniqueIanas(locations),
      fmt: timeFormat,
      sec: showSeconds,
      start: mode === "range" ? range?.start : null,
      end: mode === "range" ? range?.end : null,
      // Live mode shares as `live=1` so the recipient lands in live-now
      // instead of the exact epoch ms the moment was when the URL was
      // last replaced (which would freeze on the second of sharing).
      live: isLive,
    });
    window.history.replaceState(null, "", `${window.location.pathname}?${q.toString()}`);
  }, [ready, embedded, selectedInstant, primaryTimezone, locations, timeFormat, showSeconds, mode, range, isLive]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const n = Date.now();
      setNowInstant(n);
      if (isLive) {
        setSelectedInstant(n);
        setTimeWindow((w) => maybePanWindow(n, w));
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [isLive]);

  useEffect(() => {
    setTimeWindow((w) => {
      const span = spanHours * 3600 * 1000;
      if (w.end - w.start === span) return w;
      return defaultWindow(selectedInstant, spanHours);
    });
  }, [spanHours, selectedInstant]);

  const primary = locations.find((l) => l.isPrimary) ?? locations[0];
  const primaryProj = useMemo(
    () => projectInstant(selectedInstant, primaryTimezone),
    [selectedInstant, primaryTimezone],
  );
  const projections = useMemo(
    () => locations.map((l) => projectInstant(selectedInstant, l.iana)),
    [locations, selectedInstant],
  );

  const applyWallInZone = useCallback(
    (
      timeZone: string,
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second = 0,
    ) => {
      const resolved = resolveLocalDateTime({ timeZone, year, month, day, hour, minute, second });
      if (resolved.status === "ok") {
        commitInstant(resolved.epochMs);
        return;
      }
      if (resolved.status === "nonexistent") {
        setDstNotice({
          kind: "nonexistent",
          message: resolved.message,
          nearestEpochMs: resolved.nearestEpochMs,
        });
        return;
      }
      setDstNotice({
        kind: "ambiguous",
        earlierEpochMs: resolved.earlierEpochMs,
        laterEpochMs: resolved.laterEpochMs,
        earlierAbbreviation: resolved.earlierAbbreviation,
        laterAbbreviation: resolved.laterAbbreviation,
      });
    },
    [commitInstant],
  );

  const addCity = (city: CatalogCity) => {
    setLocations((prev) => {
      if (prev.some((l) => l.iana === city.iana)) return prev;
      return [...prev, locationFromCity(city, false)];
    });
  };

  const goNow = useCallback(() => commitInstant(Date.now(), true), [commitInstant]);

  /**
   * Global reset: keep only the user's current timezone and UTC.
   * Restores the default clock format and the default window around now.
   */
  const resetAll = useCallback(() => {
    const localIana = detectLocalIana();
    const localLoc = locationFromIana(localIana, true);
    const utcLoc = locationFromIana("UTC", false);
    setLocations(localIana === "UTC" ? [utcLoc] : [localLoc, utcLoc]);
    setPrimaryTimezone(localIana);
    setMode("instant");
    setRange(null);
    setShowSeconds(false);
    setTimeFormat(detectTimeFormat());
    setSelectedInstant(Date.now());
    setTimeWindow(defaultWindow(Date.now(), 24));
    setSpanHours(24);
    setIsLive(true);
    setDstNotice(null);
    setSearchError(null);
    setSearch("");
    setOnboard(false);
    saveOnboarded();
    toast({ message: "Reset to your timezone + UTC", type: "success" });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (e.key === "Escape") {
        setPickerOpen(false);
        searchRef.current?.blur();
        return;
      }
      if (typing) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        goNow();
      }
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        setPickerOpen(true);
      }
      // ← → an hour, Shift a day, Alt 15 minutes (the same steps as a focused strip).
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const step = e.shiftKey ? 24 * 60 : e.altKey ? 15 : 60;
        commitInstant(selectedInstant + (e.key === "ArrowLeft" ? -1 : 1) * step * 60 * 1000);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commitInstant, goNow, selectedInstant]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ message: label, type: "success" });
    } catch {
      toast({ message: "Copy failed", type: "error" });
    }
  };

  /**
   * Build the human-readable conversion text once so copy + share + download
   * share a single source of truth. Falls back to ISO if there are no
   * locations.
   */
  const buildHumanText = useCallback(() => {
    return locations.length
      ? copyHuman(selectedInstant, locations, timeFormat, showSeconds)
      : isoUtc(selectedInstant);
  }, [locations, selectedInstant, timeFormat, showSeconds]);

  /**
   * Global "Copy" action: copy the human-readable conversion across locations.
   */
  const copySelected = useCallback(async () => {
    await copyText(buildHumanText(), "Copied");
  }, [buildHumanText]);

  /**
   * Download the same text Copy produces, written to a timestamped .txt file.
   * Plain Blob + anchor keeps it self-contained; the toast matches Copy.
   */
  const downloadText = useCallback(() => {
    const text = buildHumanText();
    try {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `instant-${new Date(selectedInstant).toISOString().replace(/[:.]/g, "-")}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ message: "Downloaded", type: "success" });
    } catch {
      toast({ message: "Download failed", type: "error" });
    }
  }, [buildHumanText, selectedInstant]);

  const copyAs = (format?: string) => {
    switch (format ?? copyFormat) {
      case "all":
        return copyAll(selectedInstant, locations, timeFormat, showSeconds);
      case "iso":
        return copyIso(selectedInstant);
      case "unix":
        return copyUnix(selectedInstant);
      case "unixms":
        return copyUnixMs(selectedInstant);
      default:
        return buildHumanText();
    }
  };

  const share = useCallback(async () => {
    const q = serializeInstantQuery({
      at: selectedInstant,
      tz: primaryTimezone,
      locations: uniqueIanas(locations),
      fmt: timeFormat,
      sec: showSeconds,
      start: mode === "range" ? range?.start : null,
      end: mode === "range" ? range?.end : null,
      live: isLive,
    });
    const url = `${window.location.origin}/utils/instant?${q.toString()}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Instant — Formaty", url });
        return;
      }
    } catch {
      // User cancelled or share failed; fall back to clipboard.
    }
    await copyText(url, "Share link copied");
  }, [selectedInstant, primaryTimezone, locations, timeFormat, showSeconds, mode, range, isLive]);

  // Publish copy/share/reset/download to the action bus so the workspace's
  // existing OutputActionBar can drive Instant's actions when Instant is the
  // active tool. In embedded mode, the Instant header suppresses its own bar
  // to avoid duplicating the workspace's.
  useEffect(() => {
    if (!ready) return;
    registerInstantActions({
      onCopy: () => void copySelected(),
      onShare: () => void share(),
      onReset: resetAll,
      onDownload: downloadText,
      resetLabel: "Reset to your timezone + UTC",
    });
    return () => registerInstantActions(null);
  }, [ready, copySelected, share, resetAll, downloadText]);

  // Settings panel shift requests (-1h, +1h, today, now). Route through the
  // same commitInstant the timeline drag uses.
  useEffect(() => {
    if (!ready) return;
    return subscribeInstantShifts((shift) => {
      if (shift === "now" || shift === "today") {
        goNow();
        return;
      }
      const map: Record<string, number> = {
        "-1d": -24 * 3600 * 1000,
        "-1h": -3600 * 1000,
        "+1h": 3600 * 1000,
        "+1d": 24 * 3600 * 1000,
      };
      commitInstant(selectedInstant + map[shift]);
    });
  }, [ready, selectedInstant, commitInstant, goNow]);

  const submitSearch = () => {
    // Always anchor bare clock inputs (e.g. "10:30") to *real today* in the
    // user's local zone, not the currently displayed day. Otherwise typing
    // "10:30" while looking at a different day silently shifts to that day.
    const now = new Date();
    const parsed = parseInstantInput(search, {
      defaultTimeZone: primaryTimezone,
      defaultDate: {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
      },
    });
    if (parsed.status === "ok") {
      commitInstant(parsed.epochMs);
      setSearchError(null);
      setSearch("");
      return;
    }
    if (parsed.status === "nonexistent") {
      setDstNotice({ kind: "nonexistent", message: parsed.message, nearestEpochMs: parsed.nearestEpochMs });
      setSearchError(parsed.message);
      return;
    }
    if (parsed.status === "ambiguous") {
      setDstNotice({
        kind: "ambiguous",
        earlierEpochMs: parsed.earlierEpochMs,
        laterEpochMs: parsed.laterEpochMs,
        earlierAbbreviation: parsed.earlierAbbreviation,
        laterAbbreviation: parsed.laterAbbreviation,
      });
      setSearchError("This local time occurs twice. Choose an offset.");
      return;
    }
    setSearchError(parsed.message);
  };

  /**
   * Open the native datetime picker (the hidden <input type="datetime-local">).
   * Native pickers don't expose a programmatic `show()`, so we focus + click.
   */
  const openDatePicker = () => {
    const el = datePickerRef.current;
    if (!el) return;
    el.focus();
    el.showPicker?.();
  };

  /**
   * When the user picks a wall time in the native picker, interpret the
   * value as a wall time in the primary zone (not the browser zone).
   * Format: "YYYY-MM-DDTHH:MM" (no seconds).
   */
  const submitDatePicker = (raw: string) => {
    if (!raw) return;
    const [date, time] = raw.split("T");
    if (!date || !time) return;
    const [y, m, d] = date.split("-").map(Number);
    const [h, min] = time.split(":").map(Number);
    if (!y || !m || !d || Number.isNaN(h) || Number.isNaN(min)) return;
    applyWallInZone(primaryTimezone, y, m, d, h, min);
  };

  /** Home row: the big clock and every row's offset are measured from it. It moves to the top. */
  const makePrimary = (id: string) => {
    const loc = locations.find((l) => l.id === id);
    if (!loc || loc.isPrimary) return;
    setPrimaryTimezone(loc.iana);
    setLocations((prev) => {
      const next = prev.map((l) => ({ ...l, isPrimary: l.id === id }));
      return [...next.filter((l) => l.isPrimary), ...next.filter((l) => !l.isPrimary)];
    });
  };

  if (!ready || !primary) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--workspace-background)] text-sm text-[var(--workspace-text-muted)] ${
          embedded ? "h-40" : "min-h-screen"
        }`}
      >
        Loading Instant…
      </div>
    );
  }

  // True when the selected moment falls on today's calendar day in the
  // primary zone. Drives the "Today" highlight on the day-nav button so the
  // user can see at a glance whether they're parked on today.
  const todayProj = projectInstant(nowInstant, primaryTimezone);
  const isToday =
    primaryProj.year === todayProj.year &&
    primaryProj.month === todayProj.month &&
    primaryProj.day === todayProj.day;

  return (
    <div
      className={`${embedded ? "min-h-0" : "min-h-screen"} bg-[var(--workspace-background)] text-[var(--workspace-text)]`}
    >
      {!embedded && <Toaster />}
      <section aria-label="Time and display controls" className="sticky top-0 z-40 border-b border-[var(--workspace-border)] bg-[var(--workspace-background)]">
        <div className={`mx-auto flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-1.5 ${embedded ? "" : "max-w-[1400px]"}`}>
          <form
            className="flex min-w-0 flex-1 basis-72 items-center gap-1 min-[901px]:max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch();
            }}
          >
            <TextField
              ref={searchRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchError(null);
              }}
              placeholder="10:30 Asia/Kolkata, 1710000000, 2024-03-09T14:00Z"
              aria-label="Convert a moment"
              className="font-mono"
              wrapperClassName="min-w-0 flex-1"
              onClear={() => {
                setSearch("");
                setSearchError(null);
              }}
            />
            <IconButton label="Pick a date and time" type="button" onClick={openDatePicker}>
              <CalendarIcon />
            </IconButton>
            {/* Off-screen but focusable so .showPicker() works. Value is
                always the primary zone's wall time so the picker feels
                consistent regardless of the user's browser timezone. */}
            <input
              ref={datePickerRef}
              type="datetime-local"
              value={`${primaryProj.year.toString().padStart(4, "0")}-${primaryProj.month.toString().padStart(2, "0")}-${primaryProj.day.toString().padStart(2, "0")}T${primaryProj.hour.toString().padStart(2, "0")}:${primaryProj.minute.toString().padStart(2, "0")}`}
              onChange={(e) => submitDatePicker(e.target.value)}
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
            />
          </form>
          <div className="flex flex-wrap items-center gap-2 min-[901px]:ml-auto">
            {/* Display options: inline only on the standalone page; in the workspace they live in Settings. */}
            {!embedded && (
              <>
                <NumberField
                  label="Days"
                  min={1}
                  max={14}
                  value={spanHours / 24}
                  onChange={(n) => setSpanHours((n * 24) as TimelineSpanHours)}
                />
                <Segmented<TimeFormat>
                  aria-label="Clock format"
                  value={timeFormat}
                  onChange={setTimeFormat}
                  options={[
                    { value: "12h", label: "12h" },
                    { value: "24h", label: "24h" },
                  ]}
                />
                <Chip on={showSeconds} onClick={() => setShowSeconds((s) => !s)}>
                  Seconds
                </Chip>
              </>
            )}
            <div className="flex items-center gap-0.5">
              <Tooltip content="Back 1 hour" shortcut="←">
                <IconButton label="Back 1 hour" onClick={() => commitInstant(selectedInstant - 3600 * 1000)}>
                  <ChevronLeftIcon />
                </IconButton>
              </Tooltip>
              <Tooltip content="Snap to the current moment" shortcut="N">
                <Button variant={isLive ? "selected" : "secondary"} onClick={goNow}>
                  <span aria-hidden className={`size-1.5 rounded-full ${isLive ? "animate-pulse bg-ok" : "bg-current opacity-60"}`} />
                  {isLive ? "Live" : "Now"}
                </Button>
              </Tooltip>
              <Tooltip content="Forward 1 hour" shortcut="→">
                <IconButton label="Forward 1 hour" onClick={() => commitInstant(selectedInstant + 3600 * 1000)}>
                  <ChevronRightIcon />
                </IconButton>
              </Tooltip>
            </div>
            {!embedded && (
              <>
                {/* Standalone theme switch: embedded mode inherits the workspace header's toggle. */}
                <Menu>
                  <MenuTrigger asChild>
                    <IconButton label="Theme">
                      {themeMode === "system" ? <ComputerDesktopIcon /> : themeMode === "dark" ? <MoonIcon /> : <SunIcon />}
                    </IconButton>
                  </MenuTrigger>
                  <MenuContent align="end">
                    <MenuRadioGroup value={themeMode} onValueChange={(v) => setThemeMode(v as typeof themeMode)}>
                      <MenuRadioItem value="system" icon={<ComputerDesktopIcon />}>System</MenuRadioItem>
                      <MenuRadioItem value="light" icon={<SunIcon />}>Light</MenuRadioItem>
                      <MenuRadioItem value="dark" icon={<MoonIcon />}>Dark</MenuRadioItem>
                    </MenuRadioGroup>
                  </MenuContent>
                </Menu>
                <IconButton label="Share link" onClick={() => void share()}>
                  <ShareIcon />
                </IconButton>
                <Tooltip content="Reset to your timezone and UTC">
                  <Button variant="ghost" onClick={resetAll}>
                    Reset
                  </Button>
                </Tooltip>
                <ResultActions
                  onDownload={downloadText}
                  copy={{
                    getText: copyAs,
                    formats: COPY_FORMATS,
                    format: copyFormat,
                    onFormatChange: setCopyFormat,
                  }}
                />
              </>
            )}
          </div>
        </div>
      </section>

      <main id={embedded ? undefined : "main"} className={`px-4 py-5 ${embedded ? "" : "mx-auto max-w-[1400px]"}`}>
        {onboard && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-sunk px-3 py-2 text-[13px]">
            <p>Move the line. Every timezone follows the same instant.</p>
            <Button
              onClick={() => {
                saveOnboarded();
                setOnboard(false);
              }}
            >
              Got it
            </Button>
          </div>
        )}

        {searchError && (
          <p className="mb-3 text-[13px] text-bad" role="alert">
            {searchError}
          </p>
        )}

        {dstNotice?.kind === "nonexistent" && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg bg-bad-bg px-3 py-2 text-[13px] text-bad">
            <p>{dstNotice.message}</p>
            <Button onClick={() => commitInstant(dstNotice.nearestEpochMs)}>Use nearest valid time</Button>
          </div>
        )}
        {dstNotice?.kind === "ambiguous" && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg bg-sunk px-3 py-2 text-[13px]">
            <p>This local time occurs twice. Choose one:</p>
            <Button onClick={() => commitInstant(dstNotice.earlierEpochMs)}>{dstNotice.earlierAbbreviation} (earlier)</Button>
            <Button onClick={() => commitInstant(dstNotice.laterEpochMs)}>{dstNotice.laterAbbreviation} (later)</Button>
          </div>
        )}

        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-[34px] font-medium leading-none tracking-tight tabular-nums sm:text-[40px]">
              {formatLocalTime(primaryProj, timeFormat, showSeconds)}
            </p>
            <p className="mt-1.5 truncate text-[13px] tabular-nums text-[var(--workspace-text-muted)]">
              <span className="font-medium text-[var(--workspace-text)]">{longDate(primaryProj.epochMs, primaryTimezone)}</span>
              {" · "}
              {primary.city} · UTC{primaryProj.offsetLabel} {primaryProj.abbreviation}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented<"instant" | "range">
              aria-label="Mode"
              value={mode}
              onChange={(m) => {
                if (m === "instant") {
                  setMode("instant");
                  setRange(null);
                } else {
                  setMode("range");
                  commitRange(selectedInstant, selectedInstant + 2 * 3600 * 1000);
                }
              }}
              options={[
                { value: "instant", label: "Instant" },
                { value: "range", label: "Range" },
              ]}
            />
            <div className="flex items-center gap-0.5">
              <IconButton label="Previous day" variant="secondary" onClick={() => commitInstant(shiftLocalDate(selectedInstant, primaryTimezone, -1))}>
                <ChevronLeftIcon />
              </IconButton>
              <Button variant="secondary" disabled={isToday} onClick={goNow} className="min-w-[4.5rem]">
                Today
              </Button>
              <IconButton label="Next day" variant="secondary" onClick={() => commitInstant(shiftLocalDate(selectedInstant, primaryTimezone, 1))}>
                <ChevronRightIcon />
              </IconButton>
            </div>
          </div>
        </div>

        {/* Stepper-style quick-nav lives in the workspace settings panel
            (Utils tab) for embedded, or in the inline Display row below for
            the standalone page. */}

        {mode === "range" && range ? (
          <p className="mb-3 text-[12px] tabular-nums text-[var(--workspace-text-muted)]">
            {Math.max(1, Math.round((range.end - range.start) / 60000))}m range
          </p>
        ) : null}

        {/* Display options (days / 12h-24h / seconds) live in the top
            bar header in both modes, so this row is intentionally omitted. */}

        <TimelineBoard
          locations={locations}
          projections={projections}
          timeWindow={timeWindow}
          selectedInstant={selectedInstant}
          hoverInstant={hoverInstant}
          nowInstant={nowInstant}
          isLive={isLive}
          timeFormat={timeFormat}
          showSeconds={showSeconds}
          primaryTimezone={primaryTimezone}
          mode={mode}
          range={range}
          onCommitInstant={(ms) => commitInstant(ms)}
          onCommitRange={commitRange}
          onHoverInstant={setHoverInstant}
          onCopyRow={(text) => void copyText(text, "Copied")}
          onSetPrimary={makePrimary}
          onRemove={(id) => setLocations((prev) => prev.filter((l) => l.id !== id || l.isPrimary))}
          onReorder={(fromId, toId) =>
            setLocations((prev) => {
              const from = prev.findIndex((l) => l.id === fromId);
              const to = prev.findIndex((l) => l.id === toId);
              if (from < 0 || to < 0 || from === to) return prev;
              const next = [...prev];
              const [moved] = next.splice(from, 1);
              next.splice(to, 0, moved);
              return next;
            })
          }
          ref={locationButtonRef}
          onAdd={() => setPickerOpen(true)}
          addOpen={pickerOpen}
        />
      </main>

      <LocationPicker open={pickerOpen} anchor={locationAnchor} onClose={() => setPickerOpen(false)} onPick={addCity} atInstant={selectedInstant} />
    </div>
  );
}
