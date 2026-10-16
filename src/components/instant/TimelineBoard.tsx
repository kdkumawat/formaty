"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, ClipboardDocumentIcon, HomeIcon, PlusIcon, XMarkIcon } from "@heroicons/react/16/solid";
import { Button, IconButton, Kbd, Tooltip } from "@/components/kit";
import { formatLocalDate, formatLocalTime, projectInstant } from "@/lib/instant/engine";
import {
  hourLabelStep,
  hourMarkers,
  instantToX,
  snapInstant,
  xToInstant,
  type HourMarker,
  type TimeWindow,
} from "@/lib/instant/timeline";
import type { Location, TimeFormat, ZonedProjection } from "@/lib/instant/types";

const LABEL_W = 216;
const LABEL_W_NARROW = 136;
/** Board width below which the label column tightens to leave room for the track. */
const NARROW_BOARD_PX = 576;
const HOUR_MS = 3600000;
/** Local working hours drawn as the amber bar under each strip, so overlaps line up across rows. */
const WORK_START = 9;
const WORK_END = 18;

/** How dark an hour is: 1 at night, easing through dawn and dusk, 0 in daylight. */
function nightWeight(hour: number): number {
  if (hour < 5 || hour >= 22) return 1;
  if (hour < 7) return (7 - hour) / 3;
  if (hour >= 19) return (hour - 18) / 4;
  return 0;
}

/** Hard-stop gradient per local hour: night is a soft ink wash, day is the bare panel. Theme-aware through color-mix. */
function nightGradient(marks: HourMarker[], window: TimeWindow): string {
  const span = window.end - window.start;
  const p = (ms: number) => Math.min(100, Math.max(0, ((ms - window.start) / span) * 100)).toFixed(3);
  const tint = (h: number) => `color-mix(in srgb, var(--workspace-text) ${(nightWeight(h) * 6.5).toFixed(2)}%, transparent)`;
  if (!marks.length) return "transparent";
  const first = marks[0];
  const stops = [`${tint((first.hour + 23) % 24)} 0%`, `${tint((first.hour + 23) % 24)} ${p(first.instant)}%`];
  marks.forEach((m, i) => {
    const end = marks[i + 1]?.instant ?? window.end;
    stops.push(`${tint(m.hour)} ${p(m.instant)}%`, `${tint(m.hour)} ${p(end)}%`);
  });
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

/** Working-hour spans inside the window, including one already running when the window opens. */
function workSpans(marks: HourMarker[], window: TimeWindow, timeZone: string): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  const startHour = projectInstant(window.start, timeZone).hour;
  if (startHour >= WORK_START && startHour < WORK_END) {
    const close = marks.find((m) => m.hour === WORK_END);
    spans.push([window.start, close?.instant ?? window.end]);
  }
  for (const m of marks) {
    if (m.hour !== WORK_START) continue;
    const close = marks.find((x) => x.instant > m.instant && x.hour === WORK_END);
    spans.push([m.instant, close?.instant ?? Math.min(window.end, m.instant + (WORK_END - WORK_START) * HOUR_MS)]);
  }
  return spans;
}

function hourLabel(hour: number, timeFormat: TimeFormat): string {
  if (timeFormat === "24h") return hour.toString().padStart(2, "0");
  const h = hour % 12 || 12;
  return `${h}${hour < 12 ? "a" : "p"}`;
}

/** "Fri 16". Built from parts: en-US formats weekday plus day alone as "16 Fri". */
const weekdayDay = (ms: number, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", day: "numeric" }).formatToParts(new Date(ms));
  return `${parts.find((p) => p.type === "weekday")?.value} ${parts.find((p) => p.type === "day")?.value}`;
};

/** Copy text for one row: always the full date and time, so the clipboard entry stands on its own. */
function buildRowCopyText(proj: ZonedProjection, timeFormat: TimeFormat, showSeconds: boolean): string {
  return `${formatLocalDate(proj).replace(/,/g, "")} ${formatLocalTime(proj, timeFormat, showSeconds)} ${proj.abbreviation}`;
}

