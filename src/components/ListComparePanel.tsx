"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/16/solid";
import { Button, EmptyState, Select } from "@/components/kit";
import { toast } from "@/components/Toast";
import { ListEditor } from "@/components/compare/ListEditor";
import { SummaryView } from "@/components/compare/SummaryView";
import { InputFooter, ListPaneHeader, ResultView, SplitBySelect, SplitHandle, Tile, TileRow, inputPaneClass, num, splitStyle, useExportFormat } from "@/components/compare/shared";
import {
  DEFAULT_LIST_PARSE_OPTIONS,
  buildListSummary,
  cleanListInput,
  compareLists,
  formatListItems,
  getBucketItems,
  listExportExtension,
  needsListTidy,
  sortListItems,
  type ListBucket,
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
  isDark?: boolean;
  toolbarHost?: HTMLElement | null;
  onExportChange?: (exportInfo: ListCompareExport | null) => void;
  fontSize?: number;
  options?: ListParseOptions;
  /** Changes this tab's parse options (the Split by select lives under the inputs). */
  onOptionsChange?: (fn: (prev: ListParseOptions) => ListParseOptions) => void;
  /** Reports the parsed item count of each list for the status bar. */
  onCountsChange?: (left: number, right: number) => void;
  /** Input pane width in percent (shared with the Transform split). */
  split?: number;
  /** Starts a drag of the divider between input and result. */
  onResizeStart?: () => void;
  /** CSV key column restored from a shared link. */
  initialCsvColumn?: string | null;
  /** Report the selected CSV column up so share links can preserve it. */
  onCsvColumnChange?: (col: string | null) => void;
  /** Selected result tab. The parent owns it (it is saved with the tab and in share links); this panel never keeps its own copy. */
  activeBucket: ListBucket;
  onActiveBucketChange: (bucket: ListBucket) => void;
  /** Custom user labels for the Left and Right list panes. */
  leftLabel?: string;
  rightLabel?: string;
  /** Trigger the inline rename editor for a list-pane header. */
  onStartListRename?: (side: "left" | "right" | "list", el: HTMLElement | null) => void;
}

const RESULT_SORT_STORAGE_KEY = "formaty-list-result-sort";
const LIST_SORT_VALUES: ListSortMode[] = ["none", "asc", "desc", "numeric-asc", "numeric-desc", "frequency"];

function loadStoredSort(): ListSortMode {
  try {
    const raw = localStorage.getItem(RESULT_SORT_STORAGE_KEY);
    if (raw && (LIST_SORT_VALUES as string[]).includes(raw)) return raw as ListSortMode;
  } catch {
    /* ignore */
  }
  return "asc";
}

const SAMPLES: Array<{ id: string; label: string; left: string; right: string }> = [
  {
    id: "ids",
    label: "IDs with overlap",
    left: "user_1001\nuser_1002\nuser_1003\nuser_1002\nuser_1004\nuser_1005\nuser_1003\nuser_1006",
    right: "user_1002\nuser_1003\nuser_1004\nuser_1006\nuser_1007\nuser_1008",
  },
  {
    id: "emails",
    label: "Comma separated emails",
    left: "Ada@example.com, bob@example.com, Carol@example.com, dave@example.com",
    right: "BOB@example.com, carol@example.com, Erin@example.com, dave@example.com",
  },
  {
    id: "sql",
    label: "Quoted SQL values",
    left: "'ny', 'la', 'sf', 'chi', 'sea'",
    right: "'la', 'sea', 'bos', 'sf', 'den'",
  },
];

