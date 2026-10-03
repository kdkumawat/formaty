"use client";

import {
  ArrowDownTrayIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import type { FeedbackStatus } from "@/lib/feedback";

export interface BulkActionBarProps {
  count: number;
  busy: boolean;
  onStatus: (status: FeedbackStatus) => void;
  onDelete: () => void;
  onCopy: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onClear: () => void;
}

export function BulkActionBar({
  count,
  busy,
  onStatus,
  onDelete,
  onCopy,
  onExportCsv,
  onExportJson,
  onClear,
}: BulkActionBarProps) {
  if (count === 0) return null;
  return (
    <div className="sticky bottom-4 z-10 mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-[var(--workspace-panel)]/95 px-3 py-2.5 shadow-xl backdrop-blur-md">
      <span className="text-xs font-semibold text-[var(--workspace-text)] tabular-nums">
        {count} selected
      </span>
      <div className="flex flex-wrap items-center gap-1.5" aria-label="Bulk actions">
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => onStatus("in_progress")}>
          <ClockIcon className="h-3.5 w-3.5" />
          In progress
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => onStatus("fixed")}>
          <CheckIcon className="h-3.5 w-3.5" />
          Fixed
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => onStatus("ignored")}>
          <XMarkIcon className="h-3.5 w-3.5" />
          Ignore
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onCopy}>
          <ClipboardDocumentListIcon className="h-3.5 w-3.5" />
          Copy
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onExportCsv}>
          <ArrowDownTrayIcon className="h-3.5 w-3.5" />
          CSV
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onExportJson}>
          <ArrowDownTrayIcon className="h-3.5 w-3.5" />
          JSON
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onDelete} className="text-red-500 hover:text-red-500">
          <TrashIcon className="h-3.5 w-3.5" />
          Delete
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
