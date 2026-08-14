"use client";

import type { ReactNode } from "react";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Side = "top" | "bottom" | "left" | "right";

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: Side;
  className?: string;
  disabled?: boolean;
  /** Optional keyboard-shortcut hint rendered as a kbd chip at the end of the tooltip. */
  shortcut?: string;
};

/**
 * Hover/focus tooltip. Backed by Radix UI for accessibility + viewport-aware
 * positioning (portaled to document.body, so it is never clipped).
 */
export function Tooltip({
  content,
  children,
  side = "bottom",
  className,
  disabled = false,
  shortcut,
}: TooltipProps) {
  if (disabled || content == null || content === "") {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <UiTooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex max-w-full", className)}>{children}</span>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-[14rem] w-max border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2 py-1 text-[10px] font-medium leading-snug text-[var(--workspace-text)] shadow-lg"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 truncate">{content}</span>
            {shortcut && (
              <kbd className="shrink-0 rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1.5 py-0.5 font-mono text-[9px] leading-none text-[var(--workspace-text-muted)]">
                {shortcut}
              </kbd>
            )}
          </span>
        </TooltipContent>
      </UiTooltip>
    </TooltipProvider>
  );
}
