"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BarsArrowDownIcon,
  BarsArrowUpIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  SparklesIcon,
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
  DEFAULT_LIST_PARSE_OPTIONS,
  LIST_EXPORT_FORMATS,
  analyzeSingleList,
  cleanListInput,
  formatListItems,
  listExportFormatLabel,
  sortListItems,
  sortListText,
  type ListExportFormat,
  type ListItem,
  type ListParseOptions,
  type ListSortMode,
} from "@/lib/json/listCompare";
import type { ListCompareExport } from "@/components/ListComparePanel";

type SingleView = "unique" | "duplicates" | "counts";

interface SingleListPanelProps {
  value: string;
  onChange: (value: string) => void;
  linkBtnClass: string;
  panelClass: string;
  isDark?: boolean;
  toolbarHost?: HTMLElement | null;
  onExportChange?: (exportInfo: ListCompareExport | null) => void;
  fontSize?: number;
  options?: ListParseOptions;
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

const VIEW_LABELS: Record<SingleView, string> = {
  unique: "Unique",
  duplicates: "Duplicates",
  counts: "Counts",
};

export function SingleListPanel({
  value,
  onChange,
  linkBtnClass,
  panelClass,
  toolbarHost = null,
  onExportChange,
  fontSize = 13,
  options,
}: SingleListPanelProps) {
  const effectiveOptions = options ?? DEFAULT_LIST_PARSE_OPTIONS;
  const [view, setView] = useState<SingleView>("unique");
  const [sortMode, setSortMode] = useState<"none" | "asc" | "desc">("none");
  const [exportOpen, setExportOpen] = useState(false);
  const [inputSnapshot, setInputSnapshot] = useState<string | null>(null);
  const [display, setDisplay] = useState<"inline" | "table">("inline");
  const doClean = () => {
    onChange(cleanListInput(value));
    setInputSnapshot(null);
    setSortMode("none");
    toast({ message: "Cleaned", type: "success" });
  };

  // Preserve the selected export format across sessions (localStorage).
  const [exportFormat, setExportFormat] = useState<ListExportFormat | null>(() => {
    try {
      const raw = localStorage.getItem("formaty-single-export-format");
      if (!raw || raw === "none") return null;
      if (raw && (LIST_EXPORT_FORMATS as string[]).includes(raw)) return raw as ListExportFormat;
    } catch {
      /* ignore */
    }
    return "comma-space";
  });
  useEffect(() => {
    try {
      localStorage.setItem("formaty-single-export-format", exportFormat ?? "none");
    } catch {
      /* ignore */
    }
  }, [exportFormat]);

  const analysis = useMemo(() => analyzeSingleList(value, effectiveOptions), [value, effectiveOptions]);

  const items = useMemo(() => {
    if (view === "duplicates") return analysis.duplicates;
    if (view === "counts") return analysis.counts;
    return analysis.unique;
  }, [view, analysis]);

  const resolvedSort: ListSortMode = view === "counts" ? "frequency" : sortMode;

  const sorted = useMemo(() => sortListItems(items, resolvedSort), [items, resolvedSort]);

  const formatted = useMemo(
    () =>
      exportFormat === null
        ? sorted.map((i) => i.value).join("\n")
        : formatListItems(sorted, exportFormat, resolvedSort),
    [sorted, exportFormat, resolvedSort],
  );

  useEffect(() => {
    if (!onExportChange) return;
    if (!formatted) {
      onExportChange(null);
      return;
    }
    onExportChange({
      text: formatted,
      items: sorted.map((i) => i.value),
      filename: `formaty-single-${view}.txt`,
      bucket: view === "duplicates" ? "leftDupes" : "common",
      count: sorted.length,
    });
  }, [formatted, view, sorted, onExportChange]);

  useEffect(() => {
    return () => {
      onExportChange?.(null);
    };
  }, [onExportChange]);

  const dedupe = () => {
    const unique = analysis.unique.map((i) => i.value).join("\n");
    onChange(unique);
    setInputSnapshot(null);
    setSortMode("none");
    toast({ message: `Deduped: ${analysis.rawCount} → ${analysis.uniqueCount} items`, type: "success" });
  };

  /** Single icon cycles none → asc → desc → none; input is restored on reset. */
  const cycleSort = () => {
    const next: "none" | "asc" | "desc" =
      sortMode === "none" ? "asc" : sortMode === "asc" ? "desc" : "none";
    if (next === "none") {
      if (inputSnapshot !== null) {
        onChange(inputSnapshot);
        setInputSnapshot(null);
      }
      setSortMode("none");
      toast({ message: "Sort reset", type: "info" });
      return;
    }
    if (inputSnapshot === null) setInputSnapshot(value);
    const base = inputSnapshot ?? value;
    onChange(sortListText(base, effectiveOptions, next));
    setSortMode(next);
    toast({ message: next === "asc" ? "Sorted A → Z" : "Sorted Z → A", type: "success" });
  };

  const menuItem = (active: boolean) =>
    `${sharedMenuItemClass} ${active ? sharedMenuItemActiveClass : ""}`;

  /** Same select-trigger look as the workspace Format / View / Actions dropdowns. */
  const selectTrigger =
    "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-muted px-2 text-[11px] font-medium text-[var(--workspace-text)] transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40";

  const toolbarBody = (
    <>
      <div className="mx-0.5 h-4 w-px shrink-0 bg-[var(--workspace-border)]" aria-hidden />
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

  const rowClass = (item: ListItem) =>
    item.count > 1
      ? "text-amber-700 dark:text-amber-400"
      : "text-[var(--workspace-text)]";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {toolbarNode}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-[var(--workspace-border)] lg:border-b-0 lg:border-r">
          <div className={paneHeader}>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
            <span className="text-[11px] font-semibold text-[var(--workspace-text)]">List</span>
            <span className="truncate text-[10px] tabular-nums text-[var(--workspace-text-muted)]">
              {analysis.rawCount} items · {analysis.uniqueCount} unique
              {analysis.duplicateKeys > 0 ? ` · ${analysis.duplicateKeys} dup` : ""}
            </span>
            <span className="ml-auto flex items-center gap-1">
              <Tooltip content="Clean: strip quotes, collapse whitespace, one per line" className="shrink-0">
              <button
                type="button"
                onClick={doClean}
                disabled={!value.trim()}
                className={`${linkBtnClass} h-6 min-h-6 px-1.5 text-[10px] font-semibold`}
              >
                <SparklesIcon className="h-3 w-3" />
                <span className="hidden sm:inline">Clean</span>
              </button>
              </Tooltip>
              <Tooltip content="Remove duplicates, keep first occurrence" className="shrink-0">
              <button
                type="button"
                onClick={dedupe}
                disabled={analysis.uniqueCount === 0}
                className={`${linkBtnClass} h-6 min-h-6 px-1.5 text-[10px] font-semibold`}
              >
                <BarsArrowDownIcon className="h-3 w-3" />
                <span className="hidden sm:inline">Dedupe</span>
              </button>
              </Tooltip>
              <CycleSortButton
                linkBtnClass={linkBtnClass}
                mode={sortMode}
                disabled={analysis.uniqueCount === 0}
                onCycle={cycleSort}
                titlePrefix="Sort"
              />
            </span>
          </div>
          <textarea
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setInputSnapshot(null);
              setSortMode("none");
            }}
            placeholder={"Paste a list…\none per line, CSV, or JSON array"}
            spellCheck={false}
            className={editorClass}
            style={{ fontSize }}
          />
        </div>

