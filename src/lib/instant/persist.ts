import type { Location, TimeFormat, TimelineSpanHours } from "./types";

const KEY = "formaty-instant-prefs";
const ONBOARD_KEY = "formaty-instant-onboarded";

export interface InstantPrefs {
  locations: Location[];
  primaryTimezone: string;
  timeFormat: TimeFormat;
  showSeconds: boolean;
  spanHours: TimelineSpanHours;
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
