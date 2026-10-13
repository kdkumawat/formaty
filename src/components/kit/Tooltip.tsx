"use client";

import { createContext, useContext, useRef, useState, type KeyboardEvent, type ReactElement, type ReactNode } from "react";
import * as T from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { Kbd } from "./Kbd";
import { usePortalContainer } from "./portal";

const HasProvider = createContext(false);

/** Mount once near the app root: 400ms open delay, then instant when moving between tooltips. Tooltip also works without it (no shared skip delay). */
export function KitTooltipProvider({ children }: { children: ReactNode }) {
  return (
    <HasProvider.Provider value>
      <T.Provider delayDuration={400} skipDelayDuration={300}>
        {children}
      </T.Provider>
    </HasProvider.Provider>
  );
}

export interface TooltipProps {
  content: ReactNode;
  /** Shortcut in Mac notation, rendered as a keycap. */
  shortcut?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  disabled?: boolean;
  /** The single element the tooltip describes; it must forward its ref and spread props. */
  children: ReactElement;
}

/** Hover and focus tooltip on an inverted surface. Never shown on touch devices. */
export function Tooltip({ content, shortcut, side = "top", align = "center", disabled, children }: TooltipProps) {
  const has = useContext(HasProvider);
  const container = usePortalContainer();
  const [open, setOpen] = useState(false);
  // Set once the trigger is used (click, key). Blocks reopening from the focus a closing menu hands back,
  // until the pointer re-enters the trigger or Tab is pressed on it.
  const used = useRef(false);
  const empty = disabled || content == null || content === "";
  const use = () => {
    used.current = true;
    setOpen(false);
  };
  const node = (
    <T.Root open={open && !empty} onOpenChange={(o) => (o && used.current ? undefined : setOpen(o))}>
      <T.Trigger
        asChild
        onPointerDown={use}
        onClick={use}
        onPointerEnter={() => (used.current = false)}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === "Tab") used.current = false;
          else use();
        }}
      >
        {children}
      </T.Trigger>
      <T.Portal container={container}>
        <T.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
          className="z-[300] flex max-w-[260px] items-center gap-2 rounded-md bg-[var(--workspace-text)] px-2 py-1 text-[12px] font-medium leading-snug text-[var(--workspace-panel)] shadow-[0_1px_2px_rgb(0_0_0/0.25),0_6px_16px_-4px_rgb(0_0_0/0.35)] transition-opacity duration-[120ms] starting:opacity-0 [@media(hover:none)]:hidden"
        >
          <span className="min-w-0 break-words">{content}</span>
          {shortcut && (
            <Kbd keys={shortcut} tone="inverse" />
          )}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
  return has ? node : <T.Provider delayDuration={400} skipDelayDuration={300}>{node}</T.Provider>;
}

/** Single-line text that shows its full value in a Tooltip only when it is actually cut off. */
export function TruncatedText({
  children,
  className,
  side = "top",
}: {
  children: string;
  className?: string;
  side?: TooltipProps["side"];
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);
  const check = () => {
    const el = ref.current;
    if (el) setTruncated(el.scrollWidth > el.clientWidth);
  };
  return (
    <Tooltip content={children} disabled={!truncated} side={side}>
      <span ref={ref} onPointerEnter={check} onFocus={check} className={cn("block truncate", className)}>
        {children}
      </span>
    </Tooltip>
  );
}
