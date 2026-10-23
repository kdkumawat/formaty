"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
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
import { MAX_SPLIT, MIN_SPLIT } from "@/hooks/workspace/useSplitResize";
import {
  LIST_EXPORT_FORMATS,
  detectListDelimiter,
  formatListItems,
  listExportExample,
  listExportExtension,
  listExportFormatLabel,
  shortName,
  type ListDelimiter,
  type ListExportFormat,
  type ListBucket,
  type ListItem,
  type ListSortMode,
} from "@/lib/json/listCompare";

/** Where a bucket's items come from; the info line of a result tab. */
export const BUCKET_SOURCE: Partial<Record<ListBucket, string>> = {
  common: "from A and B",
  union: "from A and B",
  leftOnly: "from A only",
  rightOnly: "from B only",
  leftDupes: "repeated in A",
  rightDupes: "repeated in B",
  changed: "same key, different row",
};

/** BUCKET_SOURCE with the sides' own names. */
export function bucketSource(names: { left?: string; right?: string } = {}): Partial<Record<ListBucket, string>> {
  const a = names.left?.trim() || "A";
  const b = names.right?.trim() || "B";
  return { ...BUCKET_SOURCE, common: `from ${a} and ${b}`, union: `from ${a} and ${b}`, leftOnly: `from ${a} only`, rightOnly: `from ${b} only`, leftDupes: `repeated in ${a}`, rightDupes: `repeated in ${b}` };
}

export { shortName };

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
  /** Full text for the tooltip when the label is shortened. */
  title?: string;
  /** Omit for a view that is not a set of items (Summary). */
  count?: number;
  /** Colour dot class for a side. */
  dot?: string;
  /** Fold order when the row is too narrow: lower folds into More first. Omit to keep the tab until the others are gone. */
  fold?: number;
}

/**
 * Bucket picker of a result pane: the main buckets as ink segments with their counts, the rest under a
 * "More" menu (which wears the selection when one of its items is active).
 */
