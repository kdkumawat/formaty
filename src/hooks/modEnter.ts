import type { KeyboardEvent } from "react";

/** Selector the global playground Cmd/Ctrl+Enter handler uses to stand down (see WorkspaceContent). */
export const MOD_ENTER_SELECTOR = "[data-mod-enter]";

/**
 * Props that make Cmd/Ctrl+Enter (and plain Ctrl+Enter on macOS) fire `action` for everything inside
 * the element they are spread on. Ignores IME composition and does nothing while `disabled`.
 * The data attribute tells the global handler not to also run the playground parse.
 */
export function modEnterProps(action: () => void, disabled = false) {
  return {
    "data-mod-enter": "",
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key !== "Enter" || !(e.metaKey || e.ctrlKey) || e.nativeEvent.isComposing) return;
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) action();
    },
  };
}