export function ListComparePanel({
  left,
  right,
  onLeftChange,
  onRightChange,
  toolbarHost = null,
  onExportChange,
  fontSize = 14,
  isDark,
  options,
  onOptionsChange,
  onCountsChange,
  split = 38,
  onResizeStart,
  initialCsvColumn,
  onCsvColumnChange,
  activeBucket,
  onActiveBucketChange: setActiveBucket,
  leftLabel,
  rightLabel,
  onStartListRename,
}: ListComparePanelProps) {
  const effectiveOptions = options ?? DEFAULT_LIST_PARSE_OPTIONS;
  const [resultSort, setResultSort] = useState<ListSortMode>(loadStoredSort);
  const [exportFormat, setExportFormat] = useExportFormat("formaty-list-export-format");
  const [csvColumn, setCsvColumn] = useState<string | null>(null);
  // Summary groups the user collapsed; kept here so the choice survives switching result tabs.
  const [closedGroups, setClosedGroups] = useState<string[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(RESULT_SORT_STORAGE_KEY, resultSort);
    } catch {
      /* ignore */
    }
  }, [resultSort]);

  // Large pastes: keep typing responsive by computing the result from deferred text.
  const dLeft = useDeferredValue(left);
  const dRight = useDeferredValue(right);

  const csvColumns = useMemo(() => {
    const l = detectCsvColumns(dLeft);
    const r = detectCsvColumns(dRight);
    if (!l || !r) return null;
    const common = l.filter((c) => r.includes(c));
    return common.length ? { left: l, right: r, common } : null;
  }, [dLeft, dRight]);

  // Auto-pick the first common column; prefer the one restored from a share link.
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
  useEffect(() => {
    onCsvColumnChange?.(csvColumn);
  }, [csvColumn, onCsvColumnChange]);

  const result = useMemo(() => {
    if (csvColumn && csvColumns) {
      const csvResult = compareCsvByColumn(dLeft, dRight, csvColumn, effectiveOptions);
      if (csvResult) return csvResult.result;
    }
    return compareLists(dLeft, dRight, effectiveOptions);
  }, [dLeft, dRight, effectiveOptions, csvColumn, csvColumns]);

  const isSummary = activeBucket === "summary";
  const bucketItems = useMemo(() => getBucketItems(result, activeBucket), [result, activeBucket]);
  const summary = useMemo(
    () => (isSummary ? buildListSummary(result, { includeChanged: !!csvColumn, showCountDeltas: true }) : null),
    [isSummary, result, csvColumn],
  );

  const sortedItems = useMemo(() => (isSummary ? [] : sortListItems(bucketItems, resultSort)), [bucketItems, resultSort, isSummary]);
  // Parent Copy/Download read the full result on demand, never on every keystroke.
  useEffect(() => {
    if (!onExportChange) return;
    if (isSummary ? !summary?.text : sortedItems.length === 0) {
      onExportChange(null);
      return;
    }
    onExportChange({
      get text() {
        return isSummary ? summary?.text ?? "" : formatListItems(sortedItems, exportFormat);
      },
      get items() {
        return sortedItems.map((i) => i.value);
      },
      filename: isSummary ? "formaty-list-summary.txt" : `formaty-list-${activeBucket}.${listExportExtension(exportFormat)}`,
      bucket: activeBucket,
      count: isSummary ? summary?.sections.reduce((n, s) => n + s.count, 0) ?? 0 : sortedItems.length,
    });
  }, [activeBucket, sortedItems, exportFormat, onExportChange, isSummary, summary]);
  useEffect(() => () => onExportChange?.(null), [onExportChange]);

  const st = result.stats;
  useEffect(() => onCountsChange?.(result.left.rawCount, result.right.rawCount), [result.left.rawCount, result.right.rawCount, onCountsChange]);
  const count = (b: ListBucket) => (b === "summary" ? 1 : st[b]);

  // Never leave the user on an empty tab: jump to the first one with results. Wait while the result still
  // belongs to the previous text (deferred values lag one render): judging the new tab against the old
  // result moved Sample away from "In both" and, with the parent mirroring the tab, looped.
  const stale = left !== dLeft || right !== dRight;
  useEffect(() => {
    if (stale || activeBucket === "summary" || count(activeBucket) > 0) return;
    const next = (["common", "leftOnly", "rightOnly", "leftDupes", "rightDupes"] as ListBucket[]).find((b) => count(b) > 0);
    if (next) setActiveBucket(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, stale]);

  const swap = () => {
    onLeftChange(right);
    onRightChange(left);
    toast({ message: "Swapped A and B", type: "info" });
  };
  const loadSample = (id: string) => {
    const sample = SAMPLES.find((x) => x.id === id);
    if (!sample) return;
    onLeftChange(sample.left);
    onRightChange(sample.right);
    onOptionsChange?.((p) => (p.delimiter === "auto" ? p : { ...p, delimiter: "auto" }));
    setActiveBucket("common");
  };

  // Optionally normalise pasted text (Compare setting "Tidy on paste").
  const pasteClean = (apply: (v: string) => void) => (text: string) => {
    if (!effectiveOptions.autoClean) return;
    const cleaned = cleanListInput(text);
    if (text && cleaned !== text) apply(cleaned);
  };

  const tidy = useMemo(() => ({ left: needsListTidy(dLeft), right: needsListTidy(dRight) }), [dLeft, dRight]);
  const hasText = !!(left.trim() || right.trim());
  // A cleared comparison starts over on "In both".
  const wasEmpty = useRef(!hasText);
  useEffect(() => {
    if (!hasText && !wasEmpty.current) setActiveBucket("common");
    wasEmpty.current = !hasText;
  }, [hasText, setActiveBucket]);
  const dupes = st.leftDupes + st.rightDupes;
  const dupeActive = activeBucket === "leftDupes" || activeBucket === "rightDupes";

  const listPane = (
    side: "left" | "right",
    value: string,
    onChange: (v: string) => void,
    dot: string,
    name: string,
    rawCount: number,
    placeholder: string,
  ) => (
    <section aria-label={name} className="flex min-h-[160px] flex-1 flex-col border-b border-[var(--workspace-border)]">
      <ListPaneHeader
        dot={dot}
        name={name}
        count={rawCount}
        onRename={(el) => onStartListRename?.(side, el)}
        samples={side === "left" ? SAMPLES : undefined}
        onSample={loadSample}
        onTidy={() => onChange(cleanListInput(value))}
        canTidy={tidy[side]}
        onClear={() => onChange("")}
        canClear={!!value}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <ListEditor
          value={value}
          onChange={onChange}
          onPaste={pasteClean(onChange)}
          ariaLabel={`Content of ${name}`}
          placeholder={placeholder}
          hint="Paste one item per line, or comma separated"
          fontSize={fontSize}
          isDark={isDark}
        />
      </div>
    </section>
  );

  const repeatedIn = (["leftDupes", "rightDupes"] as const).map((b, i) => ({
    value: b,
    label: `${i === 0 ? leftLabel ?? "List A" : rightLabel ?? "List B"} ${num(st[b])}`,
  }));

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-auto min-[901px]:flex-row min-[901px]:overflow-hidden">
        {/* Inputs */}
        <div className={inputPaneClass} style={splitStyle(split)}>
          {listPane("left", left, onLeftChange, "bg-side-a", leftLabel ?? "List A", result.left.rawCount, "Paste the first list")}
          {listPane("right", right, onRightChange, "bg-side-b", rightLabel ?? "List B", result.right.rawCount, "Paste the second list")}
          <InputFooter>
            <SplitBySelect
              value={effectiveOptions.delimiter}
              onChange={(delimiter) => onOptionsChange?.((p) => ({ ...p, delimiter }))}
              texts={[dLeft, dRight]}
            />
            <Button variant="ghost" className="ml-auto" icon={<ArrowsRightLeftIcon />} onClick={swap}>
              Swap A and B
            </Button>
          </InputFooter>
        </div>
        <SplitHandle onResizeStart={onResizeStart} />

        {/* Result */}
        <section aria-label="Result" className="flex min-w-0 flex-1 flex-col bg-[var(--workspace-panel)] min-[901px]:min-h-0 min-[901px]:overflow-hidden">
          {!hasText ? (
            <div className="flex min-h-[240px] flex-1 items-center justify-center">
              <EmptyState
                title="Compare two lists"
                description="Paste a list on each side. You get the items only in A, in both, and only in B, ready to copy as SQL, JSON or CSV."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    {SAMPLES.map((x) => (
                      <Button key={x.id} variant="secondary" onClick={() => loadSample(x.id)}>
                        {x.label}
                      </Button>
                    ))}
                  </div>
                }
              />
            </div>
          ) : (
            <>
            <TileRow label="Which items" host={toolbarHost}>
              <Tile count={st.leftOnly} label="Only in A" dot="bg-side-a" on={activeBucket === "leftOnly"} onClick={() => setActiveBucket("leftOnly")} />
              <Tile count={st.common} label="In both" dot="bg-brand" on={activeBucket === "common"} onClick={() => setActiveBucket("common")} />
              <Tile count={st.rightOnly} label="Only in B" dot="bg-side-b" on={activeBucket === "rightOnly"} onClick={() => setActiveBucket("rightOnly")} />
              <Tile count={st.symmetric} label="In one only" on={activeBucket === "symmetric"} onClick={() => setActiveBucket("symmetric")} />
              <Tile count={st.union} label="All merged" on={activeBucket === "union"} onClick={() => setActiveBucket("union")} />
              <Tile count={dupes} label="Repeated" on={dupeActive} onClick={() => setActiveBucket(st.leftDupes ? "leftDupes" : "rightDupes")} />
              {(csvColumn || st.changed > 0) && (
                <Tile count={st.changed} label="Changed" on={activeBucket === "changed"} onClick={() => setActiveBucket("changed")} />
              )}
              <Tile label="Summary" on={isSummary} onClick={() => setActiveBucket("summary")} />
            </TileRow>
            {(csvColumns || dupeActive) && (
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--workspace-border)] px-3 py-1">
                {csvColumns && (
                  <Select<string>
                    label="Match rows by column"
                    options={csvColumns.common.map((c) => ({ value: c, label: c }))}
                    value={csvColumn ?? ""}
                    onChange={(c) => {
                      setCsvColumn(c);
                      setActiveBucket("common");
                    }}
                  />
                )}
                {dupeActive && (
                  <Select<"leftDupes" | "rightDupes"> label="Repeated in" options={repeatedIn} value={activeBucket as "leftDupes" | "rightDupes"} onChange={setActiveBucket} />
                )}
              </div>
            )}

            {isSummary ? (
              <SummaryView summary={summary!} closed={closedGroups} onClosedChange={setClosedGroups} />
            ) : (
              <ResultView
                items={sortedItems}
                format={exportFormat}
                onFormat={setExportFormat}
                sort={resultSort}
                onSort={setResultSort}
                fileBase={`formaty-list-${activeBucket}`}
                showCounts={dupeActive}
                emptyTitle={dupeActive ? "Nothing repeats" : "No items here"}
                empty={dupeActive ? "Every item appears once in this list." : "Nothing falls in this group for the current lists."}
              />
            )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
