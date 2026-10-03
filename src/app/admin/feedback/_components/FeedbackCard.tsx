"use client";

import { useState } from "react";
import {
  ArrowPathIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/workspace/Tooltip";
import {
  absoluteTime,
  categoryLabel,
  statusLabel,
  timeAgo,
  type FeedbackItem,
  type FeedbackStatus,
} from "@/lib/feedback";

const STATUS_PILL: Record<FeedbackStatus, string> = {
  new: "border-primary/40 bg-primary/10 text-primary",
  in_progress: "border-amber-500/40 bg-amber-500/10 text-amber-500",
  fixed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
  ignored: "border-[var(--workspace-border)] text-[var(--workspace-text-muted)]",
};

const COLLAPSE_AT = 400;

export interface FeedbackCardProps {
  item: FeedbackItem;
  selected: boolean;
  onToggleSelect: () => void;
  busy: boolean;
  onStatus: (status: FeedbackStatus) => void;
  onDelete: () => void;
  onCopy: () => void;
}

export function FeedbackCard({
  item,
  selected,
  onToggleSelect,
  busy,
  onStatus,
  onDelete,
  onCopy,
}: FeedbackCardProps) {
  const [expanded, setExpanded] = useState(false);
  const long = item.message.length > COLLAPSE_AT;

  return (
    <li
      className={`rounded-xl border bg-[var(--workspace-panel)] p-4 transition-colors ${
        selected ? "border-primary/50" : "border-[var(--workspace-border)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelect}
          aria-label={`Select feedback from ${item.email ?? "anonymous"}`}
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              {categoryLabel(item.category)}
            </span>
            <span
              className="text-[10px] tabular-nums text-[var(--workspace-text-muted)]"
              title={absoluteTime(item.created_at)}
            >
              {timeAgo(item.created_at)}
            </span>
            {item.email && (
              <a
                href={`mailto:${item.email}`}
                className="truncate text-[10px] text-[var(--workspace-text-muted)] hover:text-primary hover:underline"
              >
                {item.email}
              </a>
            )}
          </div>
          <p
            className={`mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--workspace-text)] ${
              !expanded && long ? "line-clamp-6" : ""
            }`}
          >
            {item.message}
          </p>
          {long && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-1 text-[11px] font-medium text-primary hover:underline"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
          {(item.page || item.browser) && (
            <div className="mt-2.5 space-y-0.5 text-[10px] leading-snug text-[var(--workspace-text-muted)]">
              {item.page && (
                <p className="truncate font-mono">
                  <span className="opacity-70">page:</span> {item.page}
                </p>
              )}
              {item.browser && (
                <p className="truncate font-mono" title={item.browser}>
                  <span className="opacity-70">ua:</span> {item.browser}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {busy ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <div className="flex items-center gap-1">
              <Tooltip content="Copy item">
                <button
                  type="button"
                  aria-label="Copy item"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-border)]/40 hover:text-[var(--workspace-text)]"
                  onClick={onCopy}
                >
                  <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Mark in progress">
                <button
                  type="button"
                  aria-label="Mark in progress"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-border)]/40 hover:text-amber-400"
                  onClick={() => onStatus("in_progress")}
                >
                  <ClockIcon className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Mark fixed">
                <button
                  type="button"
                  aria-label="Mark fixed"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--workspace-text-muted)] transition-colors hover:bg-emerald-500/15 hover:text-emerald-500"
                  onClick={() => onStatus("fixed")}
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Ignore">
                <button
                  type="button"
                  aria-label="Ignore"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-border)]/40 hover:text-[var(--workspace-text)]"
                  onClick={() => onStatus("ignored")}
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Delete">
                <button
                  type="button"
                  aria-label="Delete"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--workspace-text-muted)] transition-colors hover:bg-red-500/15 hover:text-red-500"
                  onClick={onDelete}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
            </div>
          )}
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_PILL[item.status]}`}
          >
            {statusLabel(item.status)}
          </span>
        </div>
      </div>
    </li>
  );
}
