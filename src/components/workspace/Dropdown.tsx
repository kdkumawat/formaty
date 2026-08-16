"use client";

import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

interface DropdownProps {
  trigger: React.ReactNode | ((open: boolean) => React.ReactNode);
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentClassName?: string;
  rootClassName?: string;
  align?: "start" | "end";
  side?: "top" | "bottom";
  /**
   * Cap the menu width so it never balloons past the longest label's natural
   * width. Accepts any Tailwind width class, e.g. "w-72" or "max-w-[18rem]"
   * (ignored when contentClassName already sets an explicit width).
   */
  maxWidth?: string;
  /**
   * Pin the panel toward the right edge of the viewport (settings panels).
   * Radix keeps it within the viewport via collision detection.
   */
  preferScreenRight?: boolean;
  /** Gap from viewport edges when clamping (px). */
  edgePadding?: number;
}

/**
 * Controlled popover/menu. Backed by Radix UI `DropdownMenu` for accessible
 * positioning and keyboard behavior; children are rendered as-is (call sites
 * supply their own buttons/rows).
 */
export function Dropdown({
  trigger,
  children,
  open,
  onOpenChange,
  contentClassName = "",
  rootClassName = "",
  align = "start",
  side = "top",
  maxWidth = "",
  preferScreenRight = false,
  edgePadding = 8,
}: DropdownProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);

  // On reopen, bring the selected item into view (long menus like Types scroll
  // back to the active row instead of showing a random slice). Prefer an explicit
  // data-selected="true" marker; fall back to auto-detecting the active row by its
  // selected styling (!bg-primary/12), so this works globally for every menu
  // (compare lists/single, utils, output actions, …) without per-item opt-in.
  React.useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const content = contentRef.current;
      if (!content) return;
      const selected =
        content.querySelector<HTMLElement>('[data-selected="true"]') ??
        content.querySelector<HTMLElement>('[class*="!bg-primary/12"]');
      selected?.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const menuAlign: "start" | "center" | "end" = preferScreenRight ? "end" : align;
  // Width: content-sized (w-max) by default, capped by maxWidth when it's a
  // max-w-* class; an explicit w-* maxWidth becomes the width outright.
  // contentClassName callers that set an explicit width keep it.
  const widthCls = /w-\[/.test(contentClassName)
    ? ""
    : maxWidth
      ? maxWidth.startsWith("max-w-")
        ? `w-max ${maxWidth}`
        : maxWidth
      : "w-max";

  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenu.Trigger asChild>
        <div className={cn("cursor-pointer", rootClassName)}>
          {typeof trigger === "function" ? trigger(open) : trigger}
        </div>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          ref={contentRef}
          side={side}
          align={menuAlign}
          collisionPadding={edgePadding}
          alignOffset={preferScreenRight ? -6 : 0}
          className={cn(
            // Borderless by design - a soft shadow + hairline ring (Linear/Vercel-style).
            // Width is content-sized (w-max) by default; callers can cap it via maxWidth.
            "z-[200] min-w-[9rem] rounded-lg bg-popover p-1.5 text-popover-foreground shadow-xl shadow-black/15 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/10",
            widthCls,
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-1.5",
            contentClassName,
          )}
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
