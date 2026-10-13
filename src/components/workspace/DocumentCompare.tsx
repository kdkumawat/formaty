"use client";

import { createPortal } from "react-dom";
import { ArrowsRightLeftIcon, ChevronDownIcon, ChevronUpIcon, Cog6ToothIcon } from "@heroicons/react/16/solid";
import type { DiffSummary, LineDiffStats } from "@/lib/json/diff";
import {
  IconButton,
  InputActions,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuTrigger,
  ResultActions,
  Segmented,
  TruncatedText,
  type CopyFormat,
} from "@/components/kit";
import { RenameButton } from "@/components/compare/shared";

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
  return createPortal(
    <div className="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      {/* Right after the kind switch, where the list tools keep their matching options. */}
      <Menu>
        <MenuTrigger asChild>
          <IconButton label="Comparison options" className="relative">
            <Cog6ToothIcon />
            {p.ignoreWhitespace && <span aria-hidden className="absolute right-1 top-1 size-1.5 rounded-full bg-action" />}
          </IconButton>
        </MenuTrigger>
        <MenuContent align="start">
          <MenuCheckboxItem checked={p.ignoreWhitespace} onCheckedChange={p.onIgnoreWhitespace} onSelect={(e) => e.preventDefault()}>
            Ignore whitespace
          </MenuCheckboxItem>
        </MenuContent>
      </Menu>
      <RenameButton dot="bg-side-a" name={p.leftName} onRename={(el) => p.onRename("left", el)} className="max-w-[140px] text-[13px] font-medium" />
      <RenameButton dot="bg-side-b" name={p.rightName} onRename={(el) => p.onRename("right", el)} className="max-w-[140px] text-[13px] font-medium" />
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
          <TruncatedText>{status || "No differences"}</TruncatedText>
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
        <span aria-live="polite" className="min-w-[3rem] text-center text-[13px] tabular-nums text-[var(--workspace-text)]">
          {p.nav.total ? `${p.nav.current} of ${p.nav.total}` : "0 of 0"}
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
    </div>,
    p.host,
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
