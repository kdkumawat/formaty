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

const sep = <span className="select-none text-[var(--input)] max-sm:hidden" aria-hidden>·</span>;
// Plain text buttons: the 28px row is too short for a 28px kit Button.
const textBtn =
  "inline-flex h-5 cursor-pointer items-center rounded px-1.5 transition-colors hover:bg-control hover:text-[var(--workspace-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]";

/** Single 28px row at the bottom of the window. Left: the active tab's state. Right: Live, privacy, encoding, Feedback. Below 640px it keeps the privacy note, validity and Live. */
export function StatusBar({ details, liveTransform, onLiveTransform, indent, onCycleIndent }: StatusBarProps) {
  return (
    <div
      data-tour="status-bar"
      className="flex h-7 shrink-0 items-center justify-between gap-3 overflow-hidden whitespace-nowrap border-t border-[var(--workspace-border)] bg-[var(--workspace-background)] px-3 text-[12px] text-[var(--workspace-text-muted)]"
    >
      <div className="flex min-w-0 items-center gap-2">{details}</div>
      <div className="flex shrink-0 items-center gap-2">
        <Tooltip content={liveTransform ? "Live transform is on. Click to turn it off" : "Live transform is off. Click to turn it on"} shortcut="⌘⇧L" side="top">
          <button type="button" role="switch" aria-checked={liveTransform} className={textBtn} onClick={() => onLiveTransform(!liveTransform)}>
            <span className={`mr-1.5 size-1.5 rounded-full ${liveTransform ? "bg-ok" : "bg-[var(--workspace-text-muted)] opacity-50"}`} aria-hidden />
            <span className="max-sm:hidden">Live transform</span>
            <span className="sm:hidden">Live</span>
          </button>
        </Tooltip>
        {sep}
        <Link href="/docs#privacy" className="inline-flex shrink-0 items-center gap-1 hover:text-[var(--workspace-text)]">
          <LockClosedIcon className="size-3.5" aria-hidden />
          <span className="max-[420px]:hidden">Nothing leaves this device</span>
          <span className="hidden max-[420px]:inline">Private</span>
        </Link>
        {sep}
        <Tooltip content="Indent width. Click to switch between 2 and 4 spaces" side="top">
          <button type="button" className={`${textBtn} max-sm:hidden`} onClick={onCycleIndent}>
            {indent === 0 ? "No indent" : `${indent} spaces`}
          </button>
        </Tooltip>
        <span className="max-sm:hidden">{sep}</span>
        <span className="max-sm:hidden">UTF-8</span>
        <span className="max-sm:hidden">{sep}</span>
        <span className="max-sm:hidden">
          <FeedbackDialog trigger="link" label="Feedback" className={`${textBtn} !text-[12px]`} />
        </span>
      </div>
    </div>
  );
}
