"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowsRightLeftIcon,
  BarsArrowDownIcon,
  BarsArrowUpIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { Dropdown } from "@/components/workspace/Dropdown";
import { Tooltip } from "@/components/workspace/Tooltip";
import {
  menuItemClass as sharedMenuItemClass,
  menuItemActiveClass as sharedMenuItemActiveClass,
  menuCheck as sharedMenuCheck,
  menuSectionLabel as sharedMenuSectionLabel,
} from "@/components/workspace/menuStyles";
import { toast } from "@/components/Toast";
import {
  BUCKET_LABELS,
  DEFAULT_LIST_PARSE_OPTIONS,
  LIST_EXPORT_FORMATS,
  compareLists,
  formatListItems,
  getBucketItems,
  listExportFormatLabel,
  sortListText,
  type ListBucket,
  type ListExportFormat,
  type ListParseOptions,
  type ListSortMode,
} from "@/lib/json/listCompare";
import {
  compareCsvByColumn,
  detectCsvColumns,
  pickDefaultColumn,
} from "@/lib/json/csvCompare";

export type ListCompareExport = {
  /** Formatted output text exactly as shown in the output pane. */
  text: string;
  /** Raw item values (display form) - used by Copy-as to rebuild any format. */
  items: string[];
  filename: string;
  bucket: ListBucket;
  count: number;
};

interface ListComparePanelProps {
  left: string;
  right: string;
  onLeftChange: (value: string) => void;
  onRightChange: (value: string) => void;
  linkBtnClass: string;
  panelClass: string;
  isDark?: boolean;
  leadingControls?: ReactNode;
  trailingControls?: ReactNode;
  toolbarHost?: HTMLElement | null;
  onExportChange?: (exportInfo: ListCompareExport | null) => void;
  fontSize?: number;
  options?: ListParseOptions;
  /** CSV key column restored from a shared link. */
  initialCsvColumn?: string | null;
  /** Report the selected CSV column up so share links can preserve it. */
  onCsvColumnChange?: (col: string | null) => void;
}

const PRIMARY_BUCKETS: ListBucket[] = ["common", "leftOnly", "rightOnly", "union", "symmetric", "changed"];
const DUPE_BUCKETS: ListBucket[] = ["leftDupes", "rightDupes"];

const EXPORT_GROUPS: { label: string; items: ListExportFormat[] }[] = [
  {
    label: "SQL",
    items: ["sql-in-single", "sql-not-in", "sql-values", "sql-array"],
  },
  {
    label: "Tables",
    items: ["markdown-table", "html-table"],
  },
  {
    label: "Data",
    items: ["json-array", "json-array-numbers", "newline", "comma", "comma-space", "comma-double-quotes", "pipe", "csv-quoted", "tsv", "yaml-list"],
  },
  {
    label: "Code",
    items: ["js-array-single", "js-array-double", "python-list", "go-slice", "regex-alt", "raw"],
  },
];

/** Single icon cycles none → asc → desc → none (table-style). */
function CycleSortButton({
  linkBtnClass,
  mode,
  disabled,
  onCycle,
  titlePrefix = "Sort",
}: {
  linkBtnClass: string;
  mode: ListSortMode;
  disabled?: boolean;
  onCycle: () => void;
  titlePrefix?: string;
}) {
  const title =
    mode === "none"
      ? `${titlePrefix}: click for A → Z`
      : mode === "asc"
        ? `${titlePrefix}: A → Z - click for Z → A`
        : `${titlePrefix}: Z → A - click to reset`;
  return (
    <Tooltip content={title}>
    <button
      type="button"
      className={`${linkBtnClass} h-7 min-h-7 w-7 disabled:opacity-40 ${
        mode !== "none" ? "!bg-primary/12 !text-primary" : ""
      }`}
      disabled={disabled}
      onClick={onCycle}
    >
      {mode === "desc" ? (
        <BarsArrowDownIcon className="h-3.5 w-3.5" />
      ) : (
        <BarsArrowUpIcon className={`h-3.5 w-3.5 ${mode === "none" ? "opacity-50" : ""}`} />
      )}
    </button>
    </Tooltip>
  );
}

