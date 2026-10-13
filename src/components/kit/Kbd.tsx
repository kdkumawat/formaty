"use client";

import { useSyncExternalStore, type HTMLAttributes } from "react";
import { isMacOS } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

const noop = () => () => {};

/** Mac notation to PC notation, e.g. "⌘⇧K" becomes "Ctrl+Shift+K". */
function pc(keys: string) {
  return keys.replace(/⌘/g, "Ctrl+").replace(/⇧/g, "Shift+").replace(/⌥/g, "Alt+");
}

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  /** Shortcut in Mac notation ("⌘K", "⌘⇧S", "Esc", "↵"); converted for the current platform. */
  keys: string;
  /** "inverse" for ink or inverted surfaces (tooltips, selected rows). */
  tone?: "default" | "inverse";
}

/** Shortcut keycap. Hydration-safe: PC notation on the server and first client pass, Mac symbols after hydration on macOS. */
export function Kbd({ keys, tone = "default", className, ...rest }: KbdProps) {
  const mac = useSyncExternalStore(noop, isMacOS, () => false);
  return (
    <kbd
      className={cn(
        "inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-[5px] px-1 font-sans text-[11px] font-medium leading-none tracking-normal",
        tone === "inverse" ? "keycap-inverse" : "keycap",
        className,
      )}
      {...rest}
    >
      {mac ? keys : pc(keys)}
    </kbd>
  );
}
