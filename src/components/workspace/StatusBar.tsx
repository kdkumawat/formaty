"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { LockClosedIcon } from "@heroicons/react/16/solid";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { Tooltip } from "@/components/kit";

interface StatusBarProps {
  /** Left-hand details for the active tab kind. */
  details: ReactNode;
  liveTransform: boolean;
  onLiveTransform: (v: boolean) => void;
  indent: number;
  onCycleIndent: () => void;
  onShortcuts: () => void;
}

const sep = <span className="select-none text-[var(--workspace-border)] max-sm:hidden" aria-hidden>·</span>;
// Plain text buttons: the 24px row is too short for a 28px kit Button.
const textBtn =
  "inline-flex h-5 cursor-pointer items-center rounded px-1.5 transition-colors hover:bg-control hover:text-[var(--workspace-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]";

/** Single 24px row at the bottom of the window. Below 640px it keeps the privacy note, validity and Live. */
export function StatusBar({ details, liveTransform, onLiveTransform, indent, onCycleIndent, onShortcuts }: StatusBarProps) {
  return (
    <div
      data-tour="status-bar"
      className="flex h-6 shrink-0 items-center justify-between gap-3 overflow-hidden whitespace-nowrap border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3 text-[12px] text-[var(--workspace-text-muted)]"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Link href="/docs#privacy" className="inline-flex shrink-0 items-center gap-1 hover:text-[var(--workspace-text)]">
          <LockClosedIcon className="size-3.5" aria-hidden />
          <span className="max-[420px]:hidden">Nothing leaves this device</span>
          <span className="hidden max-[420px]:inline">Private</span>
        </Link>
        {details && sep}
        {details}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Tooltip content={liveTransform ? "Live transform is on. Click to turn it off" : "Live transform is off. Click to turn it on"} shortcut="⌘⇧L" side="top">
          <button type="button" role="switch" aria-checked={liveTransform} className={textBtn} onClick={() => onLiveTransform(!liveTransform)}>
            <span className={`mr-1.5 size-1.5 rounded-full ${liveTransform ? "bg-ok" : "bg-[var(--workspace-text-muted)] opacity-50"}`} aria-hidden />
            Live
          </button>
        </Tooltip>
        <Tooltip content="Indent width. Click to switch between 2 and 4 spaces" side="top">
          <button type="button" className={`${textBtn} max-sm:hidden`} onClick={onCycleIndent}>
            {indent === 0 ? "No indent" : `${indent} spaces`}
          </button>
        </Tooltip>
        <Tooltip content="Keyboard shortcuts" shortcut="⌘/" side="top">
          <button type="button" className={`${textBtn} max-sm:hidden`} onClick={onShortcuts}>
            Shortcuts
          </button>
        </Tooltip>
        <span className="max-sm:hidden">
          <FeedbackDialog trigger="link" label="Feedback" className={`${textBtn} !text-[12px]`} />
        </span>
      </div>
    </div>
  );
}
