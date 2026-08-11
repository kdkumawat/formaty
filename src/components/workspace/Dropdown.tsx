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
            "z-[200] min-w-[8rem] rounded-lg border border-[var(--workspace-border)]/50 bg-[var(--workspace-panel)] p-1.5 shadow-2xl",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            contentClassName,
          )}
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
