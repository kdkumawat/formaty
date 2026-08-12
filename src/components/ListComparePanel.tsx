"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowsRightLeftIcon,
  BarsArrowDownIcon,
  BarsArrowUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Dropdown } from "@/components/workspace/Dropdown";
import { Tooltip } from "@/components/workspace/Tooltip";
import {
  menuItemClass as sharedMenuItemClass,
  menuItemActiveClass as sharedMenuItemActiveClass,
  menuSectionLabel as sharedMenuSectionLabel,
} from "@/components/workspace/menuStyles";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BUCKET_LABELS,
  DEFAULT_LIST_PARSE_OPTIONS,
  compareLists,
  formatListItems,
  formatSqlInClause,
  getBucketItems,
  listExportFormatLabel,
  sortListText,
  type ListBucket,
  type ListExportFormat,
  type ListParseOptions,
  type ListSortMode,
} from "@/lib/json/listCompare";

export type ListCompareExport = {
  text: string;
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
}

const PRIMARY_BUCKETS: ListBucket[] = ["common", "leftOnly", "rightOnly", "union", "symmetric"];
const DUPE_BUCKETS: ListBucket[] = ["leftDupes", "rightDupes"];

const EXPORT_GROUPS: { label: string; items: ListExportFormat[] }[] = [
  {
    label: "SQL",
    items: ["sql-in-single", "sql-in-double", "sql-in-unquoted", "sql-values"],
  },
  {
    label: "Data",
    items: ["json-array", "json-array-numbers", "newline", "comma-space", "csv-quoted", "tsv", "yaml-list"],
  },
  {
    label: "Code",
    items: ["js-array-single", "js-array-double", "python-list", "regex-alt", "raw"],
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
}: ListComparePanelProps) {
  const effectiveOptions = options ?? DEFAULT_LIST_PARSE_OPTIONS;
  const [resultSort, setResultSort] = useState<ListSortMode>("asc");
  const [leftSort, setLeftSort] = useState<ListSortMode>("none");
  const [rightSort, setRightSort] = useState<ListSortMode>("none");
  const [activeBucket, setActiveBucket] = useState<ListBucket>("common");
  const [exportFormat, setExportFormat] = useState<ListExportFormat>("sql-in-single");
  const [sqlColumn, setSqlColumn] = useState("id");
  const [sqlNotIn, setSqlNotIn] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [bucketOpen, setBucketOpen] = useState(false);
  const [leftSnapshot, setLeftSnapshot] = useState<string | null>(null);
  const [rightSnapshot, setRightSnapshot] = useState<string | null>(null);

  const result = useMemo(() => compareLists(left, right, effectiveOptions), [left, right, effectiveOptions]);
  const bucketItems = useMemo(
    () => getBucketItems(result, activeBucket),
    [result, activeBucket],
  );
  const formatted = useMemo(
    () => formatListItems(bucketItems, exportFormat, resultSort),
    [bucketItems, exportFormat, resultSort],
  );
  const sqlClause = useMemo(
    () =>
      formatSqlInClause(bucketItems, {
        column: sqlColumn,
        quote:
          exportFormat === "sql-in-double"
            ? "double"
            : exportFormat === "sql-in-unquoted"
              ? "none"
              : "single",
        sortMode: resultSort,
        notIn: sqlNotIn,
      }),
    [bucketItems, sqlColumn, exportFormat, resultSort, sqlNotIn],
  );

  const flashMsg = useCallback((msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 1400);
  }, []);

  const copyText = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        flashMsg(`${label} copied`);
      } catch {
        flashMsg("Copy failed");
      }
    },
    [flashMsg],
  );

  useEffect(() => {
    if (!onExportChange) return;
    if (!formatted) {
      onExportChange(null);
      return;
    }
    onExportChange({
      text: formatted,
      filename: `formaty-list-${activeBucket}.txt`,
      bucket: activeBucket,
      count: bucketItems.length,
    });
  }, [formatted, activeBucket, bucketItems.length, onExportChange]);

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
    flashMsg("Swapped");
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
        flashMsg("Left sort reset");
        return;
      }
      if (leftSnapshot === null) setLeftSnapshot(left);
      const base = leftSnapshot ?? left;
      onLeftChange(sortListText(base, effectiveOptions, next));
      setLeftSort(next);
      flashMsg(next === "asc" ? "Left A → Z" : "Left Z → A");
    } else {
      if (!right.trim() && next !== "none") return;
      if (next === "none") {
        if (rightSnapshot !== null) {
          onRightChange(rightSnapshot);
          setRightSnapshot(null);
        }
        setRightSort("none");
        flashMsg("Right sort reset");
        return;
      }
      if (rightSnapshot === null) setRightSnapshot(right);
      const base = rightSnapshot ?? right;
      onRightChange(sortListText(base, effectiveOptions, next));
      setRightSort(next);
      flashMsg(next === "asc" ? "Right A → Z" : "Right Z → A");
    }
  };

  const pasteInto = async (side: "left" | "right") => {
    try {
      const text = await navigator.clipboard.readText();
      if (side === "left") {
        onLeftChange(text);
        setLeftSnapshot(null);
        setLeftSort("none");
      } else {
        onRightChange(text);
        setRightSnapshot(null);
        setRightSort("none");
      }
      flashMsg(`Pasted ${side}`);
    } catch {
      flashMsg("Paste failed");
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
    }
  };

  const bucketColor = (b: ListBucket) => {
    if (b === "common") return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
    if (b === "leftOnly") return "text-sky-600 dark:text-sky-400 bg-sky-500/10";
    if (b === "rightOnly") return "text-violet-600 dark:text-violet-400 bg-violet-500/10";
    if (b === "leftDupes" || b === "rightDupes")
      return "text-amber-700 dark:text-amber-400 bg-amber-500/10";
    if (b === "symmetric") return "text-rose-600 dark:text-rose-400 bg-rose-500/10";
    return "text-[var(--workspace-text-muted)] bg-[var(--workspace-background)]";
  };

  const shortBucket = (b: ListBucket) => {
    if (b === "leftOnly") return "Only L";
    if (b === "rightOnly") return "Only R";
    if (b === "symmetric") return "Δ";
    if (b === "leftDupes") return "L dup";
    if (b === "rightDupes") return "R dup";
    return BUCKET_LABELS[b];
  };

  const menuItem = (active: boolean) =>
    `${sharedMenuItemClass} ${active ? sharedMenuItemActiveClass : ""}`;

  const visibleDupes = DUPE_BUCKETS.filter((b) => bucketCount(b) > 0);

  // Single row - parent host owns overflow; no wrap so toolbar stays one line
  const toolbarBody = (
    <>
      {leadingControls}

      <div className="mx-0.5 h-4 w-px shrink-0 bg-[var(--workspace-border)]" />

      {visibleDupes.map((b) => {
        const n = bucketCount(b);
        return (
          <Tooltip key={b} content={BUCKET_LABELS[b]} className="shrink-0">
          <button
            type="button"
            onClick={() => setActiveBucket(b)}
            className={`${linkBtnClass} h-7 min-h-7 shrink-0 px-2 text-[11px] font-semibold tabular-nums ${
              activeBucket === b ? `!ring-1 !ring-primary/40 ${bucketColor(b)}` : ""
            }`}
          >
            {shortBucket(b)} {n}
          </button>
          </Tooltip>
        );
      })}

      <span className="hidden shrink-0 text-[10px] tabular-nums text-[var(--workspace-text-muted)] sm:inline">
        L {result.left.uniqueCount} · R {result.right.uniqueCount}
      </span>

      {flash && <span className="shrink-0 text-[10px] font-medium text-primary">{flash}</span>}
      {trailingControls}
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
              <span className="text-[10px] tabular-nums text-[var(--workspace-text-muted)]">
                {result.left.uniqueCount} unique
              </span>
              <span className="ml-auto flex items-center gap-1">
                <CycleSortButton
                  linkBtnClass={linkBtnClass}
                  mode={leftSort}
                  disabled={!left.trim() && leftSort === "none"}
                  onCycle={() => applySideSort("left", cycleSort(leftSort))}
                  titlePrefix="Left sort"
                />
                <button
                  type="button"
                  className={`${linkBtnClass} h-7 min-h-7 px-2 text-[11px]`}
                  onClick={() => void pasteInto("left")}
                >
                  Paste
                </button>
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
          <div className="hidden lg:flex h-10 w-4 shrink-0 flex-col items-center justify-center border-x border-[var(--workspace-border)] bg-[var(--workspace-panel)] group/swap">
            <Tooltip content="Swap sides">
            <button
              type="button"
              onClick={swap}
              className={`${linkBtnClass} h-7 min-h-7 w-7 opacity-0 transition-opacity duration-150 group-hover/swap:opacity-100`}
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
              <span className="text-[10px] tabular-nums text-[var(--workspace-text-muted)]">
                {result.right.uniqueCount} unique
              </span>
              <span className="ml-auto flex items-center gap-1">
                <CycleSortButton
                  linkBtnClass={linkBtnClass}
                  mode={rightSort}
                  disabled={!right.trim() && rightSort === "none"}
                  onCycle={() => applySideSort("right", cycleSort(rightSort))}
                  titlePrefix="Right sort"
                />
                <button
                  type="button"
                  className={`${linkBtnClass} h-7 min-h-7 px-2 text-[11px]`}
                  onClick={() => void pasteInto("right")}
                >
                  Paste
                </button>
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
            <Dropdown
              open={bucketOpen}
              onOpenChange={setBucketOpen}
              side="bottom"
              align="start"
              contentClassName={`w-max min-w-[8rem]`}
              trigger={
                <Tooltip content="Select bucket">
                <button
                  type="button"
                  className={`${linkBtnClass} h-7 min-h-7 gap-0.5 px-2 text-[11px] font-semibold ${bucketColor(activeBucket)}`}
                >
                  {BUCKET_LABELS[activeBucket]} · {bucketItems.length}
                  <ChevronDownIcon className="h-3 w-3 opacity-60" />
                </button>
                </Tooltip>
              }
            >
              <div className="flex flex-col">
                {PRIMARY_BUCKETS.map((b) => {
                  const n = bucketCount(b);
                  if (n === 0 && b === "symmetric") return null;
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

            <Dropdown
              open={exportOpen}
              onOpenChange={setExportOpen}
              side="bottom"
              align="end"
              contentClassName={`max-h-[50vh] w-52 overflow-y-auto`}
              trigger={
                <Tooltip content="Result format (copy via output actions)" className="shrink-0">
                <button
                  type="button"
                  className={`${linkBtnClass} h-7 min-h-7 max-w-[10rem] gap-0.5 truncate px-2 text-[11px] font-medium`}
                >
                  <span className="truncate">{listExportFormatLabel(exportFormat)}</span>
                  <ChevronDownIcon className="h-3 w-3 shrink-0 opacity-60" />
                </button>
                </Tooltip>
              }
            >
              <div className="flex flex-col">
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
                        {listExportFormatLabel(f)}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </Dropdown>

            <div className="mx-0.5 h-4 w-px shrink-0 bg-[var(--workspace-border)]" />

            <Tooltip content="SQL column name">
            <input
              type="text"
              value={sqlColumn}
              onChange={(e) => setSqlColumn(e.target.value)}
              className="h-7 w-14 shrink-0 rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-1.5 font-mono text-[11px] text-[var(--workspace-text)]"
              aria-label="SQL column name"
            />
            </Tooltip>
            <Tooltip content="NOT IN" className="shrink-0">
            <label
              className="flex shrink-0 cursor-pointer items-center gap-0.5 text-[11px] text-[var(--workspace-text-muted)]"
            >
              <Checkbox
                checked={sqlNotIn}
                onCheckedChange={(c) => setSqlNotIn(c === true)}
              />
              NOT
            </label>
            </Tooltip>
            <Tooltip content="Copy SQL IN / NOT IN clause" className="shrink-0">
            <button
              type="button"
              className={`${linkBtnClass} h-7 min-h-7 shrink-0 px-2 text-[11px] font-semibold text-primary`}
              disabled={bucketItems.length === 0}
              onClick={() => void copyText(sqlClause, "SQL clause")}
            >
              SQL
            </button>
            </Tooltip>
          </div>

          <pre
            tabIndex={0}
            className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-all bg-[var(--workspace-panel)] px-2.5 py-2 font-mono leading-relaxed text-[var(--workspace-text)] outline-none"
            style={{ fontSize }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "a") {
                e.preventDefault();
                const range = document.createRange();
                range.selectNodeContents(e.currentTarget);
                const selection = window.getSelection();
                selection?.removeAllRanges();
                selection?.addRange(range);
              }
            }}
          >
            {formatted || (
              <span className="text-[var(--workspace-text-muted)]">
                {left.trim() || right.trim() ? (
                  "No items in this bucket."
                ) : (
                  <>
                    Paste lists on the left and right.{" "}
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() => {
                        onLeftChange("apple\nbanana\ncherry\ndate\nelderberry");
                        onRightChange("banana\ncherry\nfig\ngrape\napple");
                        setActiveBucket("common");
                        setLeftSnapshot(null);
                        setRightSnapshot(null);
                        setLeftSort("none");
                        setRightSort("none");
                        flashMsg("Sample loaded");
                      }}
                    >
                      Load sample
                    </button>
                  </>
                )}
              </span>
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
