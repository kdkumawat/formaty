"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, ClipboardDocumentIcon, SunIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@/components/workspace/Tooltip";
import {
  formatLocalDate,
  formatLocalTime,
  localMidnights,
  projectInstant,
} from "@/lib/instant/engine";
import { coordsForZone, sunGradient } from "@/lib/instant/sun";
import {
  hourMarkers,
  instantToX,
  snapInstant,
  trackWidthPx,
  xToInstant,
  type TimeWindow,
} from "@/lib/instant/timeline";
import type { DayPeriod, Location, TimeFormat, ZonedProjection } from "@/lib/instant/types";

const LABEL_W = 208;

const PERIOD_TINT: Record<DayPeriod, string> = {
  night: "var(--period-night)",
  morning: "var(--period-morning)",
  afternoon: "var(--period-afternoon)",
  evening: "var(--period-evening)",
};

function clockGradient(window: TimeWindow, timeZone: string): string {
  const samples = 24;
  const span = window.end - window.start;
  const stops: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = projectInstant(window.start + t * span, timeZone);
    stops.push(`${PERIOD_TINT[p.dayPeriod]} ${(t * 100).toFixed(2)}%`);
  }
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

function stripGradient(window: TimeWindow, timeZone: string): string {
  const coord = coordsForZone(timeZone);
  if (coord) return sunGradient(window.start, window.end, coord);
  return clockGradient(window, timeZone);
}

function hourLabel(hour: number, timeFormat: TimeFormat): string {
  if (timeFormat === "24h") return hour.toString().padStart(2, "0");
  const h = hour % 12 || 12;
  const suffix = hour < 12 ? "a" : "p";
  return `${h}${suffix}`;
}

/**
 * Copy the row's current wall time. Always emits the full date+time so the
 * clipboard entry is unambiguous no matter which row or day the user is on.
 */
function buildRowCopyText(proj: ZonedProjection, timeFormat: TimeFormat, showSeconds: boolean): string {
  const date = formatLocalDate(proj).replace(/,/g, "");
  const time = formatLocalTime(proj, timeFormat, showSeconds);
  return `${date} ${time}`;
}

/**
 * Format an offset delta in minutes as a compact badge: "+1d", "+3h",
 * "+30m", or "same". Days win when the delta is a clean multiple of 24h —
 * it reads better than "+24h" for an Auckland-vs-LA row.
 */
function formatOffsetDiff(minutes: number): string {
  if (minutes === 0) return "same";
  const sign = minutes > 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  if (abs >= 24 * 60 && abs % (24 * 60) === 0) return `${sign}${abs / (24 * 60)}d`;
  if (abs % 60 === 0) return `${sign}${abs / 60}h`;
  return `${sign}${abs}m`;
}

export type InstantMode = "instant" | "range";

interface TimelineBoardProps {
  locations: Location[];
  projections: ZonedProjection[];
  timeWindow: TimeWindow;
  selectedInstant: number;
  hoverInstant: number | null;
  nowInstant: number;
  isLive: boolean;
  timeFormat: TimeFormat;
  showSeconds: boolean;
  primaryTimezone?: string;
  /** Local solar noon in the primary zone — drives the sun terminator
   *  column. Pass 0 to hide the column (e.g. when the zone has no coords). */
  noonMs?: number;
  mode: InstantMode;
  range: { start: number; end: number } | null;
  onCommitInstant: (ms: number) => void;
  onCommitRange: (start: number, end: number) => void;
  onHoverInstant: (ms: number | null) => void;
  onCopyRow: (text: string) => void;
}

type DragKind = "cursor" | "start" | "end" | "body";

