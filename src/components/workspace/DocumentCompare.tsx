"use client";

import { createPortal } from "react-dom";
import { ArrowsRightLeftIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/16/solid";
import type { DiffSummary, LineDiffStats } from "@/lib/json/diff";
import {
  IconButton,
  InputActions,
  ResultActions,
  Segmented,
  TruncatedText,
  type CopyFormat,
} from "@/components/kit";
import { FORMAT_GLYPH } from "@/components/workspace/PaneHeaders";
import { CheckChip, RenameButton } from "@/components/compare/shared";

export type DocView = "side" | "lines" | "fields";

interface DocumentHeaderProps {
  /** The Compare bar's slot. The controls render there, so the document tool has one row like the list tools. */
  host: HTMLElement | null;
  leftName: string;
  rightName: string;
  onRename: (side: "left" | "right", el: HTMLElement) => void;
  view: DocView;
  onView: (v: DocView) => void;
  canFields: boolean;
  stats: LineDiffStats | null;
  structural: DiffSummary | null;
  hasContent: boolean;
  nav: { current: number; total: number };
  onPrev: () => void;
  onNext: () => void;
  onSample: () => void;
  onTidy: () => void;
  canTidy: boolean;
  onClear: () => void;
  onSwap: () => void;
  ignoreWhitespace: boolean;
  onIgnoreWhitespace: (v: boolean) => void;
  /** Copies the report, document A or document B. */
  onCopy: (what: "report" | "left" | "right") => void | Promise<void>;
  copyFormat: string;
  onCopyFormat: (id: string) => void;
  /** Saves the report. */
  onDownload: () => void;
  /** Document language; "json" shows the `{} JSON` tag in each title. */
  language?: string;
}

const COPY_FORMATS: CopyFormat[] = [
  { id: "report", label: "Report" },
  { id: "left", label: "Document A" },
  { id: "right", label: "Document B" },
];

/** Document controls, portalled into the Compare bar: names and view on the left, document actions at the right. */
export function DocumentHeader(p: DocumentHeaderProps) {
  if (!p.host) return null;
  const changed = p.structural?.changed ?? p.stats?.hunksModified ?? 0;
  const onlyA = p.structural?.removed ?? p.stats?.linesRemoved ?? 0;
  const onlyB = p.structural?.added ?? p.stats?.linesAdded ?? 0;
  const status = [changed > 0 && `${changed.toLocaleString()} changed`, onlyA > 0 && `${onlyA.toLocaleString()} only in A`, onlyB > 0 && `${onlyB.toLocaleString()} only in B`]
    .filter(Boolean)
    .join(" · ");
  return (
    <>
      {createPortal(<DocumentControls {...p} status={status} />, p.host)}
      {/* File titles: one cell per pane, side by side like the editor below. */}
      {p.view === "side" && (
        <div className="flex h-9 shrink-0 border-b border-[var(--workspace-border)]">
          {(["left", "right"] as const).map((side) => (
            <div key={side} className={`flex min-w-0 flex-1 items-center gap-2 px-2 ${side === "right" ? "border-l border-[var(--workspace-border)]" : ""}`}>
              <RenameButton
                dot={side === "left" ? "bg-side-a" : "bg-side-b"}
                name={side === "left" ? p.leftName : p.rightName}
                onRename={(el) => p.onRename(side, el)}
                className="max-w-[60%]"
              />
              <span className="inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-sm border border-input px-[7px] font-mono text-[11.5px] text-[var(--workspace-text)]">
                {p.language === "json" && <span aria-hidden className="text-[var(--workspace-text-muted)]">{FORMAT_GLYPH.json}</span>}
                {p.language === "json" ? "JSON" : "Text"}
              </span>
              <span className="text-[12px] text-[var(--workspace-text-muted)]">{side === "left" ? "A" : "B"}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function DocumentControls(p: DocumentHeaderProps & { status: string }) {
  return (
    <div className="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <CheckChip on={p.ignoreWhitespace} onToggle={() => p.onIgnoreWhitespace(!p.ignoreWhitespace)}>
        Ignore whitespace
      </CheckChip>
      <Segmented
        aria-label="Comparison view"
        tone="neutral"
        value={p.view}
        onChange={p.onView}
        options={[
          { value: "side", label: "Side by side" },
          { value: "lines", label: "Inline" },
          ...(p.canFields ? [{ value: "fields" as DocView, label: "By field" }] : []),
        ]}
      />
      {p.hasContent && (
        <div className="min-w-0 flex-[1_1_6rem] text-[12px] tabular-nums text-[var(--workspace-text-muted)]">
          <TruncatedText>{p.status || (p.stats || p.structural ? "No differences" : "Comparing…")}</TruncatedText>
        </div>
      )}
      <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1">
        <InputActions
          samples={[{ id: "sample", label: "Sample" }]}
          onSample={p.onSample}
          onTidy={p.onTidy}
          canTidy={p.canTidy}
          onClear={p.onClear}
          canClear={p.hasContent}
        />
        <IconButton label="Swap A and B" onClick={p.onSwap}>
          <ArrowsRightLeftIcon />
        </IconButton>
        <IconButton label="Previous change" disabled={!p.nav.total} onClick={p.onPrev}>
          <ChevronUpIcon />
        </IconButton>
        <span aria-live="polite" className="min-w-[6.5rem] text-center text-[12px] tabular-nums text-[var(--workspace-text)]">
          {p.nav.total ? `Change ${p.nav.current} of ${p.nav.total}` : "No changes"}
        </span>
        <IconButton label="Next change" disabled={!p.nav.total} onClick={p.onNext}>
          <ChevronDownIcon />
        </IconButton>
        <ResultActions
          onDownload={p.onDownload}
          canDownload={p.hasContent}
          copy={{
            onCopy: (f) => p.onCopy((f ?? p.copyFormat) as "report" | "left" | "right"),
            formats: COPY_FORMATS,
            format: p.copyFormat,
            onFormatChange: p.onCopyFormat,
            disabled: !p.hasContent,
          }}
        />
      </div>
    </div>
  );
}

export function FieldTable({ summary }: { summary: DiffSummary | null }) {
  if (!summary) {
    return <p className="p-3 text-[13px] text-[var(--workspace-text-muted)]">By field needs valid JSON on both sides.</p>;
  }
  if (summary.rows.length === 0) {
    return <p className="p-3 text-[13px] text-[var(--workspace-text-muted)]">No differences between A and B.</p>;
  }
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full border-collapse text-left font-mono text-[13px]">
        <thead className="sticky top-0 bg-[var(--workspace-panel)] font-sans text-[13px]">
          <tr className="border-b border-[var(--workspace-border)]">
            <th className="px-3 py-1.5 font-semibold">Path</th>
            <th className="px-3 py-1.5 font-semibold">In A</th>
            <th className="px-3 py-1.5 font-semibold">In B</th>
          </tr>
        </thead>
        <tbody>
          {summary.rows.map((r, i) => (
            <tr key={`${r.path}-${i}`} className="border-b border-[var(--workspace-border)] align-top">
              <td className="px-3 py-1.5">{r.path}</td>
              <td className={`px-3 py-1.5 ${r.change !== "added" ? "text-side-a" : "text-[var(--workspace-text-muted)]"}`}>
                {r.change === "added" ? "missing" : r.left}
              </td>
              <td className={`px-3 py-1.5 ${r.change !== "removed" ? "text-side-b" : "text-[var(--workspace-text-muted)]"}`}>
                {r.change === "removed" ? "missing" : r.right}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {summary.truncated && <p className="p-3 text-[13px] text-[var(--workspace-text-muted)]">Showing the first changes only.</p>}
    </div>
  );
}
