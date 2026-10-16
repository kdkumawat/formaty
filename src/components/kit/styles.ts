/** Shared class strings for the kit. Internal: import components, not these. */

export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]";

/** Control heights: sm is the dense default (28px, 36px below 900px for touch). */
export const HEIGHT = {
  sm: "h-7 max-[900px]:h-9",
  md: "h-9",
  lg: "h-11",
} as const;

export type KitSize = keyof typeof HEIGHT;

/** Floating surface (menus, panels). 140ms fade plus 4px slide on open. */
export const surface =
  "z-[200] bg-popover text-[var(--workspace-text)] shadow-menu outline-none transition-[opacity,translate] duration-[140ms] ease-out starting:opacity-0 data-[side=bottom]:starting:-translate-y-1 data-[side=top]:starting:translate-y-1 data-[side=left]:starting:translate-x-1 data-[side=right]:starting:-translate-x-1";

export const mutedText = "text-[var(--workspace-text-muted)]";
