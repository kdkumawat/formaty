"use client";

import type { ReactNode } from "react";

type Side = "top" | "bottom" | "left" | "right";

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: Side;
  className?: string;
  disabled?: boolean;
};

const sideClass: Record<Side, string> = {
  top: "bottom-full left-1/2 mb-1.5 -translate-x-1/2 origin-bottom",
  bottom: "top-full left-1/2 mt-1.5 -translate-x-1/2 origin-top",
  left: "right-full top-1/2 mr-1.5 -translate-y-1/2 origin-right",
  right: "left-full top-1/2 ml-1.5 -translate-y-1/2 origin-left",
};

/**
 * Lightweight hover tooltip with fade + scale.
 */
export function Tooltip({
  content,
  children,
  side = "bottom",
  className = "",
  disabled = false,
}: TooltipProps) {
  if (disabled || content == null || content === "") {
    return <>{children}</>;
  }

  return (
    <span className={`group/tip relative inline-flex max-w-full ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-[200] w-max max-w-[14rem] rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2 py-1 text-center text-[10px] font-medium leading-snug text-[var(--workspace-text)] opacity-0 shadow-lg transition-[opacity,transform] duration-150 ease-out scale-95 group-hover/tip:scale-100 group-hover/tip:opacity-100 group-focus-within/tip:scale-100 group-focus-within/tip:opacity-100 ${sideClass[side]}`}
      >
        {content}
      </span>
    </span>
  );
}
