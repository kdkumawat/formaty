"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { Button, EmptyState, PaneHeader, ResultActions, TruncatedText } from "@/components/kit";
import { focusRing } from "@/components/kit/styles";
import { cn } from "@/lib/utils";
import type { ListSummary, ListSummarySection } from "@/lib/json/listCompare";
import { downloadText, num } from "./shared";

/** Rows shown per group before "Show more". Copy and Download always use the whole report. */
const PAGE = 100;

/** The colour a group wears on the result tabs. */
const DOT: Partial<Record<ListSummarySection["bucket"], string>> = {
  common: "bg-brand",
  leftOnly: "bg-side-a",
  leftDupes: "bg-side-a",
  rightOnly: "bg-side-b",
  rightDupes: "bg-side-b",
};

function Group({ section, open, onToggle }: { section: ListSummarySection; open: boolean; onToggle: () => void }) {
  const [shown, setShown] = useState(PAGE);
  const dot = DOT[section.bucket];
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
        {dot && <span aria-hidden className={`size-2 shrink-0 rounded-[2px] ${dot}`} />}
        <span className="min-w-0 truncate">{section.label}</span>
        <span className="tabular-nums text-[var(--workspace-text-muted)]">{num(section.count)}</span>
      </button>
      {open && (
        <div>
          {rows.slice(0, shown).map((r, i) => (
            // Every row shares one left edge (pl-9, under the group name) so nothing drifts.
            <div key={i} className="flex h-7 items-center gap-3 pl-9 pr-3 max-[900px]:h-9">
              <TruncatedText className="min-w-0 flex-1 font-mono text-[13px] leading-[1.6] text-[var(--workspace-text)]">{r.value}</TruncatedText>
              {r.note && <span className="shrink-0 text-[12px] tabular-nums text-[var(--workspace-text-muted)]">{r.note}</span>}
            </div>
          ))}
          {rows.length > shown && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1 pl-9 pr-3 text-[12px] text-[var(--workspace-text-muted)]">
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
 * The Summary tab: one collapsible group per result tab that has items. `closed` holds the buckets the
 * user collapsed; the parent keeps it so the choice survives switching tabs.
 */
export function SummaryView({
  summary,
  closed,
  onClosedChange,
}: {
  summary: ListSummary;
  closed: string[];
  onClosedChange: (closed: string[]) => void;
}) {
  const { sections } = summary;
  const total = sections.reduce((n, s) => n + s.count, 0);
  const allClosed = sections.length > 0 && sections.every((s) => closed.includes(s.bucket));
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PaneHeader
        left={
          <>
            <Button variant="ghost" disabled={!sections.length} onClick={() => onClosedChange(allClosed ? [] : sections.map((s) => s.bucket))}>
              {allClosed ? "Expand all" : "Collapse all"}
            </Button>
            <span className="text-[12px] tabular-nums text-[var(--workspace-text-muted)]">
              {`${num(total)} ${total === 1 ? "item" : "items"} in ${sections.length} ${sections.length === 1 ? "group" : "groups"}`}
            </span>
          </>
        }
        right={
          <ResultActions
            onDownload={() => downloadText("formaty-list-summary.txt", summary.text)}
            canDownload={!!summary.text}
            copy={{ getText: () => summary.text, disabled: !summary.text }}
          />
        }
      />
      {sections.length === 0 ? (
        <EmptyState title="Nothing to summarise" description="Neither list has any items yet." />
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
