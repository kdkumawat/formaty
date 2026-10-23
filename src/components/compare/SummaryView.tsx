"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { Button, EmptyState, PaneHeader, ResultActions, RowCopy, TruncatedText, type CopyFormat } from "@/components/kit";
import { focusRing } from "@/components/kit/styles";
import { cn } from "@/lib/utils";
import { formatListSummary, type ListSortMode, type ListSummary, type ListSummaryFormat, type ListSummarySection } from "@/lib/json/listCompare";
import { FindSortRow, downloadText, num } from "./shared";

/** Rows shown per group before "Show more". Copy and Download always use the whole report. */
const PAGE = 100;

/** The side dots a group wears, the same ones its items carry on the other result tabs ("In both" gets both). */
const DOTS: Partial<Record<ListSummarySection["bucket"], string[]>> = {
  common: ["bg-side-a", "bg-side-b"],
  leftOnly: ["bg-side-a"],
  leftDupes: ["bg-side-a"],
  rightOnly: ["bg-side-b"],
  rightDupes: ["bg-side-b"],
};

export const SUMMARY_COPY_FORMATS: CopyFormat[] = [
  { id: "text", label: "Report", hint: "In both (2)" },
  { id: "markdown", label: "Markdown", hint: "## In both (2)" },
  { id: "json", label: "JSON", hint: '{"In both": […]}' },
];
export const SUMMARY_EXTENSION: Record<ListSummaryFormat, string> = { text: "txt", markdown: "md", json: "json" };

function Group({ section, open, onToggle }: { section: ListSummarySection; open: boolean; onToggle: () => void }) {
  const [shown, setShown] = useState(PAGE);
  const dots = DOTS[section.bucket];
  const rows = section.rows;
  return (
    <section>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className={cn(
          "flex h-8 w-full items-center gap-2 px-3 text-left text-[13px] font-medium text-[var(--workspace-text)] hover:bg-control max-[900px]:h-9",
          focusRing,
        )}
      >
        {open ? <ChevronDownIcon aria-hidden className="size-4 shrink-0 opacity-70" /> : <ChevronRightIcon aria-hidden className="size-4 shrink-0 opacity-70" />}
        {dots && (
          <span aria-hidden className="flex shrink-0 gap-0.5">
            {dots.map((d) => (
              <span key={d} className={`size-1.5 rounded-full ${d}`} />
            ))}
          </span>
        )}
        <span className="min-w-0 truncate">{section.label}</span>
        <span className="tabular-nums text-[var(--workspace-text-muted)]">{num(section.count)}</span>
      </button>
      {open && (
        <div className="px-1">
          {rows.slice(0, shown).map((r, i) => (
            <RowCopy key={i} text={r.value} className="pl-0">
              <span className="flex items-center gap-2">
                <span aria-hidden className="w-8 shrink-0 text-right font-mono text-[12px] tabular-nums text-faint">{i + 1}</span>
                <TruncatedText className="min-w-0 flex-1 font-mono leading-[1.6]">{r.value}</TruncatedText>
                {r.note && <span title={r.note} className="min-w-0 max-w-[45%] shrink truncate font-sans text-[12px] tabular-nums text-[var(--workspace-text-muted)]">{r.shortNote}</span>}
              </span>
            </RowCopy>
          ))}
          {rows.length > shown && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1 pl-10 pr-3 text-[12px] text-[var(--workspace-text-muted)]">
              <span className="tabular-nums">{`Showing ${num(shown)} of ${num(rows.length)}. Copy always includes all ${num(rows.length)}.`}</span>
              <Button onClick={() => setShown((s) => s + PAGE)}>Show {PAGE} more</Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * The Summary tab: one collapsible group per result tab that has items, under the same header as the other
 * result tabs (tabs, Download, Copy; then Find and Sort). The parent owns `closed`, Find, Sort and the Copy
 * format so they survive switching tabs, and sorts when it builds `summary`.
 */
export function SummaryView({
  summary,
  closed,
  onClosedChange,
  tabs,
  find,
  onFind,
  sort,
  onSort,
  format,
  onFormat,
}: {
  summary: ListSummary;
  closed: string[];
  onClosedChange: (closed: string[]) => void;
  tabs: ReactNode;
  find: string;
  onFind: (q: string) => void;
  sort: ListSortMode;
  onSort: (s: ListSortMode) => void;
  format: ListSummaryFormat;
  onFormat: (f: ListSummaryFormat) => void;
}) {
  const q = find.trim().toLowerCase();
  const sections = useMemo(() => {
    if (!q) return summary.sections;
    return summary.sections
      .map((s) => {
        const keep = s.rows.map((r) => r.value.toLowerCase().includes(q));
        const rows = s.rows.filter((_, i) => keep[i]);
        return { ...s, rows, items: s.items.filter((_, i) => keep[i]), count: rows.length };
      })
      .filter((s) => s.count > 0);
  }, [summary.sections, q]);
  // Like the other tabs, Copy and Download take what Find leaves.
  const textOf = (f: ListSummaryFormat = format) => formatListSummary(sections, f);
  const allItems = useMemo(() => summary.sections.flatMap((s) => s.items), [summary.sections]);
  const total = sections.reduce((n, s) => n + s.count, 0);
  const allClosed = sections.length > 0 && sections.every((s) => closed.includes(s.bucket));
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PaneHeader
        className="flex-nowrap max-[900px]:flex-wrap"
        left={<div className="min-w-0 flex-1 max-[900px]:basis-full">{tabs}</div>}
        right={
          <div className="flex shrink-0 flex-nowrap items-center gap-1">
            <ResultActions
              onDownload={() => downloadText(`formaty-list-summary.${SUMMARY_EXTENSION[format]}`, textOf())}
              canDownload={total > 0}
              copy={{
                getText: (f) => textOf((f as ListSummaryFormat | undefined) ?? format),
                formats: SUMMARY_COPY_FORMATS,
                format,
                onFormatChange: (id) => onFormat(id as ListSummaryFormat),
                disabled: total === 0,
              }}
            />
          </div>
        }
      />
      <FindSortRow
        info={q ? `${num(total)} matching` : `${num(total)} ${total === 1 ? "item" : "items"} in ${sections.length} ${sections.length === 1 ? "group" : "groups"}`}
        find={find}
        onFind={onFind}
        sort={sort}
        onSort={onSort}
        items={allItems}
      >
        <Button variant="ghost" disabled={!sections.length} onClick={() => onClosedChange(allClosed ? [] : sections.map((s) => s.bucket))}>
          {allClosed ? "Expand all" : "Collapse all"}
        </Button>
      </FindSortRow>
      {sections.length === 0 ? (
        q ? (
          <EmptyState title="Nothing matches your search" />
        ) : (
          <EmptyState title="Nothing to summarise" description="Neither list has any items yet." />
        )
      ) : (
        <div className="min-h-0 flex-1 overflow-auto py-1">
          {sections.map((s) => (
            <Group
              key={s.bucket}
              section={s}
              open={!closed.includes(s.bucket)}
              onToggle={() => onClosedChange(closed.includes(s.bucket) ? closed.filter((b) => b !== s.bucket) : [...closed, s.bucket])}
            />
          ))}
        </div>
      )}
    </div>
  );
}
