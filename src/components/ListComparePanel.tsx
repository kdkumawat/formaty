"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  ArrowsRightLeftIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import {
  BUCKET_LABELS,
  DEFAULT_LIST_PARSE_OPTIONS,
  LIST_EXPORT_FORMATS,
  compareLists,
  formatListItems,
  formatSqlInClause,
  getBucketItems,
  listExportFormatLabel,
  sortListText,
  type ListBucket,
  type ListDelimiter,
  type ListExportFormat,
  type ListParseOptions,
  type ListSortMode,
} from "@/lib/json/listCompare";

interface ListComparePanelProps {
  left: string;
  right: string;
  onLeftChange: (value: string) => void;
  onRightChange: (value: string) => void;
  linkBtnClass: string;
  panelClass: string;
  isDark?: boolean;
  /** Optional slot for mode switcher / exit (keeps chrome to one bar). */
  leadingControls?: ReactNode;
  trailingControls?: ReactNode;
}

const BUCKETS: ListBucket[] = [
  "common",
  "leftOnly",
  "rightOnly",
  "union",
  "symmetric",
  "leftDupes",
  "rightDupes",
];

const DELIMITERS: { id: ListDelimiter; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "newline", label: "Newline" },
  { id: "comma", label: "Comma" },
  { id: "semicolon", label: "Semicolon" },
  { id: "pipe", label: "Pipe" },
  { id: "whitespace", label: "Whitespace" },
  { id: "json", label: "JSON array" },
];

const SORT_MODES: { id: ListSortMode; label: string }[] = [
  { id: "none", label: "Original" },
  { id: "asc", label: "A → Z" },
  { id: "desc", label: "Z → A" },
  { id: "numeric-asc", label: "Num ↑" },
  { id: "numeric-desc", label: "Num ↓" },
  { id: "frequency", label: "Freq" },
];

