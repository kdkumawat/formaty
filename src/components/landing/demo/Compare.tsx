"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useSplitResize } from "@/hooks/workspace/useSplitResize";
import { ArrowsRightLeftIcon } from "@heroicons/react/16/solid";
import { IconButton } from "@/components/kit";
import {
  BUCKET_SOURCE,
  InputFooter,
  num,
  ListPaneHeader,
  ResultView,
  SplitBySelect,
  ResultTabs,
  type ResultTab,
  editorClass,
  inputPaneClass,
  paneCardClass,
  resultPaneClass,
  SplitHandle,
  splitRowClass,
  splitStyle,
} from "@/components/compare/shared";
import { SummaryView } from "@/components/compare/SummaryView";
import { CompareBar } from "@/components/workspace/CompareBar";
import type { CompareKind } from "@/components/workspace/constants";
import { compareCsvByColumn, detectCsvColumns, pickDefaultColumn } from "@/lib/json/csvCompare";
import {
  DEFAULT_LIST_PARSE_OPTIONS,
  analyzeSingleList,
  buildListSummary,
  cleanListInput,
  compareLists,
  getBucketItems,
  sortListItems,
  type ListBucket,
  type ListExportFormat,
  type ListParseOptions,
  type ListSortMode,
  type ListSummaryFormat,
} from "@/lib/json/listCompare";
import { playHref } from "../live/playLink";
import { DemoFooter } from "./Footer";

const LEFT = "user_1001\nuser_1002\nuser_1003\nuser_1004\nuser_1005\nuser_1006";
const RIGHT = "user_1002\nuser_1003\nuser_1004\nuser_1006\nuser_1007";

/** Where a Compare scene starts. The landing hero uses the defaults; a tool page sets what it is about. */
export interface ComparePreset {
  kind?: CompareKind;
  left?: string;
  right?: string;
  bucket?: ListBucket;
  format?: ListExportFormat;
}

type SingleTile = "distinct" | "once" | "repeated";

/**
 * The playground's list compare: the real bar, headers, tabs and result list over the same functions.
 */
