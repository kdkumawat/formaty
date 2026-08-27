"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ComputerDesktopIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Toaster, toast } from "@/components/Toast";
import { Tooltip } from "@/components/workspace/Tooltip";
import { Dropdown } from "@/components/workspace/Dropdown";
import { useTheme } from "@/hooks/useTheme";
import { LocationPicker } from "@/components/instant/LocationPicker";
import { TimelineBoard } from "@/components/instant/TimelineBoard";
import {
  OutputActionBar,
  type OutputActionVisibility,
} from "@/components/workspace/OutputActionBar";
import {
  detectLocalIana,
  detectTimeFormat,
  type CatalogCity,
} from "@/lib/instant/catalog";
import { copyHuman } from "@/lib/instant/copy";
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
  // Keep the global copy/share/reset/download available on the Instant bar.
  // Download saves the human-readable conversion as a .txt file; copy covers
  // the same text via the clipboard. No undo/redo/copy-as/maximize — the
  // smart input is the only mutation surface and there's nothing to undo.
  const outputActionVisibility: OutputActionVisibility = {
    copy: true,
    share: true,
    reset: true,
    download: true,
    undo: false,
    redo: false,
    copyAs: false,
    useAsInput: false,
    maximize: false,
  };
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
  /** Drag-and-drop reorder state for the location chips. Tracks the chip
   *  being dragged and the chip currently under the cursor. */
  const [dragSrcId, setDragSrcId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
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
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        commitInstant(selectedInstant - (e.shiftKey ? 60 : 15) * 60 * 1000);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        commitInstant(selectedInstant + (e.shiftKey ? 60 : 15) * 60 * 1000);
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
      <header className="sticky top-0 z-40 border-b border-[var(--workspace-border)]/80 bg-[var(--workspace-background)]/80 backdrop-blur-xl">
        <div className={`mx-auto flex h-12 items-center gap-2 px-3 ${embedded ? "" : "max-w-[1400px]"}`}>
          <form
            className="w-96 shrink-0"
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch();
            }}
          >
            <div className="relative">
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchError(null);
                }}
                placeholder="10:30 Asia/Kolkata · 1710000000 · 2024-03-09T14:00Z"
                className="h-7 w-full rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-panel)] pl-2 pr-7 font-mono text-[11px] leading-none text-[var(--workspace-text)] outline-none placeholder:text-[10px] placeholder:text-[var(--workspace-text-muted)] focus:border-primary/40"
                aria-label="Convert a moment"
              />
              <button
                type="button"
                onClick={openDatePicker}
                title="Pick a date and time"
                aria-label="Pick a date and time"
                className="absolute right-0.5 top-0.5 inline-flex h-6 w-6 items-center justify-center rounded text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-primary"
              >
                <CalendarIcon className="h-3 w-3" />
              </button>
            </div>
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
          {/* Display cluster: days / 12h-24h / seconds. Three independent
              toggles, visually grouped. Same wiring in embedded + standalone.
              ml-auto pushes the right-side group flush to the bar's end while
              the input stays anchored to the left. */}
          <div className="ml-auto flex h-7 shrink-0 items-center gap-1">
            <div className="flex h-7 items-stretch overflow-hidden rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-panel)]">
              <button
                type="button"
                onClick={() => setSpanHours((h) => Math.max(24, h - 24) as TimelineSpanHours)}
                className="px-1.5 text-[11px] font-medium text-[var(--workspace-text-muted)] hover:bg-primary/5 hover:text-[var(--workspace-text)]"
                title="Fewer days"
                aria-label="Fewer days"
              >
                −
              </button>
              <span className="inline-flex items-center px-1 text-[11px] font-mono tabular-nums text-[var(--workspace-text)]">
                {spanHours / 24}d
              </span>
              <button
                type="button"
                onClick={() => setSpanHours((h) => Math.min(14 * 24, h + 24) as TimelineSpanHours)}
                className="px-1.5 text-[11px] font-medium text-[var(--workspace-text-muted)] hover:bg-primary/5 hover:text-[var(--workspace-text)]"
                title="More days"
                aria-label="More days"
              >
                +
              </button>
            </div>
            <div className="flex h-7 items-stretch overflow-hidden rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-panel)]">
              {(["12h", "24h"] as TimeFormat[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setTimeFormat(f)}
                  aria-pressed={timeFormat === f}
                  className={`px-1.5 text-[11px] font-medium transition-colors ${
                    timeFormat === f
                      ? "bg-primary/15 text-primary"
                      : "text-[var(--workspace-text-muted)] hover:bg-primary/5 hover:text-[var(--workspace-text)]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowSeconds((s) => !s)}
              aria-pressed={showSeconds}
              className={`inline-flex h-7 items-center gap-1 rounded-md border px-1.5 text-[11px] font-medium transition-colors ${
                showSeconds
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-[var(--workspace-border)] bg-[var(--workspace-panel)] text-[var(--workspace-text-muted)] hover:text-[var(--workspace-text)]"
              }`}
              title="Show seconds"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  showSeconds ? "bg-primary" : "bg-[var(--workspace-text-muted)]/40"
                }`}
              />
              Sec
            </button>
          </div>
          <button
            type="button"
            onClick={goNow}
            className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium transition-colors ${
              isLive
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-[var(--workspace-border)] text-[var(--workspace-text-muted)] hover:text-[var(--workspace-text)]"
            }`}
            title="Snap to the current moment (N)"
            aria-label="Snap to the current moment"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-primary animate-pulse" : "bg-[var(--workspace-text-muted)]"}`} />
            {isLive ? "Live" : "Now"}
          </button>
          {/* Compact stepper. Two pairs (day / hour) each with a clear
              minus/plus. Uses ASCII +/- so the glyphs stay consistent across
              fonts; tooltips spell out the unit. */}
          <div className="flex h-7 shrink-0 items-stretch overflow-hidden rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-panel)]">
            <button
              type="button"
              onClick={() => commitInstant(selectedInstant - 24 * 3600 * 1000)}
              aria-label="Step back 1 day"
              title="Back 1 day (Shift+Left)"
              className="inline-flex items-center gap-0.5 px-1.5 text-[11px] font-medium text-[var(--workspace-text-muted)] hover:bg-primary/5 hover:text-[var(--workspace-text)]"
            >
              <ChevronLeftIcon className="h-3 w-3" />
              <span>1d</span>
            </button>
            <span className="w-px bg-[var(--workspace-border)]" aria-hidden="true" />
            <button
              type="button"
              onClick={() => commitInstant(selectedInstant - 3600 * 1000)}
              aria-label="Step back 1 hour"
              title="Back 1 hour (Left)"
              className="inline-flex items-center gap-0.5 px-1.5 text-[11px] font-medium text-[var(--workspace-text-muted)] hover:bg-primary/5 hover:text-[var(--workspace-text)]"
            >
              <ChevronLeftIcon className="h-3 w-3" />
              <span>1h</span>
            </button>
            <span className="w-px bg-[var(--workspace-border)]" aria-hidden="true" />
            <button
              type="button"
              onClick={() => commitInstant(selectedInstant + 3600 * 1000)}
              aria-label="Step forward 1 hour"
              title="Forward 1 hour (Right)"
              className="inline-flex items-center gap-0.5 px-1.5 text-[11px] font-medium text-[var(--workspace-text-muted)] hover:bg-primary/5 hover:text-[var(--workspace-text)]"
            >
              <span>1h</span>
              <ChevronRightIcon className="h-3 w-3" />
            </button>
            <span className="w-px bg-[var(--workspace-border)]" aria-hidden="true" />
            <button
              type="button"
              onClick={() => commitInstant(selectedInstant + 24 * 3600 * 1000)}
              aria-label="Step forward 1 day"
              title="Forward 1 day (Shift+Right)"
              className="inline-flex items-center gap-0.5 px-1.5 text-[11px] font-medium text-[var(--workspace-text-muted)] hover:bg-primary/5 hover:text-[var(--workspace-text)]"
            >
              <span>1d</span>
              <ChevronRightIcon className="h-3 w-3" />
            </button>
          </div>
          {!embedded && (
            <>
              {/* Standalone theme switch — embedded mode inherits the
                  workspace header's theme toggle. System follows the OS
                  preference until the user picks explicitly. */}
              <Dropdown
                side="bottom"
                align="end"
                contentClassName="w-32"
                trigger={
                  <Tooltip content="Theme">
                    <button
                      type="button"
                      aria-label="Theme"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--workspace-text-muted)] transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      {themeMode === "system" ? (
                        <ComputerDesktopIcon className="h-3.5 w-3.5" />
                      ) : themeMode === "dark" ? (
                        <MoonIcon className="h-3.5 w-3.5" />
                      ) : (
                        <SunIcon className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </Tooltip>
                }
              >
                <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                  {(
                    [
                      { mode: "system", label: "System", Icon: ComputerDesktopIcon },
                      { mode: "light", label: "Light", Icon: SunIcon },
                      { mode: "dark", label: "Dark", Icon: MoonIcon },
                    ] as const
                  ).map(({ mode, label, Icon }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setThemeMode(mode)}
                      className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                        themeMode === mode
                          ? "bg-primary/12 text-primary"
                          : "text-[var(--workspace-text)] hover:bg-primary/5"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </Dropdown>
              <OutputActionBar
                canCopy
                canShare
                visibility={outputActionVisibility}
                downloadMenuOpen={false}
                onDownloadMenuOpenChange={() => {}}
                onShare={() => void share()}
                onCopy={() => void copySelected()}
                onDownload={downloadText}
                onReset={resetAll}
                resetLabel="Reset to your timezone + UTC"
                className="ml-0.5"
              />
            </>
          )}
        </div>
      </header>

      <main className={`px-4 py-5 ${embedded ? "" : "mx-auto max-w-[1400px]"}`}>
        {onboard && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <p>Move the line. Every timezone follows the same instant.</p>
            <button
              type="button"
              className="text-xs text-primary"
              onClick={() => {
                saveOnboarded();
                setOnboard(false);
              }}
            >
              Got it
            </button>
          </div>
        )}

        {searchError && (
          <p className="mb-3 text-sm text-destructive" role="alert">
            {searchError}
          </p>
        )}

        {dstNotice?.kind === "nonexistent" && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
            <p>{dstNotice.message}</p>
            <button type="button" className="text-primary" onClick={() => commitInstant(dstNotice.nearestEpochMs)}>
              Use nearest valid time
            </button>
          </div>
        )}
        {dstNotice?.kind === "ambiguous" && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
            <p>This local time occurs twice. Choose one:</p>
            <button type="button" className="text-primary" onClick={() => commitInstant(dstNotice.earlierEpochMs)}>
              {dstNotice.earlierAbbreviation} (earlier)
            </button>
            <button type="button" className="text-primary" onClick={() => commitInstant(dstNotice.laterEpochMs)}>
              {dstNotice.laterAbbreviation} (later)
            </button>
          </div>
        )}

        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-3xl font-medium leading-none tracking-tight tabular-nums sm:text-4xl">
              {formatLocalTime(primaryProj, timeFormat, showSeconds)}
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-[var(--workspace-text-muted)]">
              UTC{primaryProj.offsetLabel} · {primaryProj.abbreviation}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-[var(--workspace-border)]">
              <button
                type="button"
                className={`h-8 px-3 text-xs font-medium ${
                  mode === "instant" ? "bg-primary/15 text-primary" : "text-[var(--workspace-text-muted)]"
                }`}
                onClick={() => {
                  setMode("instant");
                  setRange(null);
                }}
              >
                Instant
              </button>
              <button
                type="button"
                className={`h-8 px-3 text-xs font-medium ${
                  mode === "range" ? "bg-primary/15 text-primary" : "text-[var(--workspace-text-muted)]"
                }`}
                onClick={() => {
                  setMode("range");
                  commitRange(selectedInstant, selectedInstant + 2 * 3600 * 1000);
                }}
              >
                Range
              </button>
            </div>
            <div className="flex items-center rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)]">
              <button
                type="button"
                className="px-2 py-1.5 text-[var(--workspace-text-muted)] hover:text-[var(--workspace-text)]"
                aria-label="Previous day"
                title="Previous day"
                onClick={() => commitInstant(shiftLocalDate(selectedInstant, primaryTimezone, -1))}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-xs ${
                  isToday
                    ? "font-semibold text-primary"
                    : "text-[var(--workspace-text-muted)] hover:text-[var(--workspace-text)]"
                }`}
                title="Snap to the current moment"
                aria-pressed={isToday}
                onClick={() => {
                  // "Today" = right now, not the previously-selected hour. Going
                  // live keeps the timeline tick at the present.
                  goNow();
                }}
              >
                {isToday ? "Today" : "Go to today"}
              </button>
              <button
                type="button"
                className="px-2 py-1.5 text-[var(--workspace-text-muted)] hover:text-[var(--workspace-text)]"
                aria-label="Next day"
                title="Next day"
                onClick={() => commitInstant(shiftLocalDate(selectedInstant, primaryTimezone, 1))}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Location chips + add chip. Pill style — click body to set
            primary. Drag the chip to reorder. The "+ Location" pill sits
            last in the strip so adding a new location reads as the natural
            next step, and the popover anchors to it without crowding the
            top bar. */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {locations.map((loc) => {
              const proj = projections.find((p) => p.timeZone === loc.iana);
              if (!proj) return null;
              const isPrimary = loc.iana === primaryTimezone;
              const diffMin = primaryProj.offsetMinutes - proj.offsetMinutes;
              const diffHours = Math.round(diffMin / 60);
              const diffLabel =
                isPrimary
                  ? "you"
                  : diffHours === 0
                    ? "same"
                    : diffHours > 0
                      ? `+${diffHours}h`
                      : `${diffHours}h`;
              const rowTime = formatLocalTime(proj, timeFormat, showSeconds);
              const setPrimary = () => {
                if (isPrimary) return;
                setPrimaryTimezone(loc.iana);
                setLocations((prev) => {
                  const next = prev.map((l) => ({ ...l, isPrimary: l.iana === loc.iana }));
                  return [
                    ...next.filter((l) => l.isPrimary),
                    ...next.filter((l) => !l.isPrimary),
                  ];
                });
              };
              const isDragging = dragSrcId === loc.id;
              const isDragOver = dragOverId === loc.id && dragSrcId !== loc.id;
              return (
                <div
                  key={loc.id}
                  draggable
                  onDragStart={(e) => {
                    setDragSrcId(loc.id);
                    setDragOverId(loc.id);
                    // Plain text payload so the browser shows a generic
                    // drag image (we render our own visual feedback in
                    // place, no need for a custom drag image).
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", loc.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverId !== loc.id) setDragOverId(loc.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverId === loc.id) setDragOverId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const srcId = e.dataTransfer.getData("text/plain") || dragSrcId;
                    if (!srcId || srcId === loc.id) {
                      setDragSrcId(null);
                      setDragOverId(null);
                      return;
                    }
                    setLocations((prev) => {
                      const fromIdx = prev.findIndex((l) => l.id === srcId);
                      const toIdx = prev.findIndex((l) => l.id === loc.id);
                      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return prev;
                      const next = [...prev];
                      const [moved] = next.splice(fromIdx, 1);
                      next.splice(toIdx, 0, moved);
                      return next;
                    });
                    setDragSrcId(null);
                    setDragOverId(null);
                  }}
                  onDragEnd={() => {
                    setDragSrcId(null);
                    setDragOverId(null);
                  }}
                  className={`group inline-flex cursor-grab items-center rounded-full border text-[11px] transition-all active:cursor-grabbing ${
                    isDragging
                      ? "border-primary/40 bg-primary/10 text-primary opacity-50"
                      : isDragOver
                        ? "border-primary bg-primary/10 text-[var(--workspace-text)]"
                        : isPrimary
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-[var(--workspace-border)] bg-[var(--workspace-panel)] text-[var(--workspace-text-muted)] hover:border-primary/30"
                  }`}
                >
                  <button
                    type="button"
                    onClick={setPrimary}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1"
                    aria-label={isPrimary ? `Primary: ${loc.city}` : `Set ${loc.city} as primary`}
                    aria-pressed={isPrimary}
                  >
                    <span className="font-medium">{loc.city}</span>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                        isPrimary
                          ? "bg-primary/20 text-primary"
                          : "bg-[var(--workspace-background)] text-[var(--workspace-text-muted)]"
                      }`}
                    >
                      {diffLabel}
                    </span>
                    <span className="font-mono tabular-nums">{rowTime}</span>
                  </button>
                  {!isPrimary && locations.length > 1 && (
                    <Tooltip content="Remove" side="bottom">
                      <button
                        type="button"
                        aria-label={`Remove ${loc.city}`}
                        // Stop the chip drag from starting when the user
                        // clicks the remove button.
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocations((prev) => prev.filter((l) => l.id !== loc.id || l.isPrimary));
                        }}
                        className="mr-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-destructive"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </Tooltip>
                  )}
                </div>
              );
            })}
          <Tooltip content={`Add a location (A)`} side="bottom">
            <button
              ref={locationButtonRef}
              type="button"
              onClick={() => setPickerOpen(true)}
              aria-label="Add a location"
              aria-expanded={pickerOpen}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 text-[11px] font-medium transition-colors ${
                pickerOpen
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-[var(--workspace-border)] bg-transparent text-[var(--workspace-text-muted)] hover:border-primary/30 hover:text-[var(--workspace-text)]"
              }`}
            >
              <PlusIcon className="h-3 w-3" />
              <span>Location</span>
            </button>
          </Tooltip>
        </div>

        {/* Stepper-style quick-nav lives in the workspace settings panel
            (Utils tab) for embedded, or in the inline Display row below for
            the standalone page. */}

        {mode === "range" && range ? (
          <p className="mb-3 text-[10px] tabular-nums text-[var(--workspace-text-muted)]">
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
        />
      </main>

      <LocationPicker open={pickerOpen} anchor={locationAnchor} onClose={() => setPickerOpen(false)} onPick={addCity} atInstant={selectedInstant} />
    </div>
  );
}
