"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowsRightLeftIcon,
  ChartPieIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  SparklesIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { Dropdown } from "@/components/workspace/Dropdown";
import { Tooltip } from "@/components/workspace/Tooltip";
import { CycleSortButton, cycleSort } from "@/components/workspace/CycleSortButton";
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
  buildListSummary,
  cleanListInput,
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
  /** Currently selected bucket — controlled from the parent so share/restore can preserve it. */
  activeBucket?: ListBucket;
  /** Report the selected bucket up so share links can preserve it. */
  onActiveBucketChange?: (bucket: ListBucket) => void;
  /** Custom user labels for the Left and Right list panes. */
  leftLabel?: string;
  rightLabel?: string;
  /** Trigger the inline rename editor for a list-pane header. */
  onStartListRename?: (side: "left" | "right" | "list", el: HTMLElement | null) => void;
}

const PRIMARY_BUCKETS: ListBucket[] = ["common", "leftOnly", "rightOnly", "union", "symmetric", "changed"];
const DUPE_BUCKETS: ListBucket[] = ["leftDupes", "rightDupes"];
const ALL_BUCKETS: ListBucket[] = ["summary", ...PRIMARY_BUCKETS, ...DUPE_BUCKETS];

/** Persist the selected bucket/view across sessions (mirrors the export format key). */
const BUCKET_STORAGE_KEY = "formaty-list-bucket";
const DISPLAY_STORAGE_KEY = "formaty-list-display";
const RESULT_SORT_STORAGE_KEY = "formaty-list-result-sort";
const LEFT_SORT_STORAGE_KEY = "formaty-list-left-sort";
const RIGHT_SORT_STORAGE_KEY = "formaty-list-right-sort";

function loadStoredBucket(): ListBucket {
  try {
    const raw = localStorage.getItem(BUCKET_STORAGE_KEY);
    if (raw && (ALL_BUCKETS as string[]).includes(raw)) return raw as ListBucket;
  } catch {
    /* ignore */
  }
  return "common";
}

const LIST_SORT_VALUES: ListSortMode[] = ["none", "asc", "desc", "numeric-asc", "numeric-desc", "frequency"];

/** Load a persisted sort mode; falls back to `fallback` for missing/invalid values. */
function loadStoredSort(key: string, fallback: ListSortMode): ListSortMode {
  try {
    const raw = localStorage.getItem(key);
    if (raw && (LIST_SORT_VALUES as string[]).includes(raw)) return raw as ListSortMode;
  } catch {
    /* ignore */
  }
  return fallback;
}

