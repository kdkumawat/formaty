"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { CopyMinus } from "lucide-react";
import { Button, EmptyState, IconButton } from "@/components/kit";
import { ListEditor } from "@/components/compare/ListEditor";
import { orderIds, uuidLists } from "@/components/compare/samples";
import {
  InputFooter,
  ListPaneHeader,
  ResultView,
  SplitBySelect,
  SplitHandle,
  ResultTabs,
  inputPaneClass,
  resultPaneClass,
  splitRowClass,
  splitStyle,
  useExportFormat,
} from "@/components/compare/shared";
import { toast } from "@/components/Toast";
import {
  DEFAULT_LIST_PARSE_OPTIONS,
  analyzeSingleList,
  cleanListInput,
  formatListItems,
  listExportExtension,
  needsListTidy,
  sortListItems,
  type ListParseOptions,
  type ListSortMode,
} from "@/lib/json/listCompare";
import type { ListCompareExport } from "@/components/ListComparePanel";

type SingleTile = "distinct" | "once" | "repeated";

interface SingleListPanelProps {
  value: string;
  onChange: (value: string) => void;
  isDark?: boolean;
  toolbarHost?: HTMLElement | null;
  onExportChange?: (exportInfo: ListCompareExport | null) => void;
  fontSize?: number;
  options?: ListParseOptions;
  /** Changes this tab's parse options (the Split by select lives next to the input). */
  onOptionsChange?: (fn: (prev: ListParseOptions) => ListParseOptions) => void;
  /** Reports the parsed item count for the status bar. */
  onCountChange?: (count: number) => void;
  /** Input pane width in percent (shared with the Transform split). */
  split?: number;
  /** Starts a drag of the divider between input and result. */
  onResizeStart?: () => void;
  /** Moves the divider by this many percent (arrow keys on the focused divider). */
  onNudgeSplit?: (delta: number) => void;
  /** Custom user label for the single list pane. */
  listLabel?: string;
  /** Trigger the inline rename editor for the list header. */
  onStartListRename?: (side: "left" | "right" | "list", el: HTMLElement | null) => void;
}

const TILE_STORAGE_KEY = "formaty-single-tile";

const SAMPLES: Array<{ id: string; label: string; text: string }> = [
  {
    id: "orders",
    label: "1,000 order numbers",
    get text() {
      return orderIds().join("\n");
    },
  },
  {
    id: "uuids",
    label: "UUIDs with repeats",
    get text() {
      return uuidLists().a.join("\n");
    },
  },
  {
    id: "ids",
    label: "IDs with repeats",
    text: "user_1001\nuser_1002\nuser_1003\nuser_1002\nuser_1004\nuser_1005\nuser_1003\nuser_1006\nuser_1002",
  },
  {
    id: "emails",
    label: "Comma separated emails",
    text: "Ada@example.com, bob@example.com, Carol@example.com, bob@example.com, Dave@example.com, Erin@Example.com",
  },
  { id: "sql", label: "Quoted SQL values", text: "'ny', 'la', 'sf', 'la', 'chi', 'sea'" },
];

/** Remembered tile. Older builds stored "order", "az" and "repeated". */
function loadStored(): { tile: SingleTile; sort: ListSortMode } {
  try {
    const raw = localStorage.getItem(TILE_STORAGE_KEY);
    if (raw === "distinct" || raw === "once" || raw === "repeated") return { tile: raw, sort: "none" };
    if (raw === "az") return { tile: "distinct", sort: "asc" };
    if (raw === "order") return { tile: "distinct", sort: "none" };
  } catch {
    /* ignore */
  }
  return { tile: "distinct", sort: "none" };
}

