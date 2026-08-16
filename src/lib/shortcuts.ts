/**
 * Shared keyboard-shortcut reference data for Formaty's workspace.
 *
 * Used by the KeyboardShortcutsOverlay (rendered on the playground page) and kept
 * in sync with the shortcut handlers in WorkspaceContent.
 */

export interface ShortcutItem {
  keys: string;
  label: string;
}

export interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Global",
    items: [
      { keys: "⌘K · ⌘⇧P", label: "Command palette" },
      { keys: "⌘/ · ?", label: "Keyboard shortcuts" },
      { keys: "⌘↵", label: "Parse / transform input" },
      { keys: "⌘⇧E", label: "Share workspace" },
      { keys: "⌥N · ⌥W", label: "New / close tab" },
      { keys: "Esc", label: "Close dialogs & panels" },
    ],
  },
  {
    title: "Transform",
    items: [
      { keys: "⌘⇧B", label: "Beautify" },
      { keys: "⌘⇧M", label: "Minify" },
      { keys: "⌘⌥R", label: "Reset input & output" },
      { keys: "⌘⇧D", label: "Compare mode" },
      { keys: "⌘⇧U", label: "Utils mode" },
      { keys: "⌘⇧L", label: "Toggle live transform" },
    ],
  },
  {
    title: "Views",
    items: [
      { keys: "⌘1", label: "Raw" },
      { keys: "⌘2", label: "Tree" },
      { keys: "⌘3", label: "Graph" },
      { keys: "⌘4", label: "Query (JSONPath / JMESPath)" },
      { keys: "⌘5", label: "Table" },
    ],
  },
  {
    title: "Editing",
    items: [
      { keys: "⌘C", label: "Copy output" },
      { keys: "⌘Z", label: "Undo input" },
      { keys: "⌘⇧Z · ⌘Y", label: "Redo input" },
      { keys: "⌥↑ · ⌥↓", label: "Step through input history" },
      { keys: "⌘V", label: "Paste from clipboard (empty input)" },
      { keys: "⌘F", label: "Find in focused pane" },
      { keys: "⌘⇧S", label: "Download output" },
    ],
  },
  {
    title: "Focus & zoom",
    items: [
      { keys: "⌥1", label: "Focus input pane" },
      { keys: "⌥2", label: "Focus output pane" },
      { keys: "⌥Z", label: "Toggle line wrap" },
      { keys: "⌥M", label: "Maximize output pane" },
      { keys: "⌥T", label: "Toggle theme" },
      { keys: "⌘+ · ⌘−", label: "Increase / decrease font size" },
      { keys: "⌘0", label: "Reset font size" },
    ],
  },
];

const IS_MAC =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);

/** True on macOS / iOS (⌘ keys shown); false on Windows / Linux (Ctrl keys shown). */
export function isMacOS(): boolean {
  return IS_MAC;
}

const MODIFIER_TO_PC: Record<string, string> = {
  "⌘": "Ctrl",
  "⇧": "Shift",
  "⌥": "Alt",
};

/**
 * Render a shortcut written in Mac notation for the current platform:
 * "⌘⇧B" stays "⌘⇧B" on macOS but becomes "Ctrl+Shift+B" on Windows/Linux.
 */
export function displayShortcut(keys: string): string {
  if (IS_MAC) return keys;
  let out = "";
  let i = 0;
  while (i < keys.length) {
    const ch = keys[i];
    if (ch === "⌘" || ch === "⇧" || ch === "⌥") {
      const mods: string[] = [];
      while (i < keys.length && (keys[i] === "⌘" || keys[i] === "⇧" || keys[i] === "⌥")) {
        mods.push(MODIFIER_TO_PC[keys[i]]);
        i++;
      }
      out += `${mods.join("+")}+`;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

/** True when the keydown target is a text field, contenteditable, or textbox role. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as HTMLElement).tagName !== "string") return false;
  const el = target as HTMLElement;
  return (
    el.isContentEditable ||
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.getAttribute?.("role") === "textbox"
  );
}