function cycleSort(mode: ListSortMode): ListSortMode {
  if (mode === "none") return "asc";
  if (mode === "asc") return "desc";
  return "none";
}

export function ListComparePanel({
  left,
  right,
  onLeftChange,
  onRightChange,
  linkBtnClass,
  panelClass,
  leadingControls,
  trailingControls,
  toolbarHost = null,
  onExportChange,
  fontSize = 13,
  options,
  initialCsvColumn,
  onCsvColumnChange,
}: ListComparePanelProps) {
  const effectiveOptions = options ?? DEFAULT_LIST_PARSE_OPTIONS;
  const [resultSort, setResultSort] = useState<ListSortMode>("asc");
  const [leftSort, setLeftSort] = useState<ListSortMode>("none");
  const [rightSort, setRightSort] = useState<ListSortMode>("none");
  const [activeBucket, setActiveBucket] = useState<ListBucket>("common");
  /** Bucket shown before the last dup-link click - clicking again restores it. */
  const prevBucketRef = useRef<ListBucket>("common");

  const toggleDupBucket = (b: "leftDupes" | "rightDupes") => {
    if (activeBucket === b) {
      // Click again on the active dup link → restore the previous bucket.
      setActiveBucket(prevBucketRef.current);
      return;
    }
    prevBucketRef.current = activeBucket;
    setActiveBucket(b);
  };
  const [display, setDisplay] = useState<"inline" | "table">("inline");

  // Preserve the selected export format across sessions (localStorage).
  const [exportFormat, setExportFormat] = useState<ListExportFormat | null>(() => {
    try {
      const raw = localStorage.getItem("formaty-list-export-format");
      if (!raw || raw === "none") return null;
      if (raw && (LIST_EXPORT_FORMATS as string[]).includes(raw)) return raw as ListExportFormat;
    } catch {
      /* ignore */
    }
    return "comma-space";
  });
  useEffect(() => {
    try {
      localStorage.setItem("formaty-list-export-format", exportFormat ?? "none");
    } catch {
      /* ignore */
    }
  }, [exportFormat]);
  const [exportOpen, setExportOpen] = useState(false);
  const [bucketOpen, setBucketOpen] = useState(false);
  const [colOpen, setColOpen] = useState(false);
  const [leftSnapshot, setLeftSnapshot] = useState<string | null>(null);
  const [rightSnapshot, setRightSnapshot] = useState<string | null>(null);

  // CSV column detection: when both sides look like header CSVs, offer column compare.
  const csvColumns = useMemo(() => {
    const l = detectCsvColumns(left);
    const r = detectCsvColumns(right);
    if (!l || !r) return null;
    const common = l.filter((c) => r.includes(c));
    if (common.length === 0) return null;
    return { left: l, right: r, common };
  }, [left, right]);

  const [csvColumn, setCsvColumn] = useState<string | null>(null);

  // Auto-pick the first common column when CSVs are first detected;
  // prefer the column restored from a share link when it is still valid.
  useEffect(() => {
    if (!csvColumns) {
      setCsvColumn(null);
      return;
    }
    setCsvColumn((cur) => {
      if (cur && csvColumns.common.includes(cur)) return cur;
      if (initialCsvColumn && csvColumns.common.includes(initialCsvColumn)) return initialCsvColumn;
      return pickDefaultColumn(csvColumns.left, csvColumns.right);
    });
  }, [csvColumns, initialCsvColumn]);

  // Report the selected column so share links can preserve it.
  useEffect(() => {
    onCsvColumnChange?.(csvColumn);
  }, [csvColumn, onCsvColumnChange]);

  const result = useMemo(() => {
    if (csvColumn && csvColumns) {
      const csvResult = compareCsvByColumn(left, right, csvColumn, effectiveOptions);
      if (csvResult) return csvResult.result;
    }
    return compareLists(left, right, effectiveOptions);
  }, [left, right, effectiveOptions, csvColumn, csvColumns]);

  const bucketItems = useMemo(
    () => getBucketItems(result, activeBucket),
    [result, activeBucket],
  );
  const outputText = useMemo(
    () =>
      exportFormat === null
        ? bucketItems.map((i) => i.value).join("\n")
        : formatListItems(bucketItems, exportFormat, resultSort),
    [bucketItems, exportFormat, resultSort],
  );

  useEffect(() => {
    if (!onExportChange) return;
    if (!outputText) {
      onExportChange(null);
      return;
    }
    onExportChange({
      text: outputText,
      items: bucketItems.map((i) => i.value),
      filename: `formaty-list-${activeBucket}.txt`,
      bucket: activeBucket,
      count: bucketItems.length,
    });
  }, [outputText, activeBucket, bucketItems, onExportChange]);

  useEffect(() => {
    return () => {
      onExportChange?.(null);
    };
  }, [onExportChange]);

  const swap = () => {
    onLeftChange(right);
    onRightChange(left);
    setLeftSnapshot((s) => {
      const r = rightSnapshot;
      setRightSnapshot(s);
      return r;
    });
    setLeftSort((ls) => {
      const rs = rightSort;
      setRightSort(ls);
      return rs;
    });
    toast({ message: "Swapped sides", type: "info" });
  };

  const applySideSort = (side: "left" | "right", next: ListSortMode) => {
    if (side === "left") {
      if (!left.trim() && next !== "none") return;
      if (next === "none") {
        if (leftSnapshot !== null) {
          onLeftChange(leftSnapshot);
          setLeftSnapshot(null);
        }
        setLeftSort("none");
        toast({ message: "Left sort reset", type: "info" });
        return;
      }
      if (leftSnapshot === null) setLeftSnapshot(left);
      const base = leftSnapshot ?? left;
      onLeftChange(sortListText(base, effectiveOptions, next));
      setLeftSort(next);
      toast({ message: next === "asc" ? "Left sorted A → Z" : "Left sorted Z → A", type: "success" });
    } else {
      if (!right.trim() && next !== "none") return;
      if (next === "none") {
        if (rightSnapshot !== null) {
          onRightChange(rightSnapshot);
          setRightSnapshot(null);
        }
        setRightSort("none");
        toast({ message: "Right sort reset", type: "info" });
        return;
      }
      if (rightSnapshot === null) setRightSnapshot(right);
      const base = rightSnapshot ?? right;
      onRightChange(sortListText(base, effectiveOptions, next));
      setRightSort(next);
      toast({ message: next === "asc" ? "Right sorted A → Z" : "Right sorted Z → A", type: "success" });
    }
  };

  const bucketCount = (b: ListBucket) => {
    switch (b) {
      case "common":
        return result.stats.common;
      case "leftOnly":
        return result.stats.leftOnly;
      case "rightOnly":
        return result.stats.rightOnly;
      case "union":
        return result.stats.union;
      case "symmetric":
        return result.stats.symmetric;
      case "leftDupes":
        return result.stats.leftDupes;
      case "rightDupes":
        return result.stats.rightDupes;
      case "changed":
        return result.stats.changed;
    }
  };

  const bucketColor = (b: ListBucket) => {
    if (b === "common") return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
    if (b === "leftOnly") return "text-sky-600 dark:text-sky-400 bg-sky-500/10";
    if (b === "rightOnly") return "text-violet-600 dark:text-violet-400 bg-violet-500/10";
    if (b === "leftDupes" || b === "rightDupes")
      return "text-amber-700 dark:text-amber-400 bg-amber-500/10";
    if (b === "changed") return "text-orange-600 dark:text-orange-400 bg-orange-500/10";
    if (b === "symmetric") return "text-rose-600 dark:text-rose-400 bg-rose-500/10";
    return "text-[var(--workspace-text-muted)] bg-[var(--workspace-background)]";
  };

  /** Solid dot color per bucket for the compact select trigger. */
  const bucketDot = (b: ListBucket) => {
    if (b === "common") return "bg-emerald-500";
    if (b === "leftOnly") return "bg-sky-500";
    if (b === "rightOnly") return "bg-violet-500";
    if (b === "leftDupes" || b === "rightDupes") return "bg-amber-500";
    if (b === "changed") return "bg-orange-500";
    if (b === "symmetric") return "bg-rose-500";
    return "bg-[var(--workspace-border)]";
  };

  // Never leave the user staring at an empty bucket: when the active bucket has
  // no items (e.g. a one-sided list preset lands on "Common"), jump to the first
  // bucket that actually has results - common, then left/right-only, dupes, etc.
  useEffect(() => {
    setActiveBucket((cur) => {
      if (bucketCount(cur) > 0) return cur;
      const first = [...PRIMARY_BUCKETS, ...DUPE_BUCKETS].find((b) => bucketCount(b) > 0);
      return first ?? cur;
    });
    // bucketCount is a fresh closure over `result` each render; run on every result change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const menuItem = (active: boolean) =>
    `${sharedMenuItemClass} ${active ? sharedMenuItemActiveClass : ""}`;

  /** Same select-trigger look as the workspace Format / View / Actions dropdowns. */
  const selectTrigger =
    "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-muted px-2 text-[11px] font-medium text-[var(--workspace-text)] transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40";

  const loadSample = () => {
    onLeftChange("user_1001\nuser_1002\nuser_1003\nuser_1002\nuser_1004\nuser_1005\nuser_1003\nuser_1006");
    onRightChange("user_1002\nuser_1003\nuser_1004\nuser_1006\nuser_1007\nuser_1008");
    setActiveBucket("common");
    setLeftSnapshot(null);
    setRightSnapshot(null);
    setLeftSort("none");
    setRightSort("none");
    toast({ message: "Sample loaded", type: "success" });
  };

  const visibleDupes = DUPE_BUCKETS.filter((b) => bucketCount(b) > 0);
  const visibleBuckets = PRIMARY_BUCKETS.filter(
    (b) => b !== "changed" || bucketCount(b) > 0 || csvColumn,
  );
  const changedCount = bucketCount("changed");

  // Single row - parent host owns overflow; no wrap so toolbar stays one line
  const toolbarBody = (
    <>
      {leadingControls}

      <div className="mx-0.5 h-4 w-px shrink-0 bg-[var(--workspace-border)]" />

      {csvColumn && changedCount > 0 && (
        <Tooltip content="Rows with the same key but different values" className="shrink-0">
        <button
          type="button"
          onClick={() => setActiveBucket("changed")}
          className={`${linkBtnClass} h-7 min-h-7 shrink-0 px-2 text-[11px] font-semibold tabular-nums ${
            activeBucket === "changed" ? `!ring-1 !ring-primary/40 ${bucketColor("changed")}` : ""
          }`}
        >
          Changed {changedCount}
        </button>
        </Tooltip>
      )}      {trailingControls}
    </>
  );

  const toolbarNode = toolbarHost ? (
    createPortal(
      <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-1">{toolbarBody}</div>,
      toolbarHost,
    )
  ) : (
    <div className={`flex shrink-0 flex-nowrap items-center gap-1 overflow-x-auto border-b px-1.5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${panelClass}`}>
      {toolbarBody}
    </div>
  );

  const paneHeader =
    "flex h-10 shrink-0 items-center gap-1.5 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2";
  const editorClass =
    "min-h-[100px] flex-1 resize-none border-0 bg-[var(--workspace-panel)] px-2.5 py-2 font-mono leading-relaxed text-[var(--workspace-text)] outline-none placeholder:text-[var(--workspace-text-muted)]/50";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {toolbarNode}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-[var(--workspace-border)] sm:flex-row lg:border-b-0">
          {/* Left */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-[var(--workspace-border)] sm:border-b-0 sm:border-r">
            <div className={paneHeader}>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
              <span className="text-[11px] font-semibold text-[var(--workspace-text)]">Left</span>
              <span className="flex min-w-0 items-center gap-1 text-[10px] tabular-nums text-[var(--workspace-text-muted)]">
                <span className="shrink-0">{result.left.rawCount} items</span>
                <span aria-hidden>·</span>
                <span className="shrink-0">{result.left.uniqueCount} unique</span>
                <span aria-hidden>·</span>
                <Tooltip content={activeBucket === "leftDupes" ? "Show previous bucket" : "Show duplicates in left list"}>
                <button
                  type="button"
                  onClick={() => toggleDupBucket("leftDupes")}
                  className={`shrink-0 rounded px-1 font-medium transition-colors ${
                    activeBucket === "leftDupes"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "text-[var(--workspace-text-muted)] hover:text-primary"
                  }`}
                >
                  {result.leftDupes.length} dup
                </button>
                </Tooltip>
              </span>
              <span className="ml-auto flex items-center gap-1">
                <CycleSortButton
                  linkBtnClass={linkBtnClass}
                  mode={leftSort}
                  disabled={!left.trim() && leftSort === "none"}
                  onCycle={() => applySideSort("left", cycleSort(leftSort))}
                  titlePrefix="Left sort"
                />
              </span>
            </div>
            <textarea
              value={left}
              onChange={(e) => {
                onLeftChange(e.target.value);
                setLeftSnapshot(null);
                setLeftSort("none");
              }}
              placeholder={"Paste list…\none per line, CSV, or JSON array"}
              spellCheck={false}
              className={editorClass}
              style={{ fontSize }}
            />
          </div>

          {/* Middle divider - swap appears on hover */}
          <div className="hidden lg:flex h-10 w-7 shrink-0 flex-col items-center justify-center border-x border-[var(--workspace-border)] bg-[var(--workspace-panel)] group/swap">
            <Tooltip content="Swap sides">
            <button
              type="button"
              onClick={swap}
              className={`${linkBtnClass} h-6 min-h-6 w-6 opacity-0 transition-opacity duration-150 group-hover/swap:opacity-100`}
            >
              <ArrowsRightLeftIcon className="h-3.5 w-3.5" />
            </button>
            </Tooltip>
          </div>

          {/* Right */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className={paneHeader}>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
              <span className="text-[11px] font-semibold text-[var(--workspace-text)]">Right</span>
              <span className="flex min-w-0 items-center gap-1 text-[10px] tabular-nums text-[var(--workspace-text-muted)]">
                <span className="shrink-0">{result.right.rawCount} items</span>
                <span aria-hidden>·</span>
                <span className="shrink-0">{result.right.uniqueCount} unique</span>
                <span aria-hidden>·</span>
                <Tooltip content={activeBucket === "rightDupes" ? "Show previous bucket" : "Show duplicates in right list"}>
                <button
                  type="button"
                  onClick={() => toggleDupBucket("rightDupes")}
                  className={`shrink-0 rounded px-1 font-medium transition-colors ${
                    activeBucket === "rightDupes"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "text-[var(--workspace-text-muted)] hover:text-primary"
                  }`}
                >
                  {result.rightDupes.length} dup
                </button>
                </Tooltip>
              </span>
              <span className="ml-auto flex items-center gap-1">
                <CycleSortButton
                  linkBtnClass={linkBtnClass}
                  mode={rightSort}
                  disabled={!right.trim() && rightSort === "none"}
                  onCycle={() => applySideSort("right", cycleSort(rightSort))}
                  titlePrefix="Right sort"
                />
              </span>
            </div>
            <textarea
              value={right}
              onChange={(e) => {
                onRightChange(e.target.value);
                setRightSnapshot(null);
                setRightSort("none");
              }}
              placeholder={"Second list…"}
              spellCheck={false}
              className={editorClass}
              style={{ fontSize }}
            />
          </div>
        </div>

        {/* Result */}
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col border-l border-[var(--workspace-border)] lg:max-w-[42%]">
          <div className={`${paneHeader} gap-1`}>
            {csvColumns && (
              <Dropdown
                open={colOpen}
                onOpenChange={setColOpen}
                side="bottom"
                align="start"
                contentClassName="w-max min-w-[8rem]"
                trigger={
                  <Tooltip content="Compare by CSV column">
                  <button
                    type="button"
                    className={`${selectTrigger} max-w-[8rem] ${colOpen ? "!bg-primary/12 !text-primary" : ""}`}
                  >
                    <span className="truncate">{csvColumn ? `col: ${csvColumn}` : "col"}</span>
                    <ChevronDownIcon className="h-3 w-3 shrink-0 opacity-60" />
                  </button>
                  </Tooltip>
                }
              >
                <div className="flex flex-col">
                  {csvColumns.common.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={menuItem(csvColumn === c)}
                      onClick={() => {
                        setCsvColumn(c);
                        setActiveBucket("common");
                        setColOpen(false);
                      }}
                    >
                      {sharedMenuCheck(csvColumn === c)}
                      {c}
                    </button>
                  ))}
                </div>
              </Dropdown>
            )}

            <Dropdown
              open={bucketOpen}
              onOpenChange={setBucketOpen}
              side="bottom"
              align="start"
              contentClassName={`w-max min-w-[9rem]`}
              trigger={
                <Tooltip content="Select bucket">
                <button
                  type="button"
                  className={`${selectTrigger} ${bucketOpen ? "!bg-primary/12 !text-primary" : ""}`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${bucketDot(activeBucket)}`} />
                  {BUCKET_LABELS[activeBucket]} · {bucketItems.length}
                  <ChevronDownIcon className="h-3 w-3 shrink-0 opacity-60" />
                </button>
                </Tooltip>
              }
            >
              <div className="flex flex-col">
                {visibleBuckets.map((b) => {
                  const n = bucketCount(b);
                  if (n === 0 && (b === "symmetric" || b === "changed")) return null;
                  return (
                    <button
                      key={b}
                      type="button"
                      className={menuItem(activeBucket === b)}
                      onClick={() => {
                        setActiveBucket(b);
                        setBucketOpen(false);
                      }}
                    >
                      {sharedMenuCheck(activeBucket === b)}
                      {BUCKET_LABELS[b]} <span className="opacity-70">{n}</span>
                    </button>
                  );
                })}
                {visibleDupes.map((b) => {
                  const n = bucketCount(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      className={menuItem(activeBucket === b)}
                      onClick={() => {
                        setActiveBucket(b);
                        setBucketOpen(false);
                      }}
                    >
                      {sharedMenuCheck(activeBucket === b)}
                      {BUCKET_LABELS[b]} {n}
                    </button>
                  );
                })}
              </div>
            </Dropdown>

            <CycleSortButton
              linkBtnClass={linkBtnClass}
              mode={resultSort}
              onCycle={() => setResultSort((m) => cycleSort(m))}
              titlePrefix="Result sort"
            />

            <div className="flex h-7 shrink-0 overflow-hidden rounded-md bg-muted">
              <Tooltip content="Inline view - comma-separated">
              <button
                type="button"
                aria-label="Inline view"
                className={`flex h-7 cursor-pointer items-center justify-center px-2 text-[11px] ${
                  display === "inline" ? "bg-primary/15 text-primary" : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-[var(--workspace-text)]"
                }`}
                onClick={() => setDisplay("inline")}
              >
                <span className="flex flex-col gap-[2px] py-0.5" aria-hidden>
                  <span className="h-px w-3 bg-current" />
                  <span className="h-px w-3 bg-current" />
                  <span className="h-px w-3 bg-current" />
                </span>
              </button>
              </Tooltip>
              <Tooltip content="Table view">
              <button
                type="button"
                aria-label="Table view"
                className={`flex h-7 cursor-pointer items-center justify-center px-2 text-[11px] ${
                  display === "table" ? "bg-primary/15 text-primary" : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-[var(--workspace-text)]"
                }`}
                onClick={() => setDisplay("table")}
              >
                <TableCellsIcon className="h-3.5 w-3.5" />
              </button>
              </Tooltip>
            </div>

            <Dropdown
              open={exportOpen}
              onOpenChange={setExportOpen}
              side="bottom"
              align="end"
              maxWidth="max-w-[17rem]"
              contentClassName="max-h-[50vh] overflow-y-auto"
              trigger={
                  <Tooltip content={display === "table" ? "Copy-as is disabled in table view" : "Copy as… - updates the output (or use the Copy button)"} className="shrink-0">
                <button
                  type="button"
                  disabled={display === "table"}
                  className={`${selectTrigger} max-w-[11rem] ${exportOpen ? "!bg-primary/12 !text-primary" : ""}`}
                >
                  <ClipboardDocumentIcon className="h-3.5 w-3.5 shrink-0 text-[var(--workspace-text-muted)]" />
                  <span className="truncate">{exportFormat === null ? "None · plain list" : listExportFormatLabel(exportFormat)}</span>
                  <ChevronDownIcon className="h-3 w-3 shrink-0 opacity-60" />
                </button>
                </Tooltip>
              }
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  className={menuItem(exportFormat === null)}
                  onClick={() => {
                    setExportFormat(null);
                    setExportOpen(false);
                  }}
                >
                  {sharedMenuCheck(exportFormat === null)}
                  <span className="min-w-0 flex-1 truncate text-left">None · plain list</span>
                </button>
                {EXPORT_GROUPS.map((group) => (
                  <div key={group.label}>
                    {sharedMenuSectionLabel(group.label)}
                    {group.items.map((f) => (
                      <button
                        key={f}
                        type="button"
                        className={menuItem(exportFormat === f)}
                        onClick={() => {
                          setExportFormat(f);
                          setExportOpen(false);
                        }}
                      >
                        {sharedMenuCheck(exportFormat === f)}
                        <span className="min-w-0 flex-1 truncate text-left">{listExportFormatLabel(f)}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </Dropdown>
          </div>

          {display === "inline" ? (
            <div className="min-h-0 flex-1 overflow-auto bg-[var(--workspace-panel)] px-3 py-2.5" style={{ fontSize }}>
              {bucketItems.length === 0 ? (
                <p className="font-mono text-[var(--workspace-text-muted)]">
                  {left.trim() || right.trim() ? (
                    "No items in this bucket."
                  ) : (
                    <>
                      Paste lists on the left and right.{" "}
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline"
                        onClick={loadSample}
                      >
                        Load sample
                      </button>
                    </>
                  )}
                </p>
              ) : (
                <p className="whitespace-pre-wrap break-words font-mono leading-relaxed text-[var(--workspace-text)]">
                  {outputText}
                </p>
              )}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto bg-[var(--workspace-panel)] px-2.5 py-2" style={{ fontSize }}>
              {bucketItems.length === 0 ? (
                <p className="font-mono text-[var(--workspace-text-muted)]">
                  {left.trim() || right.trim() ? (
                    "No items in this bucket."
                  ) : (
                    <>
                      Paste lists on the left and right.{" "}
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline"
                        onClick={loadSample}
                      >
                        Load sample
                      </button>
                    </>
                  )}
                </p>
              ) : (
                <table className="w-full border-collapse">
                  <tbody>
                    {bucketItems.map((item, i) => (
                      <tr
                        key={`${item.key}-${i}`}
                        className={`border-b border-[var(--workspace-border)]/40 last:border-0 ${
                          i % 2 === 1 ? "bg-[var(--workspace-background)]" : ""
                        }`}
                      >
                        <td className="py-0.5 pr-3 font-mono text-[var(--workspace-text)]">{item.value}</td>
                        <td className="py-0.5 text-right font-mono tabular-nums text-[var(--workspace-text-muted)]">
                          ×{item.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
