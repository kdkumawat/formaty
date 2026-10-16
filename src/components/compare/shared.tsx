"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { CheckIcon, ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import {
  Button,
  Chip,
  EmptyState,
  InputActions,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  PaneHeader,
  ResultActions,
  RowCopy,
  Select,
  TextField,
  Tooltip,
  TruncatedText,
  type CopyFormat,
  type InputActionsProps,
} from "@/components/kit";
import { cn } from "@/lib/utils";
import {
  LIST_EXPORT_FORMATS,
  detectListDelimiter,
  formatListItems,
  listExportExample,
  listExportExtension,
  listExportFormatLabel,
  type ListDelimiter,
  type ListExportFormat,
  type ListItem,
  type ListSortMode,
} from "@/lib/json/listCompare";

/** Rows rendered at a time. Copy and Download always use every item. */
const PAGE = 300;

/** The "Copy as" menu: only shapes that look different from each other. Everything else sits under "More". */
const FORMAT_SECTIONS: Array<[string, ListExportFormat[]]> = [
  ["Plain", ["newline", "comma-space", "tsv"]],
  ["SQL", ["sql-in-single", "sql-values"]],
  ["Code", ["json-array", "csv-quoted", "markdown-table"]],
];
/** "More", related formats side by side: SQL, separators, code. */
const MORE_FORMATS: ListExportFormat[] = [
  "sql-not-in",
  "sql-in-unquoted",
  "sql-in-double",
  "sql-array",
  "comma",
  "comma-double-quotes",
  "pipe",
  "js-array-single",
  "go-slice",
  "json-array-numbers",
  "yaml-list",
  "html-table",
];
/** Not listed: on ordinary values they copy the same text as One per line, JSON array or Pipe separated. */
const SAME_AS_LISTED: ListExportFormat[] = ["raw", "js-array-double", "python-list", "regex-alt"];
const LISTED = FORMAT_SECTIONS.flatMap(([, f]) => f);
const toFormat = (id: ListExportFormat, group?: string): CopyFormat => ({
  id,
  label: listExportFormatLabel(id),
  hint: listExportExample(id),
  group,
  overflow: !group,
});
/** Copy-as formats for every list result. Formats in SAME_AS_LISTED are left out. */
export const LIST_COPY_FORMATS: CopyFormat[] = [
  ...FORMAT_SECTIONS.flatMap(([group, ids]) => ids.map((id) => toFormat(id, group))),
  ...MORE_FORMATS.map((id) => toFormat(id)),
  ...LIST_EXPORT_FORMATS.filter((f) => !SAME_AS_LISTED.includes(f) && !LISTED.includes(f) && !MORE_FORMATS.includes(f)).map((id) => toFormat(id)),
];

const SORT_OPTIONS: Array<{ value: ListSortMode; label: string }> = [
  { value: "none", label: "Original order" },
  { value: "asc", label: "A to Z" },
  { value: "desc", label: "Z to A" },
  { value: "numeric-asc", label: "Numbers up" },
  { value: "numeric-desc", label: "Numbers down" },
  { value: "frequency", label: "Most repeated" },
];

/** Persisted "Copy as" format. Older saved "none" and "raw" fall back to one per line. */
export function useExportFormat(storageKey: string) {
  const [format, setFormat] = useState<ListExportFormat>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === "none" || raw === "raw") return "newline";
      if (raw && (LIST_EXPORT_FORMATS as string[]).includes(raw)) return raw as ListExportFormat;
    } catch {
      /* ignore */
    }
    return "comma-space";
  });
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, format);
    } catch {
      /* ignore */
    }
  }, [storageKey, format]);
  return [format, setFormat] as const;
}

export const num = (n: number) => n.toLocaleString();

/** Save text as a file through a temporary link. */
export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Flat text surface for input panes (the pane header provides the structure). */
export const editorClass =
  "min-h-[96px] flex-1 resize-none border-0 bg-[var(--workspace-panel)] px-3 py-2 font-mono text-[13px] leading-[1.6] text-[var(--workspace-text)] outline-none placeholder:text-[var(--workspace-text-muted)] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--focus)]";

