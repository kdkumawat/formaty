"use client";

import type { ReactNode } from "react";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { ArrowPathIcon, NoSymbolIcon } from "@heroicons/react/24/solid";

interface StatusBarProps {
  valid: boolean | null;
  errorMessage: string | null;
  lineCount: number;
  sizeFormatted: string;
  liveTransform?: boolean;
  onLiveTransformToggle?: () => void;
  inputFormatDropdown?: ReactNode;
  rightActions?: ReactNode;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StatusBar({
  valid,
  errorMessage,
  lineCount,
  sizeFormatted,
  liveTransform,
  onLiveTransformToggle,
  inputFormatDropdown,
  rightActions,
}: StatusBarProps) {
  const validInvalidEl = errorMessage ? (
    <span className="flex min-w-0 max-w-[40rem] shrink items-center gap-1.5 truncate text-error" title={errorMessage}>
      <XCircleIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate">{errorMessage}</span>
    </span>
  ) : valid === true ? (
    <span className="flex min-w-[5rem] items-center gap-1.5">
      <CheckCircleIcon className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
      Valid
    </span>
  ) : valid === false ? (
    <span className="flex min-w-[5rem] items-center gap-1.5 text-error">
      <XCircleIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      Invalid
    </span>
  ) : (
    <span className="min-w-[5rem]">—</span>
  );

  return (
    <div
      className="flex h-7 shrink-0 items-center justify-between gap-1 overflow-visible border-t border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1.5 text-xs text-[var(--workspace-text-muted)]"
      style={{ height: "28px", minHeight: "28px", padding: "0 8px" }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto flex-nowrap">
        <span className="shrink-0 tabular-nums">{lineCount} lines</span>
        <span className="shrink-0">{sizeFormatted}</span>
        {inputFormatDropdown}
        {onLiveTransformToggle && (
          <button
            type="button"
            className={`btn btn-ghost btn-xs flex shrink-0 items-center gap-1 rounded p-1 border-0 hover:bg-[var(--workspace-panel)] hover:underline hover:text-primary transition-colors ${liveTransform ? "text-primary" : "opacity-70 hover:opacity-100"}`}
            title={liveTransform ? "Live transform on" : "Live transform off"}
            onClick={onLiveTransformToggle}
          >
            {liveTransform ? (
              <ArrowPathIcon className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <NoSymbolIcon className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="min-w-[5.5rem]">Live Transform</span>
          </button>
        )}
        {validInvalidEl}
        <span className="flex-1" />
      </div>
      {rightActions ? (
        <div className="flex shrink-0 flex-nowrap items-center gap-1 overflow-x-auto">{rightActions}</div>
      ) : null}
    </div>
  );
}

export function getSizeFormatted(text: string): string {
  if (!text.trim()) return "0 B";
  return formatSize(new Blob([text]).size);
}