export function ResultTabs<T extends string>({ tabs, more = [], value, onChange, label = "Which items" }: { tabs: ResultTab<T>[]; more?: ResultTab<T>[]; value: T; onChange: (v: T) => void; label?: string }) {
  // Fold tabs into More until the row stops overflowing: lowest `fold` first, then unranked ones from the
  // right. The selected tab never folds. Start from none folded and step up again whenever width or labels change.
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [folded, setFolded] = useState(0);
  const moreCount = more.length; // read before `more` is reassigned below
  const sig = tabs.map((t) => `${t.label}${t.title ?? ""}${t.count ?? ""}${t.fold ?? ""}`).join("|") + value;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // One effect: when width or labels change, start over from none folded; otherwise fold one more while the
  // row overflows. (Two separate effects batched "reset to 0" with "+1" and could leave the old count in place.)
  const key = `${width}|${sig}|${moreCount}`;
  const lastKey = useRef(key);
  useLayoutEffect(() => {
    if (lastKey.current !== key) {
      lastKey.current = key;
      if (folded !== 0) return setFolded(0);
    }
    const el = ref.current;
    if (el && el.scrollWidth > el.clientWidth) setFolded(folded + 1);
  }, [key, folded]);
  const order = tabs
    .filter((t) => t.value !== value)
    .map((t, i) => [t, i] as const)
    .sort(([a, i], [b, j]) => (a.fold ?? 99) - (b.fold ?? 99) || j - i)
    .map(([t]) => t.value);
  if (folded > 0) {
    const out = new Set(order.slice(0, folded));
    more = [...tabs.filter((t) => out.has(t.value)), ...more];
    tabs = tabs.filter((t) => !out.has(t.value));
  }
  const inMore = more.find((t) => t.value === value);
  const body = (t: ResultTab<T>) => (
    <>
      {t.dot && <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${t.dot}`} />}
      {t.label}
      {t.count !== undefined && <span className={cn("font-mono text-[12px] tabular-nums", t.count === 0 ? "opacity-50" : "opacity-70")}>{num(t.count)}</span>}
    </>
  );
  return (
    <div ref={ref} role="group" aria-label={label} className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
      {tabs.map((t) => (
        <Button key={t.value} variant={t.value === value ? "selected" : "ghost"} aria-pressed={t.value === value} onClick={() => onChange(t.value)} title={t.title} className="shrink-0 whitespace-nowrap">
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

/** The rounded bordered card every playground pane sits in (Transform's Input and Output, Compare, Utils). */
export const paneCardClass = "flex min-w-0 flex-col overflow-hidden rounded-[10px] border border-[var(--workspace-border)] bg-[var(--workspace-panel)]";
/** Input card of a split tool: `--split` percent wide on desktop (see `splitStyle`), full width when stacked. */
export const inputPaneClass = `${paneCardClass} shrink-0 min-[901px]:min-h-0 min-[901px]:w-[var(--split)] min-[901px]:min-w-[200px]`;
/** Result card beside it: takes the rest. */
export const resultPaneClass = `${paneCardClass} flex-1 max-[900px]:min-h-[280px] min-[901px]:min-h-0`;
/** Row holding the two cards: stacked with a gap on mobile, side by side (handle supplies the gap) on desktop. */
export const splitRowClass = "flex min-h-0 flex-1 flex-col gap-2 overflow-auto min-[901px]:flex-row min-[901px]:gap-0 min-[901px]:overflow-hidden";
export const splitStyle = (split: number) => ({ "--split": `${split}%` }) as CSSProperties;

/** Draggable divider between the input and result cards, the one Transform uses. Desktop only. */
export function SplitHandle({
  onResizeStart,
  onNudge,
  onReset,
  value,
  min = MIN_SPLIT,
  max = MAX_SPLIT,
  label = "Resize input and result",
}: {
  onResizeStart?: (e: ReactMouseEvent) => void;
  onNudge?: (delta: number) => void;
  /** Double-click: back to the default size. */
  onReset?: () => void;
  value?: number;
  min?: number;
  max?: number;
  label?: string;
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={onNudge ? 0 : undefined}
      className="group relative hidden shrink-0 cursor-col-resize items-stretch justify-center outline-none min-[901px]:flex"
      style={{ width: 8, zIndex: 10 }}
      onMouseDown={onResizeStart}
      onDoubleClick={onReset}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          onNudge?.((e.key === "ArrowLeft" ? -1 : 1) * (e.shiftKey ? 10 : 2));
        }
      }}
    >
      <div className="pointer-events-none absolute inset-y-2 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-transparent transition-colors group-hover:bg-[var(--workspace-text-muted)] group-focus-visible:bg-[var(--focus)] group-active:bg-[var(--workspace-text)]" />
    </div>
  );
}

/** Info row under a result header: the count sentence, any extra controls, Find and Sort. Shared by every result tab and Summary. */
export function FindSortRow({
  info,
  find,
  onFind,
  sort,
  onSort,
  items,
  children,
}: {
  info: string;
  find: string;
  onFind: (q: string) => void;
  sort: ListSortMode;
  onSort: (s: ListSortMode) => void;
  /** Items being sorted; "Most repeated" is offered only when their counts differ. */
  items: ListItem[];
  children?: ReactNode;
}) {
  const sortOptions = useMemo(() => {
    const counted = items.some((i) => i.count > 1);
    return SORT_OPTIONS.filter((o) => o.value !== "frequency" || counted || sort === "frequency");
  }, [items, sort]);
  return (
    <div className="flex min-h-7 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--workspace-border)] px-3 py-0.5 text-[12px] text-[var(--workspace-text-muted)]">
      <span className="min-w-[10rem] flex-1 tabular-nums">{info}</span>
      {children}
      <TextField
        aria-label="Find in result"
        placeholder="Find in result"
        icon={<MagnifyingGlassIcon />}
        value={find}
        onChange={(e) => onFind(e.target.value)}
        onClear={() => onFind("")}
        wrapperClassName="w-40"
      />
      <Select<ListSortMode> aria-label="Sort" label="Sort" width={160} options={sortOptions} value={sort} onChange={onSort} />
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
  find: findProp,
  onFind,
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
  /** Pass both to keep the Find text across tabs; otherwise this view keeps its own. */
  find?: string;
  onFind?: (q: string) => void;
}) {
  const [ownFind, setOwnFind] = useState("");
  const find = findProp ?? ownFind;
  const setFind = onFind ?? setOwnFind;
  const [shown, setShown] = useState(PAGE);

  useEffect(() => setShown(PAGE), [items, find]);

  const rows = useMemo(() => {
    const q = find.trim().toLowerCase();
    return q ? items.filter((i) => i.value.toLowerCase().includes(q)) : items;
  }, [items, find]);

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
        left={<div className="min-w-0 flex-1 max-[900px]:basis-full">{tabs}</div>}
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
      <FindSortRow
        info={filtered ? `${num(n)} matching` : info ?? `${num(n)} ${n === 1 ? "value" : "values"}`}
        find={find}
        onFind={setFind}
        sort={sort}
        onSort={onSort}
        items={items}
      />

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
