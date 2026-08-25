import { Temporal } from "temporal-polyfill";
import type { TimeFormat } from "./types";

export interface InstantQuery {
  at: number | null;
  start: number | null;
  end: number | null;
  tz: string | null;
  locations: string[];
  fmt: TimeFormat | null;
  sec: boolean | null;
}

const IANA_RE = /^[A-Za-z0-9_+\-]+(?:\/[A-Za-z0-9_+\-]+)*$/;

function isIana(id: string): boolean {
  if (!IANA_RE.test(id)) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: id }).format(0);
    return true;
  } catch {
    return false;
  }
}

function isoSecond(ms: number): string {
  return Temporal.Instant.fromEpochMilliseconds(ms).toString({ smallestUnit: "second" });
}

function parseIsoOrDate(raw: string | null): number | null {
  if (!raw) return null;
  try {
    return Temporal.Instant.from(raw).epochMilliseconds;
  } catch {
    const n = Date.parse(raw);
    return Number.isFinite(n) ? n : null;
  }
}

export function serializeInstantQuery(input: {
  at: number;
  tz: string;
  locations: string[];
  fmt: TimeFormat;
  sec: boolean;
  start?: number | null;
  end?: number | null;
}): URLSearchParams {
  const q = new URLSearchParams();
  q.set("at", isoSecond(input.at));
  if (input.start != null && input.end != null) {
    q.set("start", isoSecond(input.start));
    q.set("end", isoSecond(input.end));
  }
  q.set("tz", input.tz);
  q.set("locations", input.locations.join(","));
  q.set("fmt", input.fmt);
  q.set("sec", input.sec ? "1" : "0");
  return q;
}

export function parseInstantQuery(params: URLSearchParams): InstantQuery {
  const at = parseIsoOrDate(params.get("at"));
  const start = parseIsoOrDate(params.get("start"));
  const end = parseIsoOrDate(params.get("end"));

  const tzRaw = params.get("tz");
  const tz = tzRaw && isIana(tzRaw) ? tzRaw : null;

  const locRaw = params.get("locations") ?? "";
  const locations = locRaw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && isIana(s));

  const fmtRaw = params.get("fmt");
  const fmt = fmtRaw === "12h" || fmtRaw === "24h" ? fmtRaw : null;

  const secRaw = params.get("sec");
  const sec = secRaw === "1" ? true : secRaw === "0" ? false : null;

  return { at, start, end, tz, locations, fmt, sec };
}