export function TimelineBoard({
  locations,
  projections,
  timeWindow,
  selectedInstant,
  hoverInstant,
  nowInstant,
  isLive,
  timeFormat,
  showSeconds,
  noonMs,
  mode,
  range,
  onCommitInstant,
  onCommitRange,
  onHoverInstant,
  onCopyRow,
}: TimelineBoardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [minWidth, setMinWidth] = useState(640);
  const [dragging, setDragging] = useState<DragKind | null>(null);
  /** Location id whose copy icon is currently in the "copied" animation
   *  state. Cleared by a per-row timeout so successive copies on the same
   *  row restart the animation. */
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimer = useRef<number | null>(null);
  const dragOrigin = useRef<{ ms: number; start: number; end: number } | null>(null);
  const reduced = useRef(false);

  useEffect(() => {
    return () => {
      if (copyTimer.current != null) window.clearTimeout(copyTimer.current);
    };
  }, []);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setMinWidth(Math.max(320, el.clientWidth - LABEL_W)));
    ro.observe(el);
    setMinWidth(Math.max(320, el.clientWidth - LABEL_W));
    return () => ro.disconnect();
  }, []);

  const trackW = trackWidthPx(timeWindow, minWidth);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth + 1) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const xAt = useCallback((ms: number) => instantToX(ms, timeWindow, trackW), [timeWindow, trackW]);

  const clientToInstant = useCallback(
    (clientX: number, strip: HTMLElement) => {
      // The strip is a per-row element. Use the strip that actually
      // received the pointer event so the rect matches the visible track —
      // sharing a ref across rows misaligned the click-to-instant mapping
      // once the header was removed.
      const rect = strip.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      return snapInstant(xToInstant(x, timeWindow, rect.width));
    },
    [timeWindow],
  );

  const rangeStart = range ? Math.min(range.start, range.end) : null;
  const rangeEnd = range ? Math.max(range.start, range.end) : null;

  const startDrag = (kind: DragKind, clientX: number, pointerId: number, strip: HTMLElement) => {
    strip.setPointerCapture(pointerId);
    const ms = clientToInstant(clientX, strip);
    if (kind === "cursor") {
      if (mode === "range") {
        const end = ms + 2 * 3600 * 1000;
        dragOrigin.current = { ms, start: ms, end };
        onCommitRange(ms, end);
        setDragging("end");
        return;
      }
      onCommitInstant(ms);
    } else if (range) {
      dragOrigin.current = { ms, start: range.start, end: range.end };
      if (kind === "start") onCommitRange(ms, range.end);
      if (kind === "end") onCommitRange(range.start, ms);
    }
    setDragging(kind);
  };

  const resolveKind = (clientX: number, strip: HTMLElement): DragKind => {
    if (mode !== "range" || !range) return "cursor";
    const ms = clientToInstant(clientX, strip);
    const x = xAt(ms);
    const xs = xAt(range.start);
    const xe = xAt(range.end);
    if (Math.abs(x - xs) <= 12) return "start";
    if (Math.abs(x - xe) <= 12) return "end";
    if (x > Math.min(xs, xe) && x < Math.max(xs, xe)) return "body";
    return "cursor";
  };

  const onStripDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    startDrag(resolveKind(e.clientX, e.currentTarget), e.clientX, e.pointerId, e.currentTarget);
  };

  const onStripMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ms = clientToInstant(e.clientX, e.currentTarget);
    if (!dragging) {
      if (window.matchMedia("(hover: hover)").matches) onHoverInstant(ms);
      return;
    }
    if (dragging === "cursor") onCommitInstant(ms);
    else if (range && dragging === "start") onCommitRange(ms, range.end);
    else if (range && dragging === "end") onCommitRange(range.start, ms);
    else if (range && dragging === "body" && dragOrigin.current) {
      const delta = ms - dragOrigin.current.ms;
      onCommitRange(dragOrigin.current.start + delta, dragOrigin.current.end + delta);
    }
  };

  const stopDrag = () => {
    setDragging(null);
    dragOrigin.current = null;
  };

  const rangeLayer =
    mode === "range" && rangeStart != null && rangeEnd != null ? (
      <>
        <div
          className="pointer-events-none absolute inset-y-0 z-[8] bg-primary/20"
          style={{
            left: Math.min(xAt(rangeStart), xAt(rangeEnd)),
            width: Math.abs(xAt(rangeEnd) - xAt(rangeStart)),
          }}
        />
        <div className="pointer-events-none absolute inset-y-0 z-[11] w-0.5 bg-primary" style={{ left: xAt(rangeStart) }} />
        <div className="pointer-events-none absolute inset-y-0 z-[11] w-0.5 bg-primary" style={{ left: xAt(rangeEnd) }} />
      </>
    ) : null;

  const noonX = noonMs ? xAt(noonMs) : null;
  const showTerminator = noonX != null && noonX >= 0 && noonX <= trackW;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)]">
      <div ref={scrollRef} className="overflow-x-auto overscroll-x-contain">
        <div style={{ width: LABEL_W + trackW, minWidth: "100%" }} className="relative">
          {locations.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="font-display text-lg text-[var(--workspace-text)]">Compare time anywhere</p>
              <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">
                Add a location to start comparing time across the world.
              </p>
            </div>
          )}
          {/* Sun terminator — a single column at the primary zone's local
              solar noon. Sits above every row, so the page reads the sun's
              position at a glance. SunIcon chips anchor the column at the
              top and bottom of the board. */}
          {showTerminator && (
            <div
              className="pointer-events-none absolute inset-y-0 z-[4] w-px bg-[var(--sun)]/60"
              style={{
                left: LABEL_W + (noonX as number),
                boxShadow: "0 0 12px rgba(255, 184, 77, 0.5)",
              }}
            >
              <div
                className="absolute -left-2.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--sun)]/40 bg-[var(--ink-2)] text-[var(--sun)]"
                aria-hidden="true"
              >
                <SunIcon className="h-3 w-3" />
              </div>
              <div
                className="absolute -bottom-1.5 -left-2.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--sun)]/40 bg-[var(--ink-2)] text-[var(--sun)]"
                aria-hidden="true"
              >
                <SunIcon className="h-3 w-3" />
              </div>
            </div>
          )}

          {locations.map((loc, i) => {
            const proj = projections[i] ?? projectInstant(selectedInstant, loc.iana);
            const hoverProj = hoverInstant != null ? projectInstant(hoverInstant, loc.iana) : null;
            const shown = hoverProj ?? proj;
            const midnights = localMidnights(timeWindow.start, timeWindow.end, loc.iana);
            const marks = hourMarkers(timeWindow.start, timeWindow.end, loc.iana);
            const gradient = stripGradient(timeWindow, loc.iana);
            // Time-zone delta vs the primary row, in minutes. Two rows on the
            // same offset report "+0" so the badge stays stable on hover.
            const diffMin = !loc.isPrimary ? proj.offsetMinutes - projections[0]!.offsetMinutes : 0;
            const diffLabel = formatOffsetDiff(diffMin);
            const handleCopy = () => {
              onCopyRow(buildRowCopyText(shown, timeFormat, showSeconds));
              setCopiedId(loc.id);
              if (copyTimer.current != null) window.clearTimeout(copyTimer.current);
              copyTimer.current = window.setTimeout(() => {
                setCopiedId(null);
                copyTimer.current = null;
              }, 1400);
            };
            const justCopied = copiedId === loc.id;
            return (
              <div key={loc.id} className="group/row flex border-b border-[var(--workspace-border)] last:border-b-0">
                <div
                  className="sticky left-0 z-20 flex shrink-0 items-center gap-2 border-r border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3 py-2.5"
                  style={{ width: LABEL_W }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-[var(--workspace-text)]">{loc.city}</span>
                      {loc.isPrimary && (
                        <span className="rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wider text-primary">
                          You
                        </span>
                      )}
                      {!loc.isPrimary && diffLabel && (
                        <span
                          className={`shrink-0 rounded px-1 py-px font-mono text-[10px] tabular-nums ${
                            diffMin === 0
                              ? "text-[var(--workspace-text-muted)]"
                              : "bg-primary/10 text-primary"
                          }`}
                          title={`${Math.abs(diffMin / 60).toFixed(1)}h ${diffMin > 0 ? "ahead of" : "behind"} primary`}
                        >
                          {diffLabel}
                        </span>
                      )}
                      <Tooltip
                        content={justCopied ? "Copied" : `Copy ${loc.city} time`}
                        side="bottom"
                      >
                        <button
                          type="button"
                          onClick={handleCopy}
                          aria-label={`Copy ${loc.city} time`}
                          className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded text-[var(--workspace-text-muted)] opacity-0 transition-opacity hover:bg-[var(--workspace-background)] hover:text-[var(--workspace-text)] group-hover/row:opacity-100"
                        >
                          {/* Icon swap driven by `justCopied`. The key change
                              forces a remount so the scale-in animation
                              plays on each fresh copy, not just the first. */}
                          <ClipboardDocumentIcon
                            className={`h-3.5 w-3.5 transition-all duration-200 ${
                              justCopied
                                ? "scale-0 opacity-0"
                                : "scale-100 opacity-100"
                            }`}
                          />
                          <CheckIcon
                            className={`-ml-3.5 h-3.5 w-3.5 text-primary transition-all duration-200 ${
                              justCopied
                                ? "scale-100 opacity-100"
                                : "scale-0 opacity-0"
                            }`}
                          />
                        </button>
                      </Tooltip>
                    </div>
                    <div className="mt-0.5 font-mono text-[15px] font-semibold tabular-nums tracking-tight text-[var(--workspace-text)]">
                      {formatLocalTime(shown, timeFormat, showSeconds)}
                    </div>
                    <div className="truncate text-[11px] text-[var(--workspace-text-muted)]">
                      UTC{shown.offsetLabel} · {shown.abbreviation}
                    </div>
                  </div>
                </div>
                <div
                  className="relative min-h-[4.75rem] shrink-0 cursor-crosshair"
                  style={{ width: trackW, background: gradient }}
                  onPointerDown={onStripDown}
                  onPointerMove={onStripMove}
                  onPointerUp={stopDrag}
                  onPointerCancel={stopDrag}
                  onPointerLeave={() => {
                    if (!dragging) onHoverInstant(null);
                  }}
                >
                  {marks.map((m) => (
                    <div key={m.instant} className="pointer-events-none absolute inset-y-0" style={{ left: xAt(m.instant) }}>
                      <div className={`h-full w-px ${m.isMidnight ? "bg-[var(--workspace-text)]/30" : "bg-[var(--workspace-text)]/12"}`} />
                      <span className="absolute bottom-1 left-1 rounded-sm bg-black/35 px-1 py-px font-mono text-[10px] font-semibold tabular-nums leading-none text-white">
                        {hourLabel(m.hour, timeFormat)}
                      </span>
                    </div>
                  ))}
                  {midnights.map((ms) => (
                    <span
                      key={`d-${ms}`}
                      className="pointer-events-none absolute top-1 z-[5] text-[9px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]"
                      style={{ left: xAt(ms) + 6 }}
                    >
                      {formatLocalDate(projectInstant(ms, loc.iana)).replace(/,/g, "")}
                    </span>
                  ))}
                  {rangeLayer}
                  {xAt(nowInstant) >= 0 && xAt(nowInstant) <= trackW && (
                    <div className="pointer-events-none absolute inset-y-0 z-[6] w-px bg-[var(--workspace-text-muted)]/40" style={{ left: xAt(nowInstant) }} />
                  )}
                  {hoverInstant != null && !dragging && (
                    <div className="pointer-events-none absolute inset-y-0 z-[7] w-px bg-primary/35" style={{ left: xAt(hoverInstant) }} />
                  )}
                  {mode === "instant" && (
                    <div
                      className="pointer-events-none absolute inset-y-0 z-10"
                      style={{
                        left: xAt(selectedInstant),
                        transition: reduced.current || dragging ? "none" : "left 80ms linear",
                      }}
                    >
                      <div className={`h-full w-px ${dragging || isLive ? "bg-primary" : "bg-primary/80"}`} />
                      <div className="absolute top-1/2 left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_12px_var(--glow-color)]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-[var(--workspace-border)] px-4 py-2 text-[11px] text-[var(--workspace-text-muted)]">
        <span>Scroll the strip · drag to set {mode === "range" ? "the range" : "the instant"}</span>
      </div>
    </div>
  );
}
