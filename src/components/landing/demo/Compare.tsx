"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/16/solid";
import { Button, PaneHeader, ResultActions } from "@/components/kit";
import {
  InputFooter,
  ListPaneHeader,
  ResultView,
  SplitBySelect,
  Tile,
  TileRow,
  downloadText,
  editorClass,
  inputPaneClass,
  splitStyle,
} from "@/components/compare/shared";
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
} from "@/lib/json/listCompare";
import { playHref } from "../live/playLink";
import { DemoFooter } from "./Footer";

const SPLIT = 40;
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
 * `full` shows every result tab (the hero keeps four). On the landing `hero` the page's own key is the one
 * amber action, so Copy is the quiet variant there.
 */
export default function Compare({ preset = {}, full = false, hero = false }: { preset?: ComparePreset; full?: boolean; hero?: boolean }) {
  const router = useRouter();
  const [kind, setKind] = useState<CompareKind>(preset.kind === "single" ? "single" : "list");
  const [left, setLeft] = useState(preset.left ?? LEFT);
  const [right, setRight] = useState(preset.right ?? RIGHT);
  const [bucket, setBucket] = useState<ListBucket>(preset.bucket ?? "leftOnly");
  const [tile, setTile] = useState<SingleTile>("repeated");
  const [options, setOptions] = useState<ListParseOptions>(DEFAULT_LIST_PARSE_OPTIONS);
  const [format, setFormat] = useState<ListExportFormat>(preset.format ?? "newline");
  const [sort, setSort] = useState<ListSortMode>(kind === "single" ? "none" : "asc");
  const [host, setHost] = useState<HTMLElement | null>(null);
  const copyVariant = hero ? "secondary" : undefined;

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
  const dupes = st.leftDupes + st.rightDupes;
  const summary = useMemo(
    () => (bucket === "summary" ? buildListSummary(result, { includeChanged: !!column }) : null),
    [bucket, result, column],
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

  const tab = (b: ListBucket, label: string, count: number | undefined, dot?: string) => (
    <Tile key={b} count={count} label={label} dot={dot} on={bucket === b} onClick={() => setBucket(b)} />
  );
  const playState = single
    ? { activeOperation: "diff" as const, diffKind: "single" as const, diffLeftInput: left }
    : { activeOperation: "diff" as const, diffKind: "list" as const, diffLeftInput: left, diffRightInput: right, compareActiveBucket: bucket };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CompareBar
        kind={kind}
        // Two documents has its own screen in the playground.
        onKind={(k) => (k === "document" ? router.push(playHref({ activeOperation: "diff", diffKind: k, diffLeftInput: left, diffRightInput: right })) : setKind(k))}
        options={options}
        onOptions={setOptions}
        setToolbarHost={setHost}
        split={SPLIT}
        actions={null}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-auto min-[901px]:flex-row min-[901px]:overflow-hidden">
        <div className={inputPaneClass} style={splitStyle(SPLIT)}>
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
              <Button
                variant="ghost"
                className="ml-auto"
                icon={<ArrowsRightLeftIcon />}
                onClick={() => {
                  setLeft(right);
                  setRight(left);
                }}
              >
                Swap A and B
              </Button>
            )}
          </InputFooter>
        </div>
        <section aria-label="Result" className="flex min-h-[280px] min-w-0 flex-1 flex-col bg-[var(--workspace-panel)] min-[901px]:min-h-0 min-[901px]:overflow-hidden">
          <TileRow label="Which items" host={host}>
            {single ? (
              <>
                <Tile count={analysis.uniqueCount} label="Distinct" on={tile === "distinct"} onClick={() => setTile("distinct")} />
                <Tile count={analysis.onceCount} label="Appear once" on={tile === "once"} onClick={() => setTile("once")} />
                <Tile count={analysis.duplicateKeys} label="Repeated" on={tile === "repeated"} onClick={() => setTile("repeated")} />
              </>
            ) : (
              <>
                {tab("leftOnly", "Only in A", st.leftOnly, "bg-side-a")}
                {tab("common", "In both", st.common, "bg-brand")}
                {tab("rightOnly", "Only in B", st.rightOnly, "bg-side-b")}
                {full && tab("symmetric", "In one only", st.symmetric)}
                {tab("union", "All merged", st.union)}
                {full && tab(st.leftDupes ? "leftDupes" : "rightDupes", "Repeated", dupes)}
                {full && column && tab("changed", "Changed", st.changed)}
                {full && tab("summary", "Summary", undefined)}
              </>
            )}
          </TileRow>
          {summary ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <PaneHeader
                right={<ResultActions onDownload={() => downloadText("formaty-list-summary.txt", summary.text)} canDownload={!!summary.text} copy={{ getText: () => summary.text, disabled: !summary.text, variant: copyVariant }} />}
              />
              <pre role="group" tabIndex={0} aria-label="Summary" className="m-0 min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-[13px] leading-[1.6]">
                {summary.text || "Paste two lists to see a summary."}
              </pre>
            </div>
          ) : (
            <ResultView items={items} format={format} onFormat={setFormat} sort={sort} onSort={setSort} fileBase={`formaty-list-${single ? tile : bucket}`} showCounts={single} empty="No items here." copyVariant={copyVariant} />
          )}
        </section>
      </div>
      <DemoFooter href={playHref(playState)} />
    </div>
  );
}
