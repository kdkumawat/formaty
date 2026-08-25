import { Temporal } from "temporal-polyfill";
import type {
  DayPeriod,
  LocalTimeResolve,
  LocalWallTime,
  ZonedProjection,
} from "./types";

function dayPeriod(hour: number): DayPeriod {
  if (hour < 6 || hour >= 22) return "night";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function abbreviationAt(epochMs: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short",
  }).formatToParts(new Date(epochMs));
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}

function offsetLabelOf(zdt: Temporal.ZonedDateTime): string {
  return zdt.offset;
}

function offsetMinutesOf(zdt: Temporal.ZonedDateTime): number {
  return zdt.offsetNanoseconds / 1e9 / 60;
}

export function projectInstant(epochMs: number, timeZone: string): ZonedProjection {
  const zdt = Temporal.Instant.fromEpochMilliseconds(epochMs).toZonedDateTimeISO(timeZone);
  return {
    timeZone,
    epochMs,
    year: zdt.year,
    month: zdt.month,
    day: zdt.day,
    hour: zdt.hour,
    minute: zdt.minute,
    second: zdt.second,
    millisecond: zdt.millisecond,
    weekday: zdt.dayOfWeek,
    offsetMinutes: offsetMinutesOf(zdt),
    offsetLabel: offsetLabelOf(zdt),
    abbreviation: abbreviationAt(epochMs, timeZone),
    dayPeriod: dayPeriod(zdt.hour),
  };
}

function wallFields(input: LocalWallTime) {
  return {
    timeZone: input.timeZone,
    year: input.year,
    month: input.month,
    day: input.day,
    hour: input.hour,
    minute: input.minute,
    second: input.second ?? 0,
    millisecond: input.millisecond ?? 0,
  };
}

function zdtFromWall(
  input: LocalWallTime,
  disambiguation: "compatible" | "earlier" | "later" | "reject",
): Temporal.ZonedDateTime {
  return Temporal.ZonedDateTime.from(wallFields(input), { disambiguation });
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function wallClockLabel(input: LocalWallTime): string {
  const h12 = input.hour % 12 || 12;
  const suffix = input.hour < 12 ? "AM" : "PM";
  return `${h12}:${pad2(input.minute)} ${suffix}`;
}

function okFromZdt(zdt: Temporal.ZonedDateTime): LocalTimeResolve {
  return {
    status: "ok",
    epochMs: zdt.epochMilliseconds,
    offsetLabel: offsetLabelOf(zdt),
    abbreviation: abbreviationAt(zdt.epochMilliseconds, zdt.timeZoneId),
  };
}

function wallEquals(zdt: Temporal.ZonedDateTime, input: LocalWallTime): boolean {
  return (
    zdt.year === input.year &&
    zdt.month === input.month &&
    zdt.day === input.day &&
    zdt.hour === input.hour &&
    zdt.minute === input.minute &&
    zdt.second === (input.second ?? 0)
  );
}

export function resolveLocalDateTime(
  input: LocalWallTime,
  disambiguation?: "earlier" | "later",
): LocalTimeResolve {
  if (disambiguation) {
    return okFromZdt(zdtFromWall(input, disambiguation));
  }

  try {
    return okFromZdt(zdtFromWall(input, "reject"));
  } catch {
    const earlier = zdtFromWall(input, "earlier");
    const later = zdtFromWall(input, "later");
    const earlierMatch = wallEquals(earlier, input);
    const laterMatch = wallEquals(later, input);
    if (earlierMatch && laterMatch && earlier.epochMilliseconds !== later.epochMilliseconds) {
      return {
        status: "ambiguous",
        earlierEpochMs: earlier.epochMilliseconds,
        laterEpochMs: later.epochMilliseconds,
        earlierOffsetLabel: offsetLabelOf(earlier),
        laterOffsetLabel: offsetLabelOf(later),
        earlierAbbreviation: abbreviationAt(earlier.epochMilliseconds, input.timeZone),
        laterAbbreviation: abbreviationAt(later.epochMilliseconds, input.timeZone),
      };
    }
    const nearest = zdtFromWall(input, "compatible");
    return {
      status: "nonexistent",
      nearestEpochMs: nearest.epochMilliseconds,
      message: `${wallClockLabel(input)} doesn't exist on that date in this timezone — the clock skipped past it.`,
    };
  }
}

export function shiftLocalDate(epochMs: number, timeZone: string, days: number): number {
  const zdt = Temporal.Instant.fromEpochMilliseconds(epochMs).toZonedDateTimeISO(timeZone);
  const next = zdt.add({ days });
  const resolved = resolveLocalDateTime({
    timeZone,
    year: next.year,
    month: next.month,
    day: next.day,
    hour: zdt.hour,
    minute: zdt.minute,
    second: zdt.second,
    millisecond: zdt.millisecond,
  });
  if (resolved.status === "ok") return resolved.epochMs;
  if (resolved.status === "nonexistent") return resolved.nearestEpochMs;
  return resolved.earlierEpochMs;
}

export function localMidnights(startMs: number, endMs: number, timeZone: string): number[] {
  const marks: number[] = [];
  const startZdt = Temporal.Instant.fromEpochMilliseconds(startMs).toZonedDateTimeISO(timeZone);
  let cursor = startZdt.startOfDay();
  if (cursor.epochMilliseconds < startMs) {
    cursor = cursor.add({ days: 1 });
  }
  while (cursor.epochMilliseconds <= endMs) {
    marks.push(cursor.epochMilliseconds);
    cursor = cursor.add({ days: 1 });
  }
  return marks;
}

export function formatOffsetUtc(offsetLabel: string): string {
  return `UTC${offsetLabel === "+00:00" ? "" : offsetLabel}`;
}

export function unixSeconds(epochMs: number): number {
  return Math.floor(epochMs / 1000);
}

export function isoUtc(epochMs: number): string {
  return Temporal.Instant.fromEpochMilliseconds(epochMs).toString({ smallestUnit: "second" });
}

export function formatLocalDate(proj: ZonedProjection, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: proj.timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(proj.epochMs));
}

export function formatLocalTime(
  proj: ZonedProjection,
  timeFormat: "12h" | "24h",
  showSeconds: boolean,
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: proj.timeZone,
    hour: "numeric",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12: timeFormat === "12h",
  }).format(new Date(proj.epochMs));
}

export function formatLocalDateTime(
  proj: ZonedProjection,
  showSeconds: boolean,
): string {
  const pad = (n: number, w = 2) => n.toString().padStart(w, "0");
  const time = showSeconds
    ? `${pad(proj.hour)}:${pad(proj.minute)}:${pad(proj.second)}`
    : `${pad(proj.hour)}:${pad(proj.minute)}:00`;
  const sign = proj.offsetLabel;
  return `${proj.year}-${pad(proj.month)}-${pad(proj.day)} ${time} ${sign}`;
}