/** Load the persisted inline/table display choice. */
function loadStoredDisplay(): "inline" | "table" {
  try {
    const raw = localStorage.getItem(DISPLAY_STORAGE_KEY);
    if (raw === "inline" || raw === "table") return raw;
  } catch {
    /* ignore */
  }
  return "inline";
}

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
  activeBucket: controlledActiveBucket,
  onActiveBucketChange,
  leftLabel,
  rightLabel,
  onStartListRename,
}: ListComparePanelProps) {
  const effectiveOptions = options ?? DEFAULT_LIST_PARSE_OPTIONS;
  const [resultSort, setResultSort] = useState<ListSortMode>(() =>
    loadStoredSort(RESULT_SORT_STORAGE_KEY, "asc"),
  );
  const [leftSort, setLeftSort] = useState<ListSortMode>(() =>
    loadStoredSort(LEFT_SORT_STORAGE_KEY, "none"),
  );
  const [rightSort, setRightSort] = useState<ListSortMode>(() =>
    loadStoredSort(RIGHT_SORT_STORAGE_KEY, "none"),
  );
  const [activeBucket, setActiveBucketState] = useState<ListBucket>(
    () => controlledActiveBucket ?? loadStoredBucket(),
  );
  /** If the parent passes a controlled value, mirror it back into local state. */
  useEffect(() => {
    if (controlledActiveBucket && controlledActiveBucket !== activeBucket) {
      setActiveBucketState(controlledActiveBucket);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledActiveBucket]);
  const setActiveBucket = useCallback(
    (b: ListBucket | ((prev: ListBucket) => ListBucket)) => {
      setActiveBucketState((prev) => {
        const next = typeof b === "function" ? (b as (p: ListBucket) => ListBucket)(prev) : b;
        return next;
      });
    },
    [],
  );
  /** Notify parent after commit, never during render. */
  useEffect(() => {
    onActiveBucketChange?.(activeBucket);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBucket]);
  /** Bucket shown before the last dup-link click - clicking again restores it. */
  const prevBucketRef = useRef<ListBucket>("common");
  /** Summary-view section collapse state — all open by default. */
  const [summaryCollapsed, setSummaryCollapsed] = useState<Set<ListBucket>>(() => new Set());
  const toggleSummarySection = (b: ListBucket) => {
    setSummaryCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });
  };

  const toggleDupBucket = (b: "leftDupes" | "rightDupes") => {
    if (activeBucket === b) {
      // Click again on the active dup link → restore the previous bucket.
      setActiveBucket(prevBucketRef.current);
      return;
    }
    prevBucketRef.current = activeBucket;
    setActiveBucket(b);
  };
  const [display, setDisplay] = useState<"inline" | "table">(loadStoredDisplay);

  const isSummary = activeBucket === "summary";

  // Preserve the selected bucket/view across sessions (localStorage).
  useEffect(() => {
    try {
      localStorage.setItem(BUCKET_STORAGE_KEY, activeBucket);
    } catch {
      /* ignore */
    }
  }, [activeBucket]);

  // Persist output options across sessions.
  useEffect(() => {
    try {
      localStorage.setItem(DISPLAY_STORAGE_KEY, display);
    } catch {
      /* ignore */
    }
  }, [display]);
  useEffect(() => {
    try {
      localStorage.setItem(RESULT_SORT_STORAGE_KEY, resultSort);
    } catch {
      /* ignore */
    }
  }, [resultSort]);
  useEffect(() => {
    try {
      localStorage.setItem(LEFT_SORT_STORAGE_KEY, leftSort);
    } catch {
      /* ignore */
    }
  }, [leftSort]);
  useEffect(() => {
    try {
      localStorage.setItem(RIGHT_SORT_STORAGE_KEY, rightSort);
    } catch {
      /* ignore */
    }
  }, [rightSort]);

  // Re-apply a persisted side-sort to the editor text once on mount so the
  // rendered output matches the restored sort state.
  const didRestoreSideSorts = useRef(false);
  useEffect(() => {
    if (didRestoreSideSorts.current) return;
    didRestoreSideSorts.current = true;
    if (leftSort !== "none" && left.trim()) {
      setLeftSnapshot(left);
      onLeftChange(sortListText(left, effectiveOptions, leftSort));
    }
    if (rightSort !== "none" && right.trim()) {
      setRightSnapshot(right);
      onRightChange(sortListText(right, effectiveOptions, rightSort));
    }
    // Intended to run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const [leftCleanSnapshot, setLeftCleanSnapshot] = useState<string | null>(null);
  const [rightCleanSnapshot, setRightCleanSnapshot] = useState<string | null>(null);
  const autoCleanEnabled = effectiveOptions.autoClean ?? true;
  const leftAutoCleanRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rightAutoCleanRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set true after a manual undo so the auto-clean effect ignores the very next
  // re-render of that side (it would otherwise re-clean what we just reverted).
  const undoGuardRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  // Per-side CSV detection: never auto-clean a side that already parses as CSV.
  const leftIsCsv = useMemo(() => detectCsvColumns(left) !== null, [left]);
  const rightIsCsv = useMemo(() => detectCsvColumns(right) !== null, [right]);
  useEffect(() => {
    if (!autoCleanEnabled || !left.trim()) {
      if (!left.trim() && leftCleanSnapshot) setLeftCleanSnapshot(null);
      return;
    }
    if (leftIsCsv) return;
    if (undoGuardRef.current.left) {
      undoGuardRef.current.left = false;
      return;
    }
    const cleaned = cleanListInput(left);
    if (cleaned === left || !cleaned) return;
    const needsClean = /[,[\]()]/.test(left) || /["'`]/.test(left) || /\s{2,}/.test(left);
    if (!needsClean) return;
    if (leftAutoCleanRef.current) clearTimeout(leftAutoCleanRef.current);
    leftAutoCleanRef.current = setTimeout(() => {
      setLeftCleanSnapshot(left);
      onLeftChange(cleaned);
      setLeftSnapshot(null);
      setLeftSort("none");
      toast({ message: "Left auto-cleaned", type: "info" });
    }, 450);
    return () => { if (leftAutoCleanRef.current) clearTimeout(leftAutoCleanRef.current); };
  }, [left, autoCleanEnabled, onLeftChange, leftIsCsv]);
  useEffect(() => {
    if (!autoCleanEnabled || !right.trim()) {
      if (!right.trim() && rightCleanSnapshot) setRightCleanSnapshot(null);
      return;
    }
    if (rightIsCsv) return;
    if (undoGuardRef.current.right) {
      undoGuardRef.current.right = false;
      return;
    }
    const cleaned = cleanListInput(right);
    if (cleaned === right || !cleaned) return;
    const needsClean = /[,[\]()]/.test(right) || /["'`]/.test(right) || /\s{2,}/.test(right);
    if (!needsClean) return;
    if (rightAutoCleanRef.current) clearTimeout(rightAutoCleanRef.current);
    rightAutoCleanRef.current = setTimeout(() => {
      setRightCleanSnapshot(right);
      onRightChange(cleaned);
      setRightSnapshot(null);
      setRightSort("none");
      toast({ message: "Right auto-cleaned", type: "info" });
    }, 450);
    return () => { if (rightAutoCleanRef.current) clearTimeout(rightAutoCleanRef.current); };
  }, [right, autoCleanEnabled, onRightChange, rightIsCsv]);
  const undoLeftClean = () => {
    if (leftCleanSnapshot !== null) {
      const prev = leftCleanSnapshot;
      setLeftCleanSnapshot(null);
      undoGuardRef.current.left = true;
      onLeftChange(prev);
      toast({ message: "Left reverted", type: "info" });
    }
  };
  const undoRightClean = () => {
    if (rightCleanSnapshot !== null) {
      const prev = rightCleanSnapshot;
      setRightCleanSnapshot(null);
      undoGuardRef.current.right = true;
      onRightChange(prev);
      toast({ message: "Right reverted", type: "info" });
    }
  };
  const cleanLeft = () => {
    const cleaned = cleanListInput(left);
    if (cleaned !== left) setLeftCleanSnapshot(left);
    else setLeftCleanSnapshot(null);
    onLeftChange(cleaned);
    setLeftSnapshot(null);
    setLeftSort("none");
    toast({ message: "Left cleaned", type: "success" });
  };
  const cleanRight = () => {
    const cleaned = cleanListInput(right);
    if (cleaned !== right) setRightCleanSnapshot(right);
    else setRightCleanSnapshot(null);
    onRightChange(cleaned);
    setRightSnapshot(null);
    setRightSort("none");
    toast({ message: "Right cleaned", type: "success" });
  };

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
  /** Summary report - built only while the Summary view is active. */
  const summary = useMemo(
    () =>
      isSummary
        ? buildListSummary(result, { includeChanged: !!csvColumn, showCountDeltas: true })
        : null,
    [isSummary, result, csvColumn],
  );
  const deltaByKey = useMemo(
    () => new Map(summary?.countDeltas.map((d) => [d.key, d]) ?? []),
    [summary],
  );
  const outputText = useMemo(() => {
    if (isSummary) return summary?.text ?? "";
    return exportFormat === null
      ? bucketItems.map((i) => i.value).join("\n")
      : formatListItems(bucketItems, exportFormat, resultSort);
  }, [bucketItems, exportFormat, resultSort, isSummary, summary]);

  type TableSortKey = "name" | "count";
  const [tableSort, setTableSort] = useState<{ key: TableSortKey; dir: "asc" | "desc" } | null>(null);
  const toggleTableSort = (key: TableSortKey) => {
    setTableSort((cur) =>
      cur?.key === key
        ? cur.dir === "asc"
          ? { key, dir: "desc" }
          : null
        : { key, dir: "asc" },
    );
  };
  /** Table view sorts items in-memory only - the inline view and exports are untouched. */
  const tableItems = useMemo(() => {
    if (!tableSort) return bucketItems;
    const copy = [...bucketItems];
    const dir = tableSort.dir === "asc" ? 1 : -1;
    copy.sort((a, b) =>
      tableSort.key === "count"
        ? dir * (a.count - b.count)
        : dir * a.value.localeCompare(b.value, undefined, { sensitivity: "base", numeric: true }),
    );
    return copy;
  }, [bucketItems, tableSort]);

  // Reset the table column sort when the bucket or source data changes.
  useEffect(() => {
    setTableSort(null);
  }, [activeBucket, left, right]);

  const sortIndicator = (key: TableSortKey) =>
    tableSort?.key === key ? (tableSort.dir === "asc" ? "▲" : "▼") : null;

  useEffect(() => {
    if (!onExportChange) return;
    if (!outputText) {
      onExportChange(null);
      return;
    }
    onExportChange({
      text: outputText,
      items: isSummary ? [] : bucketItems.map((i) => i.value),
      filename: isSummary ? "formaty-list-summary.txt" : `formaty-list-${activeBucket}.txt`,
      bucket: activeBucket,
      count: isSummary
        ? summary?.sections.reduce((n, s) => n + s.count, 0) ?? 0
        : bucketItems.length,
    });
  }, [outputText, activeBucket, bucketItems, onExportChange, isSummary, summary]);

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
    // Summary is a report view, never empty - exempts it from the auto-jump.
    if (b === "summary") return 1;
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
              <span
                className="cursor-text select-none rounded px-1 text-[11px] font-semibold text-[var(--workspace-text)] hover:bg-[var(--workspace-border)]/60"
                title="Double-click to rename"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onStartListRename?.("left", e.currentTarget);
                }}
              >
                {leftLabel ?? "Left"}
              </span>
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
                {leftCleanSnapshot !== null && (
                  <Tooltip content="Undo clean - revert left" className="shrink-0">
                    <button
                      type="button"
                      onClick={undoLeftClean}
                      className={`${linkBtnClass} h-6 min-h-6 px-1.5 text-[10px] font-semibold !bg-amber-500/10 !text-amber-700 dark:!text-amber-400`}
                    >
                      Undo
                    </button>
                  </Tooltip>
                )}
                <Tooltip content="Clean: strip quotes, collapse whitespace, one per line" className="shrink-0">
                <button
                  type="button"
                  onClick={cleanLeft}
                  disabled={!left.trim()}
                  className={`${linkBtnClass} h-6 min-h-6 px-1.5 text-[10px] font-semibold`}
                >
                  <SparklesIcon className="h-3 w-3" />
                  <span className="hidden sm:inline">Clean</span>
                </button>
                </Tooltip>
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
                if (leftCleanSnapshot !== null) {
                  const cleanedNext = cleanListInput(e.target.value);
                  if (cleanedNext === e.target.value) setLeftCleanSnapshot(null);
                }
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
              <span
                className="cursor-text select-none rounded px-1 text-[11px] font-semibold text-[var(--workspace-text)] hover:bg-[var(--workspace-border)]/60"
                title="Double-click to rename"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onStartListRename?.("right", e.currentTarget);
                }}
              >
                {rightLabel ?? "Right"}
              </span>
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
                {rightCleanSnapshot !== null && (
                  <Tooltip content="Undo clean - revert right" className="shrink-0">
                    <button
                      type="button"
                      onClick={undoRightClean}
                      className={`${linkBtnClass} h-6 min-h-6 px-1.5 text-[10px] font-semibold !bg-amber-500/10 !text-amber-700 dark:!text-amber-400`}
                    >
                      Undo
                    </button>
                  </Tooltip>
                )}
                <Tooltip content="Clean: strip quotes, collapse whitespace, one per line" className="shrink-0">
                <button
                  type="button"
                  onClick={cleanRight}
                  disabled={!right.trim()}
                  className={`${linkBtnClass} h-6 min-h-6 px-1.5 text-[10px] font-semibold`}
                >
                  <SparklesIcon className="h-3 w-3" />
                  <span className="hidden sm:inline">Clean</span>
                </button>
                </Tooltip>
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
                if (rightCleanSnapshot !== null) {
                  const cleanedNext = cleanListInput(e.target.value);
                  if (cleanedNext === e.target.value) setRightCleanSnapshot(null);
                }
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
                <Tooltip content="Select view or bucket">
                <button
                  type="button"
                  className={`${selectTrigger} ${bucketOpen ? "!bg-primary/12 !text-primary" : ""}`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${bucketDot(activeBucket)}`} />
                  {isSummary ? "Summary" : `${BUCKET_LABELS[activeBucket]} · ${bucketItems.length}`}
                  <ChevronDownIcon className="h-3 w-3 shrink-0 opacity-60" />
                </button>
                </Tooltip>
              }
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  className={menuItem(isSummary)}
                  onClick={() => {
                    setActiveBucket("summary");
                    setBucketOpen(false);
                  }}
                >
                  {sharedMenuCheck(isSummary)}
                  <ChartPieIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  <span className="min-w-0 flex-1 truncate text-left">Summary</span>
                </button>
                {sharedMenuSectionLabel("Buckets")}
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
              disabled={isSummary}
              onCycle={() => setResultSort((m) => cycleSort(m))}
              titlePrefix="Result sort"
            />

            <div className="flex h-7 shrink-0 overflow-hidden rounded-md bg-muted">
              <Tooltip content={isSummary ? "Inline view is disabled in Summary" : "Inline view - comma-separated"}>
              <button
                type="button"
                aria-label="Inline view"
                disabled={isSummary}
                className={`flex h-7 items-center justify-center px-2 text-[11px] disabled:cursor-not-allowed disabled:opacity-40 ${
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
              <Tooltip content={isSummary ? "Table view is disabled in Summary" : "Table view"}>
              <button
                type="button"
                aria-label="Table view"
                disabled={isSummary}
                className={`flex h-7 items-center justify-center px-2 text-[11px] disabled:cursor-not-allowed disabled:opacity-40 ${
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
                  <Tooltip content={display === "table" ? "Copy-as is disabled in table view" : isSummary ? "Copy-as is disabled in Summary view" : "Copy as… - updates the output (or use the Copy button)"} className="shrink-0">
                <button
                  type="button"
                  disabled={display === "table" || isSummary}
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

          {isSummary ? (
            <div className="min-h-0 flex-1 overflow-auto bg-[var(--workspace-panel)] px-3 py-2.5" style={{ fontSize }}>
              {left.trim() || right.trim() ? (
                <div className="flex flex-col gap-3.5">
                  {summary?.sections.map((section) => {
                    const collapsed = summaryCollapsed.has(section.bucket);
                    return (
                      <section key={section.bucket}>
                        <div className="group flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text)]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSummarySection(section.bucket);
                            }}
                            title={collapsed ? `Expand ${section.label}` : `Collapse ${section.label}`}
                            aria-label={collapsed ? `Expand ${section.label}` : `Collapse ${section.label}`}
                            className="flex h-4 w-4 items-center justify-center rounded text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-border)] hover:text-[var(--workspace-text)]"
                          >
                            {collapsed ? (
                              <ChevronRightIcon className="h-3 w-3" />
                            ) : (
                              <ChevronDownIcon className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveBucket(section.bucket)}
                            title={`Show ${section.label} items`}
                            className="flex flex-1 items-center gap-1.5 text-left transition-colors hover:text-primary"
                          >
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${bucketDot(section.bucket)}`} />
                            {section.label}
                            <span className="font-mono tabular-nums text-[var(--workspace-text-muted)]">
                              {section.count}
                            </span>
                            <span className="opacity-0 transition-opacity group-hover:opacity-100 text-[var(--workspace-text-muted)]">
                              →
                            </span>
                          </button>
                        </div>
                        {collapsed ? null : (
                          <div className="mt-1 flex flex-col gap-px border-l border-[var(--workspace-border)] pl-2.5">
                            {section.items.map((item) => {
                              const d = deltaByKey.get(item.key);
                              return (
                                <span
                                  key={item.key}
                                  className="whitespace-pre-wrap break-words font-mono leading-relaxed text-[var(--workspace-text)]"
                                >
                                  {item.value}
                                  {section.bucket === "common" && d ? (
                                    <span className="text-[var(--workspace-text-muted)]">
                                      {" "}×{d.left} left, ×{d.right} right
                                    </span>
                                  ) : null}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              ) : (
                <p className="font-mono text-[var(--workspace-text-muted)]">
                  Paste lists on the left and right.{" "}
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={loadSample}
                  >
                    Load sample
                  </button>
                </p>
              )}
            </div>
          ) : display === "inline" ? (
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
                  <thead>
                    <tr className="border-b border-[var(--workspace-border)] text-[10px] uppercase tracking-wide text-[var(--workspace-text-muted)]">
                      <th
                        aria-sort={tableSort?.key === "name" ? (tableSort.dir === "asc" ? "ascending" : "descending") : "none"}
                        className="py-1 pr-3 text-left font-semibold"
                      >
                        <button
                          type="button"
                          onClick={() => toggleTableSort("name")}
                          className={`inline-flex items-center gap-1 transition-colors hover:text-primary ${tableSort?.key === "name" ? "!text-primary" : ""}`}
                        >
                          Value
                          <span className="w-2 tabular-nums">{sortIndicator("name") ?? ""}</span>
                        </button>
                      </th>
                      <th
                        aria-sort={tableSort?.key === "count" ? (tableSort.dir === "asc" ? "ascending" : "descending") : "none"}
                        className="py-1 text-right font-semibold"
                      >
                        <button
                          type="button"
                          onClick={() => toggleTableSort("count")}
                          className={`inline-flex items-center gap-1 transition-colors hover:text-primary ${tableSort?.key === "count" ? "!text-primary" : ""}`}
                        >
                          Count
                          <span className="w-2 tabular-nums">{sortIndicator("count") ?? ""}</span>
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableItems.map((item, i) => (
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
