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
  preferScreenRight = false,
  edgePadding = 8,
}: DropdownProps) {
  const menuAlign: "start" | "center" | "end" = preferScreenRight ? "end" : align;

  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenu.Trigger asChild>
        <div className={cn("cursor-pointer", rootClassName)}>
          {typeof trigger === "function" ? trigger(open) : trigger}
        </div>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side={side}
          align={menuAlign}
          collisionPadding={edgePadding}
          alignOffset={preferScreenRight ? -6 : 0}
          className={cn(
            // Borderless by design - a soft shadow + hairline ring (Linear/Vercel-style).
            "z-[200] min-w-[9rem] rounded-lg bg-popover p-1.5 text-popover-foreground shadow-xl shadow-black/15 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/10",
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
