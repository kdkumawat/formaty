import type { TimelineSpanHours } from "./types";

export interface TimeWindow {
  start: number;
  end: number;
}

const HOUR_MS = 3600 * 1000;
const MINUTE_MS = 60 * 1000;
export const PX_PER_HOUR = 72;
export const DAY_MS = 24 * HOUR_MS;
export const MAX_WINDOW_DAYS = 14;

export function trackWidthPx(window: TimeWindow, minWidth: number): number {
  const hours = (window.end - window.start) / HOUR_MS;
  return Math.max(minWidth, Math.round(hours * PX_PER_HOUR));
}

export function defaultWindow(instant: number, spanHours: TimelineSpanHours): TimeWindow {
  const span = spanHours * HOUR_MS;
  const start = instant - span / 2;
  return { start, end: start + span };
}

export function instantToX(instant: number, window: TimeWindow, width: number): number {
  const span = window.end - window.start;
  if (span <= 0 || width <= 0) return 0;
  return ((instant - window.start) / span) * width;
}

export function xToInstant(x: number, window: TimeWindow, width: number): number {
  const span = window.end - window.start;
  if (width <= 0) return window.start;
  return window.start + (x / width) * span;
}

export function snapInstant(ms: number, minutes = 15): number {
  const step = minutes * MINUTE_MS;
  return Math.round(ms / step) * step;
}

export function maybePanWindow(
  instant: number,
  window: TimeWindow,
  edgeRatio = 0.08,
): TimeWindow {
  const span = window.end - window.start;
  if (instant < window.start || instant > window.end) {
    const start = instant - span / 2;
    return { start, end: start + span };
  }
  const t = (instant - window.start) / span;
  if (t < edgeRatio) {
    const start = instant - span * 0.2;
    return { start, end: start + span };
  }
  if (t > 1 - edgeRatio) {
    const start = instant - span * 0.8;
    return { start, end: start + span };
  }
  return window;
}

export interface HourMarker {
  instant: number;
  hour: number;
  isMidnight: boolean;
}

export function extendWindow(window: TimeWindow, direction: -1 | 1, days = 1): TimeWindow {
  const delta = days * DAY_MS * direction;
  const span = window.end - window.start;
  const maxSpan = MAX_WINDOW_DAYS * DAY_MS;
  if (direction < 0) {
    const start = window.start + delta;
    const end = span >= maxSpan ? window.end + delta : window.end;
    return { start, end };
  }
  const end = window.end + delta;
  const start = span >= maxSpan ? window.start + delta : window.start;
  return { start, end };
}

export function hourMarkers(startMs: number, endMs: number, timeZone: string): HourMarker[] {
  const marks: HourMarker[] = [];
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
    minute: "2-digit",
  });
  // Step by 15 min then keep exact local hours — cheaper: step 1h from a UTC-aligned
  // hour after converting start to the next local hour via binary-ish walk.
  let t = Math.floor(startMs / HOUR_MS) * HOUR_MS;
  while (t < startMs) t += HOUR_MS;
  // Walk 15-minute ticks and keep when local minute is 00 (handles offset zones).
  const step = 15 * MINUTE_MS;
  t = Math.ceil(startMs / step) * step;
  while (t <= endMs) {
    const parts = fmt.formatToParts(new Date(t));
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    if (minute === 0) {
      marks.push({ instant: t, hour, isMidnight: hour === 0 });
    }
    t += step;
  }
  return marks;
}