const QUICK_EXPORTS: { id: ListExportFormat; label: string }[] = [
  { id: "sql-in-single", label: "SQL '" },
  { id: "sql-in-double", label: 'SQL "' },
  { id: "sql-in-unquoted", label: "SQL #" },
  { id: "json-array", label: "JSON" },
  { id: "newline", label: "Lines" },
  { id: "comma-space", label: "CSV" },
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
}: ListComparePanelProps) {
  const [options, setOptions] = useState<ListParseOptions>(DEFAULT_LIST_PARSE_OPTIONS);
  /** Sort applied to result export. */
  const [sortMode, setSortMode] = useState<ListSortMode>("asc");
  /** Preferred sort when sorting left/right pane contents. */
  const [sideSortMode, setSideSortMode] = useState<ListSortMode>("asc");
  const [activeBucket, setActiveBucket] = useState<ListBucket>("common");
  const [exportFormat, setExportFormat] = useState<ListExportFormat>("sql-in-single");
  const [sqlColumn, setSqlColumn] = useState("id");
  const [sqlNotIn, setSqlNotIn] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [optsOpen, setOptsOpen] = useState(false);

  const result = useMemo(() => compareLists(left, right, options), [left, right, options]);
  const bucketItems = useMemo(
    () => getBucketItems(result, activeBucket),
    [result, activeBucket],
  );
  const formatted = useMemo(
    () => formatListItems(bucketItems, exportFormat, sortMode),
    [bucketItems, exportFormat, sortMode],
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
        sortMode,
        notIn: sqlNotIn,
      }),
    [bucketItems, sqlColumn, exportFormat, sortMode, sqlNotIn],
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

  const downloadText = useCallback(
    (text: string, filename: string) => {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      flashMsg("Downloaded");
    },
    [flashMsg],
  );

  const swap = () => {
    onLeftChange(right);
    onRightChange(left);
    flashMsg("Swapped");
  };

  const clearSide = (side: "left" | "right" | "both") => {
    if (side === "left" || side === "both") onLeftChange("");
    if (side === "right" || side === "both") onRightChange("");
    flashMsg(side === "both" ? "Cleared" : `Cleared ${side}`);
  };

  const sortSide = (side: "left" | "right" | "both", mode: ListSortMode = sideSortMode) => {
    if (mode === "none") {
      flashMsg("Pick a sort order");
      return;
    }
    if (side === "left" || side === "both") {
      if (left.trim()) onLeftChange(sortListText(left, options, mode));
    }
    if (side === "right" || side === "both") {
      if (right.trim()) onRightChange(sortListText(right, options, mode));
    }
    flashMsg(
      side === "both"
        ? `Sorted both (${SORT_MODES.find((s) => s.id === mode)?.label ?? mode})`
        : `Sorted ${side}`,
    );
  };

  const pasteInto = async (side: "left" | "right") => {
    try {
      const text = await navigator.clipboard.readText();
      if (side === "left") onLeftChange(text);
      else onRightChange(text);
      flashMsg(`Pasted ${side}`);
    } catch {
      flashMsg("Paste failed");
    }
  };

  const setOpt = <K extends keyof ListParseOptions>(key: K, value: ListParseOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
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
    if (b === "leftDupes" || b === "rightDupes") return "text-amber-700 dark:text-amber-400 bg-amber-500/10";
    return "text-[var(--workspace-text-muted)] bg-[var(--workspace-background)]";
  };

  const activeOptCount = [
    options.trim,
    options.ignoreEmpty,
    options.caseInsensitive,
    options.stripQuotes,
    options.numericNormalize,
  ].filter(Boolean).length;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {/* Single compact toolbar */}
      <div className={`flex shrink-0 flex-wrap items-center gap-1 border-b px-1.5 py-0.5 ${panelClass}`}>
        {leadingControls}

        <select
          className="h-6 max-w-[6.5rem] rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1 text-[11px] text-[var(--workspace-text)]"
          value={options.delimiter}
          onChange={(e) => setOpt("delimiter", e.target.value as ListDelimiter)}
          title="Split delimiter"
        >
          {DELIMITERS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>

        <div className="relative">
          <button
            type="button"
            title="Parse options"
            className={`${linkBtnClass} h-6 min-h-6 gap-0.5 px-1.5 text-[10px] ${optsOpen || activeOptCount > 0 ? "text-primary !bg-primary/10" : ""}`}
            onClick={() => setOptsOpen((v) => !v)}
          >
            <Cog6ToothIcon className="h-3.5 w-3.5" />
            {activeOptCount > 0 && <span className="tabular-nums">{activeOptCount}</span>}
          </button>
          {optsOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Close options"
                onClick={() => setOptsOpen(false)}
              />
              <div
                className={`absolute left-0 top-full z-50 mt-1 w-48 rounded-xl border border-[var(--workspace-border)]/60 p-1.5 shadow-xl ${panelClass}`}
              >
                {(
                  [
                    ["trim", "Trim whitespace"],
                    ["ignoreEmpty", "Skip empty"],
                    ["caseInsensitive", "Ignore case"],
                    ["stripQuotes", "Strip quotes"],
                    ["numericNormalize", "Normalize numbers"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-[var(--workspace-text)] hover:bg-primary/5"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs checkbox-primary"
                      checked={options[key]}
                      onChange={(e) => setOpt(key, e.target.checked)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <select
          className="h-6 max-w-[5.5rem] rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1 text-[11px] text-[var(--workspace-text)]"
          value={sideSortMode}
          onChange={(e) => {
            const m = e.target.value as ListSortMode;
            setSideSortMode(m);
            setSortMode(m === "none" ? "asc" : m);
          }}
          title="Sort order for left/right lists and result"
        >
          {SORT_MODES.filter((s) => s.id !== "none").map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          title="Sort both left and right lists"
          className={`${linkBtnClass} h-6 min-h-6 px-1.5 text-[10px]`}
          onClick={() => sortSide("both")}
          disabled={!left.trim() && !right.trim()}
        >
          Sort both
        </button>

        <button type="button" title="Swap sides" className={`${linkBtnClass} btn-square h-6 min-h-6 w-6`} onClick={swap}>
          <ArrowsRightLeftIcon className="h-3.5 w-3.5" />
        </button>
        <button type="button" title="Clear both" className={`${linkBtnClass} btn-square h-6 min-h-6 w-6`} onClick={() => clearSide("both")}>
          <ArrowPathIcon className="h-3.5 w-3.5" />
        </button>

        <div className="mx-0.5 h-3.5 w-px shrink-0 bg-[var(--workspace-border)]" />

        {/* Bucket chips (primary navigation) */}
        {BUCKETS.map((b) => {
          const n = bucketCount(b);
          if (n === 0 && (b === "leftDupes" || b === "rightDupes" || b === "symmetric")) return null;
          const short =
            b === "leftOnly"
              ? "Left"
              : b === "rightOnly"
                ? "Right"
                : b === "symmetric"
                  ? "Δ"
                  : b === "leftDupes"
                    ? "L dup"
                    : b === "rightDupes"
                      ? "R dup"
                      : BUCKET_LABELS[b];
          return (
            <button
              key={b}
              type="button"
              onClick={() => setActiveBucket(b)}
              title={BUCKET_LABELS[b]}
              className={`h-6 rounded-md px-1.5 text-[10px] font-semibold tabular-nums transition-colors ${
                activeBucket === b
                  ? "ring-1 ring-primary/40 " + bucketColor(b)
                  : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)]"
              }`}
            >
              {short} {n}
            </button>
          );
        })}

        <span className="hidden sm:inline text-[10px] tabular-nums text-[var(--workspace-text-muted)]">
          L {result.left.uniqueCount} · R {result.right.uniqueCount}
        </span>

        {flash && <span className="text-[10px] font-medium text-primary">{flash}</span>}
        <span className="flex-1" />
        {trailingControls}
      </div>

      {/* Main: inputs + result */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-[var(--workspace-border)] lg:border-b-0 lg:border-r sm:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-[var(--workspace-border)] sm:border-b-0 sm:border-r">
            <div className={`flex h-6 shrink-0 items-center gap-1 border-b px-1.5 ${panelClass}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span className="text-[10px] font-medium text-[var(--workspace-text-muted)]">Left</span>
              <span className="ml-auto flex items-center gap-0.5">
                <button
                  type="button"
                  className={`${linkBtnClass} h-5 min-h-5 px-1 text-[10px]`}
                  title={`Sort left (${SORT_MODES.find((s) => s.id === sideSortMode)?.label ?? ""})`}
                  onClick={() => sortSide("left")}
                  disabled={!left.trim()}
                >
                  Sort
                </button>
                <button type="button" className={`${linkBtnClass} h-5 min-h-5 px-1 text-[10px]`} onClick={() => void pasteInto("left")}>
                  Paste
                </button>
                <button type="button" className={`${linkBtnClass} h-5 min-h-5 px-1 text-[10px]`} onClick={() => clearSide("left")}>
                  Clear
                </button>
              </span>
            </div>
            <textarea
              value={left}
              onChange={(e) => onLeftChange(e.target.value)}
              placeholder={"Paste list…\none per line, CSV, or JSON array"}
              spellCheck={false}
              className="min-h-[80px] flex-1 resize-none bg-[var(--workspace-background)] px-2 py-1.5 font-mono text-[12px] leading-relaxed text-[var(--workspace-text)] outline-none placeholder:text-[var(--workspace-text-muted)]/50"
            />
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className={`flex h-6 shrink-0 items-center gap-1 border-b px-1.5 ${panelClass}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              <span className="text-[10px] font-medium text-[var(--workspace-text-muted)]">Right</span>
              <span className="ml-auto flex items-center gap-0.5">
                <button
                  type="button"
                  className={`${linkBtnClass} h-5 min-h-5 px-1 text-[10px]`}
                  title={`Sort right (${SORT_MODES.find((s) => s.id === sideSortMode)?.label ?? ""})`}
                  onClick={() => sortSide("right")}
                  disabled={!right.trim()}
                >
                  Sort
                </button>
                <button type="button" className={`${linkBtnClass} h-5 min-h-5 px-1 text-[10px]`} onClick={() => void pasteInto("right")}>
                  Paste
                </button>
                <button type="button" className={`${linkBtnClass} h-5 min-h-5 px-1 text-[10px]`} onClick={() => clearSide("right")}>
                  Clear
                </button>
              </span>
            </div>
            <textarea
              value={right}
              onChange={(e) => onRightChange(e.target.value)}
              placeholder={"Second list…"}
              spellCheck={false}
              className="min-h-[80px] flex-1 resize-none bg-[var(--workspace-background)] px-2 py-1.5 font-mono text-[12px] leading-relaxed text-[var(--workspace-text)] outline-none placeholder:text-[var(--workspace-text-muted)]/50"
            />
          </div>
        </div>

        {/* Result */}
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col lg:max-w-[46%]">
          <div className={`flex h-6 shrink-0 flex-wrap items-center gap-1 border-b px-1.5 ${panelClass}`}>
            <span className={`rounded px-1 py-px text-[10px] font-bold ${bucketColor(activeBucket)}`}>
              {BUCKET_LABELS[activeBucket]} {bucketItems.length}
            </span>
            <select
              className="h-5 max-w-[4.5rem] rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1 text-[10px] text-[var(--workspace-text)]"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as ListSortMode)}
              title="Sort result export"
            >
              {SORT_MODES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              className="h-5 max-w-[9rem] rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1 text-[10px] text-[var(--workspace-text)]"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ListExportFormat)}
              title="Export format"
            >
              {LIST_EXPORT_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {listExportFormatLabel(f)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`${linkBtnClass} h-5 min-h-5 gap-0.5 px-1 text-[10px]`}
              title="Copy"
              onClick={() => void copyText(formatted, BUCKET_LABELS[activeBucket])}
              disabled={!formatted}
            >
              <ClipboardDocumentIcon className="h-3 w-3" />
              Copy
            </button>
            <button
              type="button"
              className={`${linkBtnClass} btn-square h-5 min-h-5 w-5`}
              title="Download"
              onClick={() => downloadText(formatted, `formaty-list-${activeBucket}.txt`)}
              disabled={!formatted}
            >
              <ArrowDownTrayIcon className="h-3 w-3" />
            </button>
            <div className="mx-0.5 h-3 w-px bg-[var(--workspace-border)]" />
            {QUICK_EXPORTS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`${linkBtnClass} h-5 min-h-5 px-1 text-[10px] ${exportFormat === f.id ? "text-primary !bg-primary/10" : ""}`}
                onClick={() => {
                  setExportFormat(f.id);
                  void copyText(formatListItems(bucketItems, f.id, sortMode), f.label);
                }}
                disabled={bucketItems.length === 0}
              >
                {f.label}
              </button>
            ))}
            <label className="ml-0.5 flex items-center gap-0.5 text-[10px] text-[var(--workspace-text-muted)]">
              <input
                type="text"
                value={sqlColumn}
                onChange={(e) => setSqlColumn(e.target.value)}
                className="h-5 w-12 rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1 font-mono text-[10px] text-[var(--workspace-text)]"
                title="SQL column name"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-0.5 text-[10px] text-[var(--workspace-text-muted)]" title="NOT IN">
              <input
                type="checkbox"
                className="checkbox checkbox-xs"
                checked={sqlNotIn}
                onChange={(e) => setSqlNotIn(e.target.checked)}
              />
              ¬
            </label>
            <button
              type="button"
              className={`${linkBtnClass} h-5 min-h-5 px-1 text-[10px] font-semibold text-primary`}
              title="Copy column IN (...)"
              disabled={bucketItems.length === 0}
              onClick={() => void copyText(sqlClause, "SQL clause")}
            >
              SQL clause
            </button>
          </div>

          <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-all bg-[var(--workspace-background)] px-2 py-1.5 font-mono text-[12px] leading-relaxed text-[var(--workspace-text)]">
            {formatted || (
              <span className="text-[var(--workspace-text-muted)]">
                {left.trim() || right.trim()
                  ? "No items in this bucket."
                  : (
                    <>
                      Paste lists left &amp; right.{" "}
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline"
                        onClick={() => {
                          onLeftChange("apple\nbanana\ncherry\ndate\nelderberry");
                          onRightChange("banana\ncherry\nfig\ngrape\napple");
                          setActiveBucket("common");
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
