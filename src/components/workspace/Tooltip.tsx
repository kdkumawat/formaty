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
          {content}
        </TooltipContent>
      </UiTooltip>
    </TooltipProvider>
  );
}
