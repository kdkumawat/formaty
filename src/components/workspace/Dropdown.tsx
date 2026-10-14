"use client";

import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { menuCheck, menuItemActiveClass, menuItemClass } from "./menuStyles";

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
        content.querySelector<HTMLElement>('[data-selected="true"]');
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
            "z-[200] min-w-[9rem] rounded-[10px] bg-popover p-1 text-popover-foreground shadow-menu",
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

interface DropdownItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  /** Link item (renders an anchor so it can be opened normally). */
  href?: string;
  /** Show a check mark column and the selected style. Omit for plain actions. */
  checked?: boolean;
  /** Leave the menu open after selecting (toggles). */
  keepOpen?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
}

/**
 * One menu row: 28px, 13px, check mark for the current choice, arrow-key
 * navigation and typeahead from Radix. Use inside `Dropdown` everywhere.
 */
export function DropdownItem({ children, onSelect, href, checked, keepOpen, disabled, title, className }: DropdownItemProps) {
  const cls = cn(menuItemClass, checked && menuItemActiveClass, className);
  const handle = (e: Event) => {
    if (keepOpen) e.preventDefault();
    onSelect?.();
  };
  const body = (
    <>
      {checked !== undefined && menuCheck(checked)}
      {children}
    </>
  );
  if (href) {
    const external = /^https?:/.test(href);
    return (
      <DropdownMenu.Item asChild onSelect={handle}>
        <a href={href} className={cls} title={title} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {body}
        </a>
      </DropdownMenu.Item>
    );
  }
  return (
    <DropdownMenu.Item
      disabled={disabled}
      onSelect={handle}
      title={title}
      data-selected={checked ? "true" : undefined}
      className={cls}
    >
      {body}
    </DropdownMenu.Item>
  );
}