export default function Compare({ preset = {} }: { preset?: ComparePreset }) {
  const router = useRouter();
  const { split, startResize, nudgeSplit, splitContainerRef } = useSplitResize(40);
  const [kind, setKind] = useState<CompareKind>(preset.kind === "single" ? "single" : "list");
  const [left, setLeft] = useState(preset.left ?? LEFT);
  const [right, setRight] = useState(preset.right ?? RIGHT);
  const [bucket, setBucket] = useState<ListBucket>(preset.bucket ?? "leftOnly");
  const [tile, setTile] = useState<SingleTile>("repeated");
  const [options, setOptions] = useState<ListParseOptions>(DEFAULT_LIST_PARSE_OPTIONS);
  const [format, setFormat] = useState<ListExportFormat>(preset.format ?? "newline");
  const [sort, setSort] = useState<ListSortMode>(kind === "single" ? "none" : "asc");
  const [closed, setClosed] = useState<string[]>([]);
  const [find, setFind] = useState("");
  const [summaryFormat, setSummaryFormat] = useState<ListSummaryFormat>("text");

  const single = kind === "single";
  const sample = () => {
    setLeft(preset.left ?? LEFT);
    setRight(preset.right ?? RIGHT);
  };

  // Two CSV files with a shared header compare by that column, as in the playground.
  const column = useMemo(() => {
    const l = detectCsvColumns(left);
    const r = detectCsvColumns(right);
    return l && r && l.some((c) => r.includes(c)) ? pickDefaultColumn(l, r) : null;
  }, [left, right]);
  const result = useMemo(() => {
    const byColumn = column ? compareCsvByColumn(left, right, column, options) : null;
    return byColumn ? byColumn.result : compareLists(left, right, options);
  }, [left, right, options, column]);
  const analysis = useMemo(() => analyzeSingleList(left, options), [left, options]);
  const st = result.stats;
  const summary = useMemo(
    () => (bucket === "summary" ? buildListSummary(result, { includeChanged: !!column, showCountDeltas: true, sort }) : null),
    [bucket, result, column, sort],
  );
  const items = useMemo(() => {
    if (single) return sortListItems(tile === "repeated" ? analysis.duplicates : tile === "once" ? analysis.once : analysis.unique, sort);
    const b = bucket === "summary" ? "leftOnly" : bucket;
    return sortListItems(getBucketItems(result, b), sort);
  }, [single, tile, analysis, result, bucket, sort]);

  const pane = (value: string, set: (v: string) => void, dot: string, name: string, count: number, withSample: boolean) => (
    <section aria-label={name} className="flex min-h-[132px] flex-1 flex-col border-b border-[var(--workspace-border)]">
      <ListPaneHeader
        dot={dot}
        name={name}
        count={count}
        samples={withSample ? [{ id: "sample", label: "Sample lists" }] : undefined}
        onSample={sample}
        onTidy={() => set(cleanListInput(value))}
        canTidy={!!value.trim()}
        onClear={() => set("")}
        canClear={!!value}
      />
      <textarea aria-label={`Content of ${name}`} value={value} onChange={(e) => set(e.target.value)} wrap="off" spellCheck={false} placeholder="Paste one item per line, or comma separated" className={editorClass} />
    </section>
  );

  const t = (value: ListBucket, label: string, count?: number, fold?: number): ResultTab<ListBucket> => ({ value, label, count, fold });
  // The workspace's tab model: main buckets, then the rest under More.
  const tabs = single ? (
    <ResultTabs
      value={tile}
      onChange={setTile}
      tabs={[
        { value: "distinct", label: "Distinct", count: analysis.uniqueCount },
        { value: "once", label: "Appear once", count: analysis.onceCount },
        { value: "repeated", label: "Repeated", count: analysis.duplicateKeys },
      ]}
    />
  ) : (
    <ResultTabs
      value={bucket}
      onChange={setBucket}
      tabs={[t("common", "In both", st.common), t("leftOnly", "Only in A", st.leftOnly, 4), t("rightOnly", "Only in B", st.rightOnly, 3), t("union", "All merged", st.union, 1), t("summary", "Summary")]}
      more={[t("leftDupes", "Repeated in A", st.leftDupes), t("rightDupes", "Repeated in B", st.rightDupes), ...(column || st.changed > 0 ? [t("changed", "Changed", st.changed)] : [])]}
    />
  );
  const playState = single
    ? { activeOperation: "diff" as const, diffKind: "single" as const, diffLeftInput: left }
    : { activeOperation: "diff" as const, diffKind: "list" as const, diffLeftInput: left, diffRightInput: right, compareActiveBucket: bucket };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 bg-[var(--workspace-background)] p-2">
      <div className={`${paneCardClass} shrink-0`}>
      <CompareBar
        kind={kind}
        // Two documents has its own screen in the playground.
        onKind={(k) => (k === "document" ? router.push(playHref({ activeOperation: "diff", diffKind: k, diffLeftInput: left, diffRightInput: right })) : setKind(k))}
        options={options}
        onOptions={setOptions}
        setToolbarHost={() => {}}
        split={split}
        actions={null}
      />
      </div>
      <div ref={splitContainerRef} className={splitRowClass}>
        <div className={inputPaneClass} style={splitStyle(split)}>
          {single ? pane(left, setLeft, "bg-[var(--workspace-text-muted)]", "List", analysis.rawCount, true) : (
            <>
              {pane(left, setLeft, "bg-side-a", "List A", result.left.rawCount, true)}
              {pane(right, setRight, "bg-side-b", "List B", result.right.rawCount, false)}
            </>
          )}
          <InputFooter>
            <SplitBySelect value={options.delimiter} onChange={(delimiter) => setOptions((p) => ({ ...p, delimiter }))} texts={single ? [left] : [left, right]} />
            {column && !single && <span className="text-[12px] text-[var(--workspace-text-muted)]">Rows matched on {column}</span>}
            {!single && (
              <IconButton
                label="Swap A and B"
                className="ml-auto"
                onClick={() => {
                  setLeft(right);
                  setRight(left);
                }}
              >
                <ArrowsRightLeftIcon />
              </IconButton>
            )}
          </InputFooter>
        </div>
        <SplitHandle onResizeStart={startResize} onNudge={nudgeSplit} value={split} />
        <section aria-label="Result" className={resultPaneClass}>
          {summary ? (
            <SummaryView summary={summary} closed={closed} onClosedChange={setClosed} tabs={tabs} find={find} onFind={setFind} sort={sort} onSort={setSort} format={summaryFormat} onFormat={setSummaryFormat} />
          ) : (
            <ResultView tabs={tabs} info={single ? undefined : `${num(items.length)} of ${num(st.union)} unique values · ${BUCKET_SOURCE[bucket] ?? "from A and B"}`} items={items} format={format} onFormat={setFormat} sort={sort} onSort={setSort} find={find} onFind={setFind} fileBase={`formaty-list-${single ? tile : bucket}`} showCounts={single} empty="No items here." />
          )}
        </section>
      </div>
      <DemoFooter href={playHref(playState)} />
    </div>
  );
}