/** Offset against the home row: "+3h", "−5h 30m", "same time". */
function formatOffsetDiff(minutes: number): string {
  if (minutes === 0) return "same time";
  const sign = minutes > 0 ? "+" : "−";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h ? `${h}h` : ""}${h && m ? " " : ""}${m ? `${m}m` : ""}`;
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
  mode: InstantMode;
  range: { start: number; end: number } | null;
  onCommitInstant: (ms: number) => void;
  onCommitRange: (start: number, end: number) => void;
  onHoverInstant: (ms: number | null) => void;
  onCopyRow: (text: string) => void;
  onSetPrimary: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
  onAdd: () => void;
  addOpen: boolean;
}

type DragKind = "cursor" | "start" | "end" | "body";

export const TimelineBoard = forwardRef<HTMLButtonElement, TimelineBoardProps>(function TimelineBoard(
  {
    locations,
    projections,
    timeWindow,
    selectedInstant,
    hoverInstant,
    nowInstant,
    isLive,
    timeFormat,
    showSeconds,
    mode,
    range,
    onCommitInstant,
    onCommitRange,
    onHoverInstant,
    onCopyRow,
    onSetPrimary,
    onRemove,
    onReorder,
    onAdd,
    addOpen,
  },
  addRef,
) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardW, setBoardW] = useState(848);
  const [dragging, setDragging] = useState<DragKind | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [rowDrag, setRowDrag] = useState<{ from: string; over: string } | null>(null);
  const copyTimer = useRef<number | null>(null);
  const dragOrigin = useRef<{ ms: number; start: number; end: number } | null>(null);
  const reduced = useRef(false);

  useEffect(() => () => {
    if (copyTimer.current != null) window.clearTimeout(copyTimer.current);
  }, []);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoardW(el.clientWidth));
    ro.observe(el);
    setBoardW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // The whole window always fits: the track flexes to the space beside the label column and
  // everything on it is placed in percent. The measured width only decides label density.
  const narrow = boardW < NARROW_BOARD_PX;
  const labelW = narrow ? LABEL_W_NARROW : LABEL_W;
  const pxPerHour = Math.max(1, boardW - labelW) / ((timeWindow.end - timeWindow.start) / HOUR_MS);
  const labelStep = hourLabelStep(pxPerHour, 26);

  const xAt = useCallback((ms: number) => instantToX(ms, timeWindow, 100), [timeWindow]);
  const pct = (ms: number) => `${xAt(ms)}%`;

  const clientToInstant = useCallback(
    (clientX: number, strip: HTMLElement) => {
      // Map against the strip that received the event so the rect matches the visible track.
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
        const end = ms + 2 * HOUR_MS;
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
    const w = strip.getBoundingClientRect().width;
    const x = instantToX(ms, timeWindow, w);
    const xs = instantToX(range.start, timeWindow, w);
    const xe = instantToX(range.end, timeWindow, w);
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

  // Arrow keys on a focused strip move the moment: an hour, Shift for a day, Alt for 15 minutes.
  const onStripKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    e.stopPropagation();
    const step = (e.shiftKey ? 24 * HOUR_MS : e.altKey ? HOUR_MS / 4 : HOUR_MS) * (e.key === "ArrowLeft" ? -1 : 1);
    if (mode === "range" && range) onCommitRange(range.start + step, range.end + step);
    else onCommitInstant(selectedInstant + step);
  };

  const homeProj = projections[0];
  const selX = xAt(selectedInstant);
  const nowX = xAt(nowInstant);

  const rangeLayer =
    mode === "range" && rangeStart != null && rangeEnd != null ? (
      <>
        <div
          className="pointer-events-none absolute inset-y-0 z-[8] bg-[color-mix(in_srgb,var(--focus)_14%,transparent)]"
          style={{ left: pct(rangeStart), width: `${xAt(rangeEnd) - xAt(rangeStart)}%` }}
        />
        <div className="pointer-events-none absolute inset-y-0 z-[11] w-0.5 bg-[var(--focus)]" style={{ left: pct(rangeStart) }} />
        <div className="pointer-events-none absolute inset-y-0 z-[11] w-0.5 bg-[var(--focus)]" style={{ left: pct(rangeEnd) }} />
      </>
    ) : null;

  return (
    <div className="overflow-hidden rounded-[10px] border border-[var(--workspace-border)] bg-[var(--workspace-panel)]">
      <div ref={boardRef}>
        {locations.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-[15px] font-medium text-[var(--workspace-text)]">Compare time anywhere</p>
            <p className="mt-1 text-[13px] text-[var(--workspace-text-muted)]">Add a location to start comparing time across the world.</p>
          </div>
        )}

        {locations.map((loc, i) => {
          const proj = projections[i] ?? projectInstant(selectedInstant, loc.iana);
          const hoverProj = hoverInstant != null ? projectInstant(hoverInstant, loc.iana) : null;
          const shown = hoverProj ?? proj;
          const homeShown = hoverInstant != null && homeProj ? projectInstant(hoverInstant, homeProj.timeZone) : homeProj;
          const allMarks = hourMarkers(timeWindow.start, timeWindow.end, loc.iana);
          const labelled = allMarks.filter((m) => m.hour % labelStep === 0);
          const midnights = allMarks.filter((m) => m.isMidnight);
          const diffMin = loc.isPrimary || !homeProj ? 0 : proj.offsetMinutes - homeProj.offsetMinutes;
          const otherDay = !loc.isPrimary && homeShown && (shown.day !== homeShown.day || shown.month !== homeShown.month);
          const code = loc.countryCode && loc.countryCode !== "UN" && loc.city !== loc.countryCode ? loc.countryCode : "";
          const handleCopy = () => {
            onCopyRow(buildRowCopyText(shown, timeFormat, showSeconds));
            setCopiedId(loc.id);
            if (copyTimer.current != null) window.clearTimeout(copyTimer.current);
            copyTimer.current = window.setTimeout(() => {
              setCopiedId(null);
              copyTimer.current = null;
            }, 1400);
          };
          const isOver = rowDrag && rowDrag.over === loc.id && rowDrag.from !== loc.id;
          return (
            <div
              key={loc.id}
              className={`group/row relative flex border-b border-[var(--workspace-border)] last:border-b-0 ${rowDrag?.from === loc.id ? "opacity-50" : ""}`}
              onDragOver={(e) => {
                if (!rowDrag) return;
                e.preventDefault();
                if (rowDrag.over !== loc.id) setRowDrag({ ...rowDrag, over: loc.id });
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (rowDrag && rowDrag.from !== loc.id) onReorder(rowDrag.from, loc.id);
                setRowDrag(null);
              }}
            >
              {isOver && <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 bg-[var(--focus)]" />}
              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", loc.id);
                  setRowDrag({ from: loc.id, over: loc.id });
                }}
                onDragEnd={() => setRowDrag(null)}
                className="relative flex shrink-0 cursor-grab items-center border-r border-[var(--workspace-border)] px-3 py-2 active:cursor-grabbing"
                style={{ width: labelW }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
                    {loc.isPrimary && (
                      <Tooltip content="Home: other rows show their offset from here">
                        <HomeIcon aria-label="Home" className="size-3.5 shrink-0 text-[var(--key-text)]" />
                      </Tooltip>
                    )}
                    <span className="truncate font-medium text-[var(--workspace-text)]">{loc.city}</span>
                    {code && !narrow && <span className="shrink-0 font-mono text-[11px] text-[var(--workspace-text-muted)]">{code}</span>}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-[16px] font-semibold tabular-nums tracking-tight text-[var(--workspace-text)]">
                      {formatLocalTime(shown, timeFormat, showSeconds)}
                    </span>
                    {otherDay && <span className="shrink-0 text-[11.5px] font-medium text-[var(--key-text)]">{weekdayDay(shown.epochMs, loc.iana)}</span>}
                  </div>
                  <div className="truncate text-[11.5px] tabular-nums text-[var(--workspace-text-muted)]">
                    {loc.isPrimary ? `UTC${shown.offsetLabel}` : formatOffsetDiff(diffMin)} · {shown.abbreviation}
                  </div>
                </div>
                {/* Row actions: revealed on hover or keyboard focus, always visible on touch. */}
                <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-md bg-[var(--workspace-panel)] opacity-0 transition-opacity focus-within:opacity-100 group-hover/row:opacity-100 max-[900px]:opacity-100">
                  <IconButton label={copiedId === loc.id ? "Copied" : `Copy ${loc.city} time`} onClick={handleCopy} className="!size-6">
                    {copiedId === loc.id ? <CheckIcon /> : <ClipboardDocumentIcon />}
                  </IconButton>
                  {!loc.isPrimary && (
                    <>
                      <IconButton label={`Make ${loc.city} home`} onClick={() => onSetPrimary(loc.id)} className="!size-6">
                        <HomeIcon />
                      </IconButton>
                      <IconButton label={`Remove ${loc.city}`} onClick={() => onRemove(loc.id)} className="!size-6">
                        <XMarkIcon />
                      </IconButton>
                    </>
                  )}
                </div>
              </div>
              <div
                role="slider"
                tabIndex={0}
                aria-label={`Time in ${loc.city}`}
                aria-valuemin={timeWindow.start}
                aria-valuemax={timeWindow.end}
                aria-valuenow={selectedInstant}
                aria-valuetext={`${formatLocalTime(proj, timeFormat, showSeconds)}, ${formatLocalDate(proj)}`}
                className="relative min-h-[3.75rem] min-w-0 flex-1 cursor-crosshair touch-pan-y overflow-hidden outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--focus)]"
                style={{ background: nightGradient(allMarks, timeWindow) }}
                onPointerDown={onStripDown}
                onPointerMove={onStripMove}
                onPointerUp={stopDrag}
                onPointerCancel={stopDrag}
                onPointerLeave={() => {
                  if (!dragging) onHoverInstant(null);
                }}
                onKeyDown={onStripKey}
              >
                {workSpans(allMarks, timeWindow, loc.iana).map(([a, b]) => (
                  <div
                    key={`w-${a}`}
                    aria-hidden
                    className="pointer-events-none absolute bottom-0 h-[3px] rounded-full bg-[color-mix(in_srgb,var(--focus)_55%,transparent)]"
                    style={{ left: pct(a), width: `${xAt(b) - xAt(a)}%` }}
                  />
                ))}
                {labelled.map((m) =>
                  m.isMidnight ? null : (
                    <div key={m.instant} className="pointer-events-none absolute inset-y-0" style={{ left: pct(m.instant) }}>
                      <div className="h-full w-px bg-[color-mix(in_srgb,var(--workspace-text)_7%,transparent)]" />
                      <span className="absolute bottom-1.5 left-1 font-mono text-[11px] tabular-nums leading-none text-[var(--workspace-text-muted)]">
                        {hourLabel(m.hour, timeFormat)}
                      </span>
                    </div>
                  ),
                )}
                {midnights.map((m) => (
                  <div key={`d-${m.instant}`} className="pointer-events-none absolute inset-y-0 z-[5]" style={{ left: pct(m.instant) }}>
                    <div className="h-full w-px bg-[color-mix(in_srgb,var(--workspace-text)_28%,transparent)]" />
                    <span className="absolute left-1 top-1 whitespace-nowrap text-[11px] font-semibold text-[var(--workspace-text)]">
                      {pxPerHour * 24 >= 40 ? weekdayDay(m.instant, loc.iana) : ""}
                    </span>
                  </div>
                ))}
                {rangeLayer}
                {nowX >= 0 && nowX <= 100 && !isLive && (
                  <div className="pointer-events-none absolute inset-y-0 z-[6] w-px border-l border-dashed border-[var(--workspace-text-muted)]/60" style={{ left: `${nowX}%` }} />
                )}
                {hoverInstant != null && !dragging && (
                  <div className="pointer-events-none absolute inset-y-0 z-[7] w-px bg-[color-mix(in_srgb,var(--focus)_45%,transparent)]" style={{ left: pct(hoverInstant) }} />
                )}
                {mode === "instant" && (
                  <div
                    className="pointer-events-none absolute inset-y-0 z-10"
                    style={{ left: `${selX}%`, transition: reduced.current || dragging ? "none" : "left 80ms linear" }}
                  >
                    <div className="h-full w-0.5 -translate-x-1/2 bg-[var(--focus)]" />
                    <span
                      className={`absolute top-1 whitespace-nowrap rounded-[4px] bg-[var(--focus)] px-1 py-px font-mono text-[11px] font-semibold leading-[1.35] text-[var(--workspace-panel)] ${
                        selX > 82 ? "right-1.5" : "left-1.5"
                      }`}
                    >
                      {formatLocalTime(proj, timeFormat, false)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--workspace-border)] px-2 py-1 text-[12px] text-[var(--workspace-text-muted)]">
        <Tooltip content="Add a location" shortcut="A">
          <Button ref={addRef} variant="ghost" icon={<PlusIcon />} onClick={onAdd} aria-expanded={addOpen}>
            Add location
          </Button>
        </Tooltip>
        <span className="ml-auto inline-flex flex-wrap items-center gap-x-3 gap-y-1 max-[600px]:hidden">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-[3px] w-4 rounded-full bg-[color-mix(in_srgb,var(--focus)_55%,transparent)]" />
            Working hours, {WORK_START}:00 to {WORK_END}:00
          </span>
          <span className="inline-flex items-center gap-1">
            Drag the strip, or <Kbd keys="←" /> <Kbd keys="→" /> an hour, <Kbd keys="⇧" /> a day
          </span>
        </span>
      </div>
    </div>
  );
});