/** A side's colour dot and name; click to rename. Used by the list pane headers and the document row. */
export function RenameButton({ dot, name, onRename, className }: { dot: string; name: string; onRename?: (el: HTMLElement) => void; className?: string }) {
  return (
    <Tooltip content="Rename">
      <Button variant="ghost" className={cn("min-w-0 shrink px-1.5 text-[13px] font-medium", className)} onClick={(e) => onRename?.(e.currentTarget)}>
        <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${dot}`} />
        <span className="truncate">{name}</span>
      </Button>
    </Tooltip>
  );
}

/** Header row of a list editor: colour dot and name (click to rename), count, then Sample / Tidy / Clear. */
export function ListPaneHeader({
  dot,
  name,
  count,
  onRename,
  ...actions
}: {
  dot: string;
  name: string;
  count: number;
  onRename?: (el: HTMLElement) => void;
} & InputActionsProps) {
  return (
    <PaneHeader
      className="flex-nowrap"
      left={
        <>
          <RenameButton dot={dot} name={name} onRename={onRename} className="-ml-1.5 max-w-[60%]" />
          <span className="shrink-0 whitespace-nowrap text-[12px] tabular-nums text-[var(--workspace-text-muted)]">
            {num(count)} {count === 1 ? "item" : "items"}
          </span>
        </>
      }
      right={<InputActions {...actions} />}
    />
  );
}

const SPLIT_LABELS: Record<ListDelimiter, string> = {
  auto: "Auto",
  newline: "New line",
  comma: "Comma",
  semicolon: "Semicolon",
  pipe: "Pipe",
  whitespace: "Space",
  json: "JSON array",
};

/** Strip under an input: the split rule on the left, tool actions (e.g. Remove repeats) on the right. */
export function InputFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-9 shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-t border-[var(--workspace-border)] px-3 py-1">
      {children}
    </div>
  );
}

/** "Split by" select. In Auto it names what the text resolved to. Pass deferred text so typing stays fast. */
export function SplitBySelect({
  value,
  onChange,
  texts,
}: {
  value: ListDelimiter;
  onChange: (d: ListDelimiter) => void;
  texts: [string, string?];
}) {
  const [a, b] = texts;
  const auto = useMemo(() => {
    if (value !== "auto") return "Auto";
    const found = new Set([a, b].filter((t): t is string => !!t?.trim()).map(detectListDelimiter));
    return found.size === 1 ? `Auto (${SPLIT_LABELS[[...found][0]].toLowerCase()})` : "Auto";
  }, [value, a, b]);
  const options = (Object.keys(SPLIT_LABELS) as ListDelimiter[]).map((v) => ({ value: v, label: v === "auto" ? auto : SPLIT_LABELS[v] }));
  return <Select<ListDelimiter> label="Split by" options={options} value={value} onChange={onChange} />;
}

/** Checkbox-look toggle chip (compare options): a 14px box that fills with ink when on. */
export function CheckChip({ on, onToggle, children }: { on: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <Chip
      on={on}
      onClick={onToggle}
      icon={
        <span
          aria-hidden
          className={cn("flex size-3.5 items-center justify-center rounded-[4px]", on ? "bg-selected-foreground text-selected" : "border-[1.5px] border-edge")}
        >
          {on && <CheckIcon className="size-3" />}
        </span>
      }
    >
      {children}
    </Chip>
  );
}

export interface ResultTab<T extends string = string> {
  value: T;
  label: string;
  /** Omit for a view that is not a set of items (Summary). */
  count?: number;
  /** Colour dot class for a side. */
  dot?: string;
}

/**
 * Bucket picker of a result pane: the main buckets as ink segments with their counts, the rest under a
 * "More" menu (which wears the selection when one of its items is active).
 */
export function ResultTabs<T extends string>({ tabs, more = [], value, onChange, label = "Which items" }: { tabs: ResultTab<T>[]; more?: ResultTab<T>[]; value: T; onChange: (v: T) => void; label?: string }) {
  const inMore = more.find((t) => t.value === value);
  const body = (t: ResultTab<T>) => (
    <>
      {t.dot && <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${t.dot}`} />}
      {t.label}
      {t.count !== undefined && <span className={cn("font-mono text-[12px] tabular-nums", t.count === 0 ? "opacity-50" : "opacity-70")}>{num(t.count)}</span>}
    </>
  );
  return (
    <div role="group" aria-label={label} className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
      {tabs.map((t) => (
        <Button key={t.value} variant={t.value === value ? "selected" : "ghost"} aria-pressed={t.value === value} onClick={() => onChange(t.value)} className="shrink-0 whitespace-nowrap">
          {body(t)}
        </Button>
      ))}
      {more.length > 0 && (
        <Menu>
          <MenuTrigger asChild>
            <Button variant={inMore ? "selected" : "ghost"} iconRight={<ChevronDownIcon />} className="shrink-0 whitespace-nowrap">
              {inMore ? body(inMore) : "More"}
            </Button>
          </MenuTrigger>
          <MenuContent align="start">
            {more.map((t) => (
              <MenuItem key={t.value} selected={t.value === value} hint={t.count !== undefined ? num(t.count) : undefined} onSelect={() => onChange(t.value)}>
                {t.label}
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>
      )}
    </div>
  );
}

/** One result tab (kept for the landing demo; the workspace uses ResultTabs). */
export function Tile({ count, label, dot, on, onClick }: { count?: number; label: string; dot?: string; on: boolean; onClick: () => void }) {
  return (
    <Button variant={on ? "selected" : "ghost"} aria-pressed={on} onClick={onClick} className="shrink-0 whitespace-nowrap">
      {dot && <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${dot}`} />}
      {label}
      {count !== undefined && <span className={cn("font-mono text-[12px] tabular-nums", count === 0 ? "opacity-50" : "opacity-70")}>{num(count)}</span>}
    </Button>
  );
}

/** A group of Tiles; with a host element it renders there (the landing demo's toolbar). */
export function TileRow({ label, host, children }: { label: string; host?: HTMLElement | null; children: ReactNode }) {
  const track = (
    <div role="group" aria-label={label} className="inline-flex max-w-full items-center gap-1 overflow-x-auto [scrollbar-width:none]">
      {children}
    </div>
  );
  return host ? createPortal(track, host) : <div className="flex shrink-0 px-3 py-2">{track}</div>;
}

/** Class and style for the input pane of a list tool: `split` percent wide on desktop, full width when stacked. */
export const inputPaneClass =
  "flex shrink-0 flex-col border-b border-[var(--workspace-border)] min-[901px]:min-h-0 min-[901px]:w-[var(--split)] min-[901px]:min-w-[260px] min-[901px]:border-b-0";
export const splitStyle = (split: number) => ({ "--split": `${split}%` }) as CSSProperties;

/** Draggable divider between input and result, the same one the Transform panes use. Desktop only. */
export function SplitHandle({ onResizeStart, onNudge, value }: { onResizeStart?: () => void; onNudge?: (delta: number) => void; value?: number }) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize input and result"
      aria-valuenow={value}
      aria-valuemin={25}
      aria-valuemax={60}
      tabIndex={onNudge ? 0 : undefined}
      className="group relative hidden shrink-0 cursor-col-resize items-stretch justify-center outline-none min-[901px]:flex"
      style={{ width: 9, marginLeft: -4, marginRight: -4, zIndex: 10 }}
      onMouseDown={onResizeStart}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          onNudge?.((e.key === "ArrowLeft" ? -1 : 1) * (e.shiftKey ? 10 : 2));
        }
      }}
    >
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--workspace-border)] transition-colors group-hover:bg-brand group-focus-visible:w-0.5 group-focus-visible:bg-[var(--focus)] group-active:bg-brand" />
    </div>
  );
}

/** One header (find, sort, Copies-as preview, Download, Copy) over the numbered item list. Items must already be in display order. */
export function ResultView({
  items,
  format,
  onFormat,
  sort,
  onSort,
  fileBase,
  showCounts = false,
  empty,
  emptyTitle = "Nothing here yet",
  tabs,
  info,
  sides,
}: {
  items: ListItem[];
  format: ListExportFormat;
  onFormat: (f: ListExportFormat) => void;
  sort: ListSortMode;
  onSort: (s: ListSortMode) => void;
  /** File name without extension; the extension follows the Copy as format. */
  fileBase: string;
  /** Reserve a right-aligned column for the x2, x3 counts. */
  showCounts?: boolean;
  empty: ReactNode;
  emptyTitle?: string;
  /** Bucket picker for the header's left side. */
  tabs?: ReactNode;
  /** Sentence for the info row, e.g. "5 of 10 unique values · from A and B"; `{n}` shows the current row count. */
  info?: string;
  /** Keys present in A and in B: each row gets a dot per side in the gutter. */
  sides?: { a: Set<string>; b: Set<string> };
}) {
  const [find, setFind] = useState("");
  const [shown, setShown] = useState(PAGE);

  useEffect(() => setShown(PAGE), [items, find]);

  const rows = useMemo(() => {
    const q = find.trim().toLowerCase();
    return q ? items.filter((i) => i.value.toLowerCase().includes(q)) : items;
  }, [items, find]);
  // "Most repeated" only means something when counts differ.
  const sortOptions = useMemo(() => {
    const counted = items.some((i) => i.count > 1);
    return SORT_OPTIONS.filter((o) => o.value !== "frequency" || counted || sort === "frequency");
  }, [items, sort]);

  const fullText = (f: ListExportFormat = format) => formatListItems(rows, f);

  const n = rows.length;
  const filtered = !!find.trim();
  // Short values pack into columns sized to the longest one (in mono ch, plus number, dots, count and the Copy tag); long ones keep one column.
  const longest = useMemo(() => items.slice(0, 2000).reduce((m, i) => Math.max(m, i.value.length), 0), [items]);
  const colMin = `calc(${Math.max(longest, 6)}ch + ${6.5 + (sides ? 1 : 0) + (showCounts ? 3 : 0)}rem)`;
  const columns = longest <= 48 ? `repeat(auto-fill, minmax(min(100%, ${colMin}), 1fr))` : "minmax(0, 1fr)";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PaneHeader
        className="flex-nowrap max-[900px]:flex-wrap"
        left={<div className="min-w-0 flex-1">{tabs}</div>}
        right={
          <div className="flex shrink-0 flex-nowrap items-center gap-1">
            <ResultActions
              onDownload={() => downloadText(`${fileBase}.${listExportExtension(format)}`, fullText())}
              canDownload={n > 0}
              copy={{
                getText: (f) => fullText((f as ListExportFormat | undefined) ?? format),
                formats: LIST_COPY_FORMATS,
                format,
                onFormatChange: (id) => onFormat(id as ListExportFormat),
                disabled: n === 0,
              }}
            />
          </div>
        }
      />
      <div className="flex min-h-7 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--workspace-border)] px-3 py-0.5 text-[12px] text-[var(--workspace-text-muted)]">
        <span className="min-w-0 flex-1 tabular-nums">{filtered ? `${num(n)} matching` : info ?? `${num(n)} ${n === 1 ? "value" : "values"}`}</span>
        <TextField
          aria-label="Find in result"
          placeholder="Find in result"
          icon={<MagnifyingGlassIcon />}
          value={find}
          onChange={(e) => setFind(e.target.value)}
          onClear={() => setFind("")}
          wrapperClassName="w-40"
        />
        <Select<ListSortMode> aria-label="Sort" label="Sort" width={160} options={sortOptions} value={sort} onChange={onSort} />
      </div>

      {n === 0 ? (
        <EmptyState title={filtered ? "Nothing matches your search" : emptyTitle} description={filtered ? undefined : empty} />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto px-3 pb-2 pt-1">
          <div className="grid gap-x-6 font-mono" style={{ gridTemplateColumns: columns }}>
            {rows.slice(0, shown).map((it, i) => (
              <RowCopy key={`${it.key}-${i}`} text={it.value} className="px-1">
                <span className="flex items-center gap-2">
                  <span aria-hidden className="w-8 shrink-0 text-right font-mono text-[12px] tabular-nums text-faint">{i + 1}</span>
                  {sides && (
                    <span aria-hidden className="flex shrink-0 gap-0.5">
                      <span className={cn("size-1.5 rounded-full", sides.a.has(it.key) ? "bg-side-a" : "bg-transparent")} />
                      <span className={cn("size-1.5 rounded-full", sides.b.has(it.key) ? "bg-side-b" : "bg-transparent")} />
                    </span>
                  )}
                  <TruncatedText className="min-w-0 flex-1 font-mono leading-[1.6]">{it.value}</TruncatedText>
                  {showCounts && (
                    <span className="w-12 shrink-0 text-right font-sans text-[12px] tabular-nums text-[var(--workspace-text-muted)]">
                      {it.count > 1 ? `×${num(it.count)}` : ""}
                    </span>
                  )}
                </span>
              </RowCopy>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-[12px] text-[var(--workspace-text-muted)]">
            <span>{n > shown ? `Showing ${num(shown)} of ${num(n)}. Copy always includes all ${num(n)}.` : `Showing all ${num(n)}.`}</span>
            {n > shown && (
              <Button onClick={() => setShown((s) => s + PAGE)}>Show {PAGE} more</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
