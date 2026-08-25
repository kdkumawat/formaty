import { Temporal } from "temporal-polyfill";
import { resolveZoneToken } from "./catalog";
import { resolveLocalDateTime } from "./engine";

export interface ParseContext {
  defaultTimeZone: string;
  defaultDate: { year: number; month: number; day: number };
}

export type ParseResult =
  | { status: "ok"; epochMs: number }
  | { status: "invalid"; message: string }
  | { status: "nonexistent"; message: string; nearestEpochMs: number }
  | {
      status: "ambiguous";
      earlierEpochMs: number;
      laterEpochMs: number;
      earlierAbbreviation: string;
      laterAbbreviation: string;
    };

const ISO_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/i;
const DATE_PREFIX_RE = /^(\d{4}-\d{2}-\d{2})\s+/;
const TIME_RE =
  /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i;
const OFFSET_RE = /^(?:UTC|GMT)?([+-])(\d{1,2})(?::?(\d{2}))$/i;

function parseClock(raw: string): { hour: number; minute: number; second: number } | null {
  const m = raw.trim().match(TIME_RE);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const second = m[3] ? Number(m[3]) : 0;
  const ap = m[4]?.toUpperCase();
  if (minute > 59 || second > 59) return null;
  if (ap) {
    if (hour < 1 || hour > 12) return null;
    if (ap === "AM") hour = hour === 12 ? 0 : hour;
    else hour = hour === 12 ? 12 : hour + 12;
  } else if (hour > 23) {
    return null;
  }
  return { hour, minute, second };
}

function parseOffsetZone(token: string): string | null {
  const t = token.trim();
  const m = t.match(OFFSET_RE);
  if (!m) return null;
  const sign = m[1] === "-" ? "-" : "+";
  const hh = m[2].padStart(2, "0");
  const mm = (m[3] ?? "00").padStart(2, "0");
  return `UTC${sign}${hh}:${mm}`;
}

function applyWall(
  ctx: ParseContext,
  date: { year: number; month: number; day: number },
  clock: { hour: number; minute: number; second: number },
  timeZone: string,
): ParseResult {
  const resolved = resolveLocalDateTime({
    timeZone,
    year: date.year,
    month: date.month,
    day: date.day,
    hour: clock.hour,
    minute: clock.minute,
    second: clock.second,
  });
  if (resolved.status === "ok") return { status: "ok", epochMs: resolved.epochMs };
  if (resolved.status === "nonexistent") {
    return {
      status: "nonexistent",
      message: resolved.message,
      nearestEpochMs: resolved.nearestEpochMs,
    };
  }
  return {
    status: "ambiguous",
    earlierEpochMs: resolved.earlierEpochMs,
    laterEpochMs: resolved.laterEpochMs,
    earlierAbbreviation: resolved.earlierAbbreviation,
    laterAbbreviation: resolved.laterAbbreviation,
  };
}

function parseIso(text: string): number | null {
  try {
    return Temporal.Instant.from(text).epochMilliseconds;
  } catch {
    const n = Date.parse(text);
    return Number.isFinite(n) ? n : null;
  }
}

export function parseInstantInput(raw: string, ctx: ParseContext): ParseResult {
  const text = raw.trim();
  if (!text) return { status: "invalid", message: "That didn't parse. Try a time (10:30), a date (2024-03-09), or a timestamp (1716710400)." };

  if (/^-?\d+(\.\d+)?$/.test(text)) {
    const n = Number(text);
    if (!Number.isFinite(n)) return { status: "invalid", message: "That didn't parse. Try a time (10:30), a date (2024-03-09), or a timestamp (1716710400)." };
    const epochMs = Math.abs(n) > 1e12 ? n : n * 1000;
    if (!Number.isFinite(epochMs)) return { status: "invalid", message: "That didn't parse. Try a time (10:30), a date (2024-03-09), or a timestamp (1716710400)." };
    return { status: "ok", epochMs };
  }

  if (ISO_RE.test(text) || /^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const ms = parseIso(text);
    if (ms != null) return { status: "ok", epochMs: ms };
    return { status: "invalid", message: "That didn't parse. Try a time (10:30), a date (2024-03-09), or a timestamp (1716710400)." };
  }

  let rest = text;
  let date = ctx.defaultDate;
  const dateMatch = rest.match(DATE_PREFIX_RE);
  if (dateMatch) {
    const [y, mo, d] = dateMatch[1].split("-").map(Number);
    date = { year: y, month: mo, day: d };
    rest = rest.slice(dateMatch[0].length);
  } else {
    const humanDate = rest.match(/^([A-Za-z]{3,9})\s+(\d{1,2})(?:\s+(\d{4}))?\s+/);
    if (humanDate) {
      const months = "jan feb mar apr may jun jul aug sep oct nov dec".split(" ");
      const mi = months.indexOf(humanDate[1].slice(0, 3).toLowerCase());
      if (mi >= 0) {
        date = {
          year: humanDate[3] ? Number(humanDate[3]) : ctx.defaultDate.year,
          month: mi + 1,
          day: Number(humanDate[2]),
        };
        rest = rest.slice(humanDate[0].length);
      }
    }
  }

  const offsetIdx = rest.search(/\s+(?:UTC|GMT)?[+-]\d/i);
  const zoneIdx = rest.search(/\s+[A-Za-z][A-Za-z/_+-]*$/);
  let zoneRaw = "";
  let timeRaw = rest;
  if (offsetIdx >= 0) {
    timeRaw = rest.slice(0, offsetIdx);
    zoneRaw = rest.slice(offsetIdx).trim();
  } else if (zoneIdx >= 0) {
    timeRaw = rest.slice(0, zoneIdx);
    zoneRaw = rest.slice(zoneIdx).trim();
  }

  const clock = parseClock(timeRaw);
  if (!clock) {
    return { status: "invalid", message: "That didn't parse. Try a time (10:30), a date (2024-03-09), or a timestamp (1716710400)." };
  }

  let timeZone = ctx.defaultTimeZone;
  if (zoneRaw) {
    const offsetZone = parseOffsetZone(zoneRaw.replace(/^UTC/i, "UTC").replace(/^GMT/i, "GMT"));
    if (offsetZone) {
      // Temporal accepts +05:30 as an offset timezone via Instant arithmetic
      const sign = offsetZone[3] === "-" ? -1 : 1;
      const hh = Number(offsetZone.slice(4, 6));
      const mm = Number(offsetZone.slice(7, 9));
      const offsetMin = sign * (hh * 60 + mm);
      const asUtc = Date.UTC(date.year, date.month - 1, date.day, clock.hour, clock.minute, clock.second);
      return { status: "ok", epochMs: asUtc - offsetMin * 60 * 1000 };
    }
    if (/^(UTC|GMT)$/i.test(zoneRaw)) {
      timeZone = "UTC";
    } else {
      const resolved = resolveZoneToken(zoneRaw);
      if (!resolved) {
        return { status: "invalid", message: `No timezone matches "${zoneRaw}". Try a city or an IANA id like Asia/Kolkata.` };
      }
      timeZone = resolved;
    }
  }

  return applyWall(ctx, date, clock, timeZone);
}
