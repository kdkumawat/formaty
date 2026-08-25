import type { Location, TimeFormat, TimelineSpanHours } from "./types";

const KEY = "formaty-instant-prefs";
const ONBOARD_KEY = "formaty-instant-onboarded";
const TAB_KEY_PREFIX = "formaty-instant-tab:";

export interface InstantPrefs {
  locations: Location[];
  primaryTimezone: string;
  timeFormat: TimeFormat;
  showSeconds: boolean;
  spanHours: TimelineSpanHours;
}

/** Full per-tab Instant state. Wider than InstantPrefs — also captures the
 *  selected moment, mode/range, and the per-tab onboard flag. */
export interface InstantTabSettings {
  locations: Location[];
  primaryTimezone: string;
  timeFormat: TimeFormat;
  showSeconds: boolean;
  spanHours: TimelineSpanHours;
  selectedInstant: number;
  isLive: boolean;
  mode: "instant" | "range";
  range: { start: number; end: number } | null;
  onboarded: boolean;
}

function isValidTabSettings(parsed: unknown): parsed is InstantTabSettings {
  if (!parsed || typeof parsed !== "object") return false;
  const p = parsed as Record<string, unknown>;
  return (
    Array.isArray(p.locations) &&
    typeof p.primaryTimezone === "string" &&
    typeof p.timeFormat === "string" &&
    typeof p.showSeconds === "boolean" &&
    typeof p.spanHours === "number" &&
    typeof p.selectedInstant === "number" &&
    typeof p.isLive === "boolean" &&
    (p.mode === "instant" || p.mode === "range") &&
    typeof p.onboarded === "boolean"
  );
}

export function loadPrefs(): InstantPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InstantPrefs;
    if (!parsed || !Array.isArray(parsed.locations) || typeof parsed.primaryTimezone !== "string") {
      return null;
    }
    if (parsed.spanHours !== 24 && parsed.spanHours !== 96) {
      parsed.spanHours = 24;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function savePrefs(prefs: InstantPrefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota */
  }
}

export function loadOnboarded(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(ONBOARD_KEY) === "1";
  } catch {
    return true;
  }
}

export function saveOnboarded(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ONBOARD_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Per-tab Instant settings — each workspace tab gets its own copy so
 *  switching tabs preserves the user's choices. Falls back to null when
 *  nothing is stored (first visit on that tab). */
export function loadTabSettings(tabId: string): InstantTabSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TAB_KEY_PREFIX + tabId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidTabSettings(parsed)) return null;
    if (parsed.spanHours !== 24 && parsed.spanHours !== 96) {
      parsed.spanHours = 24;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveTabSettings(tabId: string, settings: InstantTabSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TAB_KEY_PREFIX + tabId, JSON.stringify(settings));
  } catch {
    /* ignore quota */
  }
}

/** Remove every stored per-tab Instant state. Used by "Reset all" / new-session
 *  flows so stale entries don't accumulate after the tab ids themselves are
 *  cleared. */
export function clearAllTabSettings(): void {
  if (typeof window === "undefined") return;
  try {
    const toDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(TAB_KEY_PREFIX)) toDelete.push(k);
    }
    toDelete.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
