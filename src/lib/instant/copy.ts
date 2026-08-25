import {
  formatLocalDate,
  formatLocalTime,
  isoUtc,
  projectInstant,
  unixSeconds,
} from "./engine";
import type { Location, TimeFormat } from "./types";

export function copyIso(epochMs: number): string {
  return isoUtc(epochMs);
}

export function copyUnix(epochMs: number): string {
  return String(unixSeconds(epochMs));
}

export function copyUnixMs(epochMs: number): string {
  return String(epochMs);
}

export function copyHuman(
  epochMs: number,
  locations: Location[],
  timeFormat: TimeFormat,
  showSeconds: boolean,
): string {
  const primary = locations.find((l) => l.isPrimary) ?? locations[0];
  const lines: string[] = [];
  if (primary) {
    const p = projectInstant(epochMs, primary.iana);
    lines.push(`${formatLocalTime(p, timeFormat, showSeconds)} ${p.abbreviation}`);
    lines.push(primary.city);
    lines.push(
      new Intl.DateTimeFormat("en-US", {
        timeZone: primary.iana,
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(epochMs)),
    );
    lines.push("");
  }
  for (const loc of locations) {
    if (loc === primary) continue;
    const p = projectInstant(epochMs, loc.iana);
    lines.push(`${loc.city}: ${formatLocalTime(p, timeFormat, showSeconds)} ${p.abbreviation}`);
  }
  return lines.join("\n").trim();
}

export function copyAll(
  epochMs: number,
  locations: Location[],
  timeFormat: TimeFormat,
  showSeconds: boolean,
): string {
  return locations
    .map((loc) => {
      const p = projectInstant(epochMs, loc.iana);
      return `${loc.city} (${loc.iana}): ${formatLocalDate(p)} ${formatLocalTime(p, timeFormat, showSeconds)} UTC${p.offsetLabel} ${p.abbreviation}`;
    })
    .join("\n");
}
