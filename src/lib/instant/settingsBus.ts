import { useEffect, useState } from "react";
import type { TimeFormat, TimelineSpanHours } from "./types";

/**
 * Bridge between the workspace settings panel and `<InstantApp>`. The Instant
 * app owns its own state internally (so the standalone page still works); the
 * settings panel needs to read and write that state when the user opens the
 * workspace gear → Utils tab. This module-level pub/sub keeps the two in sync
 * without lifting state out of InstantApp.
 *
 * Single-tab assumption: at most one Instant is mounted at a time. That's
 * true for the workspace (Instant is a sub-route of UtilsPanel) and the
 * standalone page.
 */
export interface InstantSettings {
  spanHours: TimelineSpanHours;
  timeFormat: TimeFormat;
  showSeconds: boolean;
}

const DEFAULT: InstantSettings = { spanHours: 24, timeFormat: "12h", showSeconds: false };

let state: InstantSettings = DEFAULT;
const listeners = new Set<(s: InstantSettings) => void>();

export function getInstantSettings(): InstantSettings {
  return state;
}

export function setInstantSettings(next: InstantSettings): void {
  if (
    next.spanHours === state.spanHours &&
    next.timeFormat === state.timeFormat &&
    next.showSeconds === state.showSeconds
  ) {
    return;
  }
  state = next;
  for (const l of listeners) l(state);
}

export function subscribeInstantSettings(l: (s: InstantSettings) => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useInstantSettings(): InstantSettings {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    return subscribeInstantSettings(l);
  }, []);
  return state;
}

/**
 * Fire-and-forget channel for the workspace settings panel to nudge
 * Instant's selected instant. The panel never owns state; it just signals
 * "the user pressed +1h" and Instant decides what to do.
 */
export type InstantShift = "-1d" | "-1h" | "+1h" | "+1d" | "now" | "today";
const shiftListeners = new Set<(shift: InstantShift) => void>();

export function requestInstantShift(shift: InstantShift): void {
  for (const l of shiftListeners) l(shift);
}

export function subscribeInstantShifts(l: (shift: InstantShift) => void): () => void {
  shiftListeners.add(l);
  return () => {
    shiftListeners.delete(l);
  };
}
