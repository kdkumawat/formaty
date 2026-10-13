"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import {
  Button,
  EmptyState,
  InputActions,
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
import { HEIGHT, focusRing } from "@/components/kit/styles";
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
  "min-h-[96px] flex-1 resize-none border-0 bg-[var(--workspace-panel)] px-3 py-2 font-mono text-[13px] leading-[1.6] text-[var(--workspace-text)] outline-none placeholder:text-[var(--workspace-text-muted)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus)]";

/** A side's colour dot and name; click to rename. Used by the list pane headers and the document row. */
export function RenameButton({ dot, name, onRename, className }: { dot: string; name: string; onRename?: (el: HTMLElement) => void; className?: string }) {
  return (
    <Tooltip content="Rename">
      <Button variant="ghost" className={cn("min-w-0 shrink px-1.5 text-[14px] font-semibold", className)} onClick={(e) => onRename?.(e.currentTarget)}>
        <span aria-hidden className={`size-2.5 shrink-0 rounded-[3px] ${dot}`} />
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

/**
 * Result tab: picks which items the result pane shows. The chosen one is a raised tile the colour of
 * the result pane; the count follows the name and is dimmed when it is zero. Omit `count` for a view
 * that is not a set of items (Summary).
 */
export function Tile({
  count,
  label,
  dot,
  on,
  onClick,
}: {
  count?: number;
  label: string;
  dot?: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex h-full shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[5px] px-2.5 text-[13px] transition-colors",
        focusRing,
        on
          ? "bg-[var(--workspace-panel)] font-medium text-[var(--workspace-text)] shadow-[0_0_0_1px_var(--workspace-border),0_1px_2px_rgba(22,22,28,0.12)] dark:bg-control-hover dark:shadow-[0_0_0_1px_var(--input)]"
          : "text-[var(--workspace-text-muted)] hover:bg-control-hover hover:text-[var(--workspace-text)]",
      )}
    >
      {dot && <span aria-hidden className={`size-2 shrink-0 rounded-[2px] ${dot}`} />}
      {label}
      {count !== undefined && (
        <span className={cn("tabular-nums", on ? "font-semibold" : "font-medium", count === 0 ? "opacity-50" : !on && "text-[var(--workspace-text)]")}>
          {num(count)}
        </span>
      )}
    </button>
  );
}

/** One track holding the result tabs; scrolls sideways when they do not fit. With a host (the Compare bar) it renders there, above the result pane. */
export function TileRow({ label, host, children }: { label: string; host?: HTMLElement | null; children: ReactNode }) {
  const track = (
    <div role="group" aria-label={label} className={cn("inline-flex max-w-full items-stretch gap-0.5 overflow-x-auto rounded-md bg-control p-0.5 [scrollbar-width:none]", HEIGHT.sm)}>
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
export function SplitHandle({ onResizeStart }: { onResizeStart?: () => void }) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className="group relative hidden shrink-0 cursor-col-resize items-stretch justify-center min-[901px]:flex"
      style={{ width: 9, marginLeft: -4, marginRight: -4, zIndex: 10 }}
      onMouseDown={onResizeStart}
    >
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--workspace-border)] transition-colors group-hover:bg-brand group-active:bg-brand" />
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
  copyVariant,
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
  /** "secondary" where the page around the result already has its one amber action. */
  copyVariant?: "primary" | "secondary";
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

  // Only the first few rows are formatted for the preview; the full text is built on demand.
  const preview = useMemo(() => formatListItems(rows.slice(0, 4), format).replace(/\s*\n\s*/g, " ⏎ "), [rows, format]);
  const fullText = (f: ListExportFormat = format) => formatListItems(rows, f);

  // Long values get one column so they can be read; short ones pack into a grid.
  const wide = useMemo(() => {
    const end = Math.min(rows.length, shown);
    for (let i = 0; i < end; i++) if (rows[i].value.length > 32) return true;
    return false;
  }, [rows, shown]);

  const n = rows.length;
  const filtered = !!find.trim();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PaneHeader
        left={
          <>
            <TextField
              aria-label="Find in result"
              placeholder="Find in result"
              icon={<MagnifyingGlassIcon />}
              value={find}
              onChange={(e) => setFind(e.target.value)}
              onClear={() => setFind("")}
              wrapperClassName="w-44 max-[900px]:w-full max-[900px]:flex-1"
            />
            <Select<ListSortMode> label="Sort" width={172} options={sortOptions} value={sort} onChange={onSort} />
            <div className="min-w-0 flex-1 basis-32 font-mono max-sm:hidden text-[12px] text-[var(--workspace-text-muted)]">
              <TruncatedText>
                {n > 0 ? `${filtered ? `${num(n)} matching. ` : ""}Copies as: ${preview}${n > 4 ? " ..." : ""}` : "Nothing to copy"}
              </TruncatedText>
            </div>
          </>
        }
        right={
          <ResultActions
            onDownload={() => downloadText(`${fileBase}.${listExportExtension(format)}`, fullText())}
            canDownload={n > 0}
            copy={{
              getText: (f) => fullText((f as ListExportFormat | undefined) ?? format),
              formats: LIST_COPY_FORMATS,
              format,
              onFormatChange: (id) => onFormat(id as ListExportFormat),
              disabled: n === 0,
              variant: copyVariant,
            }}
          />
        }
      />

      {n === 0 ? (
        <EmptyState title={filtered ? "Nothing matches your search" : emptyTitle} description={filtered ? undefined : empty} />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto px-3 pb-2 pt-1">
          <div className="grid gap-x-6" style={{ gridTemplateColumns: wide ? "minmax(0, 1fr)" : "repeat(auto-fill, minmax(min(100%, 300px), 1fr))" }}>
            {rows.slice(0, shown).map((it, i) => (
              <RowCopy key={`${it.key}-${i}`} text={it.value} className="px-1">
                <span className="flex items-center gap-2">
                  <span aria-hidden className="w-8 shrink-0 font-sans text-[12px] tabular-nums text-[var(--workspace-text-muted)]">{i + 1}</span>
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
