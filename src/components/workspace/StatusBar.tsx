"use client";

import type { ReactNode } from "react";
import { CheckCircleIcon, QuestionMarkCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { ArrowPathIcon, NoSymbolIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "./Tooltip";
import { FeedbackDialog } from "@/components/FeedbackDialog";

interface StatusBarProps {
  valid: boolean | null;
  errorMessage: string | null;
  lineCount: number;
  sizeFormatted: string;
  liveTransform?: boolean;
  onLiveTransformToggle?: () => void;
  inputFormatDropdown?: ReactNode;
  rightActions?: ReactNode;
  cursorPosition?: string;
  indentSize?: number;
  encoding?: string;
  sharedLink?: ReactNode;
  /** Hide the bar entirely (embed mode). */
  hide?: boolean;
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
  cursorPosition,
  indentSize,
  encoding = "UTF-8",
  sharedLink,
  hide = false,
}: StatusBarProps) {
  if (hide) return null;
  const validInvalidEl = errorMessage ? (
    <Tooltip content={errorMessage} className="flex min-w-0 max-w-full shrink items-center gap-1 text-red-400">
      <XCircleIcon className="h-3 w-3 shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{errorMessage}</span>
    </Tooltip>
  ) : valid === true ? (
    <span className="flex items-center gap-1 font-medium text-emerald-500">
      <CheckCircleIcon className="h-3 w-3 shrink-0" aria-hidden />
      Valid
    </span>
  ) : valid === false ? (
    <span className="flex items-center gap-1 text-red-400">
      <XCircleIcon className="h-3 w-3 shrink-0" aria-hidden />
      Invalid
    </span>
  ) : (
    <span className="opacity-30">-</span>
  );

  return (
    <div
      className="flex flex-shrink-0 items-center justify-between gap-1 overflow-x-auto overflow-y-hidden border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2 text-xs text-[var(--workspace-text-muted)]"
      style={{ minHeight: "24px", height: "24px", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-0 overflow-x-auto" style={{ height: "24px" }}>
        <span className="shrink-0 px-2">{sizeFormatted}</span>
        <span className="shrink-0 select-none text-[var(--workspace-border)]">·</span>
        {cursorPosition ? (
          <span className="shrink-0 tabular-nums px-2">{cursorPosition}</span>
        ) : (
          <span className="shrink-0 tabular-nums px-2">{lineCount} lines</span>
        )}
        {encoding && (
          <>
            <span className="shrink-0 select-none text-[var(--workspace-border)]">·</span>
            <span className="shrink-0 tabular-nums px-2">{encoding}</span>
          </>
        )}
        {typeof indentSize === "number" && (
          <>
            <span className="shrink-0 select-none text-[var(--workspace-border)]">·</span>
            <span className="shrink-0 tabular-nums px-2">Indent {indentSize}</span>
          </>
        )}
        {inputFormatDropdown && (
          <>
            <span className="shrink-0 select-none text-[var(--workspace-border)]">·</span>
            {inputFormatDropdown}
          </>
        )}
        {onLiveTransformToggle && (
          <>
            <span className="shrink-0 select-none text-[var(--workspace-border)]">·</span>
            <Tooltip content={liveTransform ? "Live transform on" : "Live transform off"} className="shrink-0">
            <button
              type="button"
              className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 transition-all hover:bg-[var(--workspace-border)]/40 ${
                liveTransform
                  ? "text-primary"
                  : "opacity-50 hover:opacity-100 hover:text-[var(--workspace-text)]"
              }`}
              onClick={onLiveTransformToggle}
            >
              {liveTransform ? (
                <ArrowPathIcon className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <NoSymbolIcon className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="min-w-[5.5rem]">Live Transform</span>
            </button>
            </Tooltip>
          </>
        )}
        <>
          <span className="shrink-0 select-none text-[var(--workspace-border)]">·</span>
          {validInvalidEl && <span className="shrink-0 px-2">{validInvalidEl}</span>}
        </>
        {sharedLink ? (
          <>
            <span className="shrink-0 select-none text-[var(--workspace-border)]">·</span>
            <span className="shrink-0 px-2">{sharedLink}</span>
          </>
        ) : null}
        <span className="flex-1" />
      </div>
      {rightActions ? (
        <div className="flex shrink-0 flex-nowrap items-center gap-1 overflow-x-auto pr-1">{rightActions}</div>
      ) : null}
      <div className="flex shrink-0 flex-nowrap items-center pr-1">
        <FeedbackDialog trigger="icon" label="Send feedback" />
        <Tooltip content="Keyboard shortcuts" shortcut="? · ⌘/">
          <button
            type="button"
            aria-label="Keyboard shortcuts"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-border)]/40 hover:text-[var(--workspace-text)]"
            onClick={() => window.dispatchEvent(new Event("formaty:open-shortcuts"))}
          >
            <QuestionMarkCircleIcon className="h-3.5 w-3.5 shrink-0" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

export function getSizeFormatted(text: string): string {
  if (!text.trim()) return "0 B";
  return formatSize(new Blob([text]).size);
}
