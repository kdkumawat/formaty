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
      { keys: "⌘K", label: "Command palette" },
      { keys: "⌘/ · ?", label: "Keyboard shortcuts" },
      { keys: "⌘↵", label: "Parse / transform input" },
      { keys: "Esc", label: "Close dialogs & panels" },
    ],
  },
  {
    title: "Transform",
    items: [
      { keys: "⌘⇧B", label: "Beautify" },
      { keys: "⌘⇧M", label: "Minify" },
      { keys: "⌘⇧D", label: "Compare mode" },
      { keys: "⌘⇧U", label: "Utils mode" },
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
      { keys: "⌘Z", label: "Undo input" },
      { keys: "⌘⇧Z · ⌘Y", label: "Redo input" },
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
      { keys: "⌘+ · ⌘−", label: "Increase / decrease font size" },
      { keys: "⌘0", label: "Reset font size" },
    ],
  },
];

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