export function SingleListPanel({
  value,
  onChange,
  onExportChange,
  fontSize = 14,
  isDark,
  options,
  onOptionsChange,
  onCountChange,
  split = 38,
  onResizeStart,
  onNudgeSplit,
  listLabel,
  onStartListRename,
}: SingleListPanelProps) {
  const effectiveOptions = options ?? DEFAULT_LIST_PARSE_OPTIONS;
  const [initial] = useState(() => (value.trim() ? loadStored() : { tile: "distinct" as SingleTile, sort: "none" as ListSortMode }));
  const [tile, setTile] = useState<SingleTile>(initial.tile);
  const [sort, setSort] = useState<ListSortMode>(initial.sort);
  const [exportFormat, setExportFormat] = useExportFormat("formaty-single-export-format");
  useEffect(() => {
    try {
      localStorage.setItem(TILE_STORAGE_KEY, tile);
    } catch {
      /* ignore */
    }
  }, [tile]);
  // An empty list (new tab, Clear) starts over on Distinct.
  const empty = !value.trim();
  useEffect(() => {
    if (empty) {
      setTile("distinct");
      setSort("none");
    }
  }, [empty]);

  // Large pastes: compute from deferred text so typing stays responsive.
  const dValue = useDeferredValue(value);
  const analysis = useMemo(() => analyzeSingleList(dValue, effectiveOptions), [dValue, effectiveOptions]);
  const canTidy = useMemo(() => needsListTidy(dValue), [dValue]);
  const items = tile === "repeated" ? analysis.duplicates : tile === "once" ? analysis.once : analysis.unique;
  const sorted = useMemo(() => sortListItems(items, sort), [items, sort]);

  useEffect(() => onCountChange?.(analysis.rawCount), [analysis.rawCount, onCountChange]);

  // Parent Copy/Download read the full result on demand, never on every keystroke.
  useEffect(() => {
    if (!onExportChange) return;
    if (!sorted.length) {
      onExportChange(null);
      return;
    }
    onExportChange({
      get text() {
        return formatListItems(sorted, exportFormat);
      },
      get items() {
        return sorted.map((i) => i.value);
      },
      filename: `formaty-single-${tile}.${listExportExtension(exportFormat)}`,
      bucket: tile === "repeated" ? "leftDupes" : "common",
      count: sorted.length,
    });
  }, [sorted, exportFormat, tile, onExportChange]);
  useEffect(() => () => onExportChange?.(null), [onExportChange]);

  const removeRepeats = () => {
    onChange(analysis.unique.map((i) => i.value).join("\n"));
    // The list is now one item per line; a comma, pipe or JSON rule would misread it.
    if (effectiveOptions.delimiter !== "auto") onOptionsChange?.((p) => ({ ...p, delimiter: "newline" }));
    toast({ message: `Removed repeats: ${analysis.rawCount} items to ${analysis.uniqueCount} distinct`, type: "success" });
  };

  const loadSample = (id: string) => {
    const s = SAMPLES.find((x) => x.id === id);
    if (!s) return;
    onChange(s.text);
    onOptionsChange?.((p) => (p.delimiter === "auto" ? p : { ...p, delimiter: "auto" }));
    setTile("distinct");
    setSort("none");
  };

  const name = listLabel ?? "List";
  const emptyTitle = tile === "repeated" ? "Nothing repeats in this list" : tile === "once" ? "Nothing appears just once" : "No items";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className={splitRowClass}>
        <section
          aria-label={name}
          className={`min-h-[200px] ${inputPaneClass}`}
          style={splitStyle(split)}
        >
          <ListPaneHeader
            dot="bg-brand"
            name={name}
            count={analysis.rawCount}
            onRename={(el) => onStartListRename?.("list", el)}
            samples={SAMPLES}
            onSample={loadSample}
            onTidy={() => onChange(cleanListInput(value))}
            canTidy={canTidy}
            onClear={() => onChange("")}
            canClear={!!value}
          />
          <div className="flex min-h-0 flex-1 flex-col">
            <ListEditor
              value={value}
              onChange={onChange}
              onPaste={(text) => {
                if (!effectiveOptions.autoClean) return;
                const cleaned = cleanListInput(text);
                if (text && cleaned !== text) onChange(cleaned);
              }}
              ariaLabel={`Content of ${name}`}
              placeholder="Paste your list"
              hint="Paste one item per line, or comma separated"
              fontSize={fontSize}
              isDark={isDark}
            />
          </div>
          <InputFooter>
            <SplitBySelect
              value={effectiveOptions.delimiter}
              onChange={(delimiter) => onOptionsChange?.((p) => ({ ...p, delimiter }))}
              texts={[dValue]}
            />
            {analysis.duplicateKeys > 0 && (
              <IconButton label="Remove repeats" className="ml-auto" onClick={removeRepeats}>
                <CopyMinus />
              </IconButton>
            )}
          </InputFooter>
        </section>
        <SplitHandle onResizeStart={onResizeStart} onNudge={onNudgeSplit} value={split} />

        <section aria-label="Result" className={resultPaneClass}>
          {empty ? (
            <div className="flex min-h-[240px] flex-1 items-center justify-center">
              <EmptyState
                title="Find repeats in a list"
                description="Paste a list into the input. You get the distinct items, the ones that appear once and the ones that repeat, ready to copy as SQL, JSON or CSV."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    {SAMPLES.map((s) => (
                      <Button key={s.id} variant="secondary" onClick={() => loadSample(s.id)}>
                        {s.label}
                      </Button>
                    ))}
                  </div>
                }
              />
            </div>
          ) : (
            <>
              <ResultView
                tabs={
                  <ResultTabs
                    value={tile}
                    onChange={(v) => setTile(v)}
                    tabs={[
                      { value: "distinct", label: "Distinct", count: analysis.uniqueCount },
                      { value: "once", label: "Appear once", count: analysis.onceCount },
                      { value: "repeated", label: "Repeated", count: analysis.duplicateKeys },
                    ]}
                  />
                }
                info={`${sorted.length.toLocaleString()} of ${analysis.rawCount.toLocaleString()} values · ${analysis.uniqueCount.toLocaleString()} distinct`}
                items={sorted}
                format={exportFormat}
                onFormat={setExportFormat}
                sort={sort}
                onSort={setSort}
                fileBase={`formaty-single-${tile}`}
                showCounts
                emptyTitle={emptyTitle}
                empty={undefined}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