        {/* Result */}
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col border-l border-[var(--workspace-border)] lg:max-w-[42%]">
          <div className={`${paneHeader} gap-1`}>
            <div className="flex h-7 shrink-0 overflow-hidden rounded-md bg-muted">
              {(Object.keys(VIEW_LABELS) as SingleView[]).map((v, i) => (
                <Tooltip key={v} content={VIEW_LABELS[v]}>
                <button
                  type="button"
                  className={`flex h-7 cursor-pointer items-center gap-1 whitespace-nowrap px-2.5 text-[11px] font-semibold transition-colors duration-150 ${
                    i > 0 ? "border-l border-[var(--workspace-border)]" : ""
                  } ${view === v ? "bg-primary/15 text-primary" : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-[var(--workspace-text)]"}`}
                  onClick={() => setView(v)}
                >
                  {VIEW_LABELS[v]}
                  <span className="tabular-nums opacity-75">
                    {v === "unique"
                      ? analysis.uniqueCount
                      : v === "duplicates"
                        ? analysis.duplicateKeys
                        : analysis.rawCount}
                  </span>
                </button>
                </Tooltip>
              ))}
            </div>

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

          <div
            className="min-h-0 flex-1 overflow-auto bg-[var(--workspace-panel)] px-2.5 py-2"
            style={{ fontSize }}
          >
            {sorted.length === 0 ? (
              <p className="font-mono text-[var(--workspace-text-muted)]">
                {value.trim() ? (
                  "No items."
                ) : (
                  <>
                    Paste a list on the left to analyze it.{" "}
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() => {
                        onChange("user_1001\nuser_1002\nuser_1003\nuser_1002\nuser_1004\nuser_1005\nuser_1003\nuser_1006");
                        setView("unique");
                        setSortMode("none");
                        setInputSnapshot(null);
                        toast({ message: "Sample loaded", type: "success" });
                      }}
                    >
                      Load sample
                    </button>
                  </>
                )}
              </p>
            ) : display === "inline" ? (
              <p className="whitespace-pre-wrap break-words font-mono leading-relaxed text-[var(--workspace-text)]">
                {formatted}
              </p>
            ) : (
              <table className="w-full border-collapse">
                <tbody>
                  {sorted.map((item, i) => (
                    <tr
                      key={`${item.key}-${i}`}
                      className={`border-b border-[var(--workspace-border)]/40 last:border-0 ${
                        i % 2 === 1 ? "bg-[var(--workspace-background)]" : ""
                      }`}
                    >
                      {view === "counts" ? (
                        <>
                          <td className={`py-0.5 pr-3 font-mono ${rowClass(item)}`}>{item.value}</td>
                          <td className="py-0.5 text-right font-mono tabular-nums text-[var(--workspace-text-muted)]">
                            ×{item.count}
                          </td>
                        </>
                      ) : (
                        <td className={`py-0.5 font-mono ${rowClass(item)}`}>
                          {item.value}
                          {view === "duplicates" ? (
                            <span className="ml-2 text-[10px] tabular-nums text-[var(--workspace-text-muted)]">
                              ×{item.count}
                            </span>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Single icon cycles none → asc → desc → none (table-style). */
function CycleSortButton({
  linkBtnClass,
  mode,
  disabled,
  onCycle,
  titlePrefix = "Sort",
}: {
  linkBtnClass: string;
  mode: "none" | "asc" | "desc";
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
