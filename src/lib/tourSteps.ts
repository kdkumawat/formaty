import { displayShortcut } from "@/lib/shortcuts";

/**
 * Guided-tour step definitions for the Formaty workspace.
 *
 * Steps target stable `data-tour` attributes (see guided-tour-spec.md §7) so the
 * tour survives class-name churn. Centered steps (intro / finale) render a card
 * without a spotlight. Copy is deliberately concise dev-speak.
 */

export interface TourStep {
  /** Stable step id (also used for analytics). */
  id: string;
  /** Value of the `data-tour` attribute to highlight. Omit for intro-style steps. */
  target?: string;
  /** Small-caps title shown above the body. */
  title: string;
  /** Body copy. */
  body: string;
  /** Centered card without spotlight (intro / finale). */
  centered?: boolean;
}

/** ⌘K on macOS, Ctrl+K elsewhere - shown in the finale copy. */
const PALETTE_SHORTCUT = displayShortcut("⌘K");

export const TOUR_STEPS: TourStep[] = [
  {
    id: "intro",
    centered: true,
    title: "Welcome to Formaty",
    body: "The Developer Data Workspace. Everything runs locally. Your data never leaves the browser. Sample data is loaded so you can poke around.",
  },
  {
    id: "input-editor",
    target: "input-editor",
    title: "Input",
    body: "Paste JSON, CSV, YAML, XML, or a cURL. The format is auto-detected. This is your input.",
  },
  {
    id: "output-pane",
    target: "output-pane",
    title: "Output",
    body: "Formatted output, computed instantly. Raw, Tree, Graph, Query, and Table views are all here.",
  },
  {
    id: "view-switcher",
    target: "view-switcher",
    title: "Views",
    body: "Switch how you look at the same data. Tree for structure, query for JSONPath, table for rows.",
  },
  {
    id: "toolbar-menus",
    target: "toolbar-menus",
    title: "Toolbox",
    body: "Beautify, minify, validate, generate types, copy as SQL. The whole toolbox lives in these menus.",
  },
  {
    id: "compare-tab",
    target: "compare-tab",
    title: "Compare",
    body: "Compare document diffs or two lists, with SQL IN generation for database debugging.",
  },
  {
    id: "utils-tab",
    target: "utils-tab",
    title: "Utils",
    body: "UUIDs, Base64, JWT, hashes, time, regex. A whole toolkit that never touches a server.",
  },
  {
    id: "tab-bar",
    target: "tab-bar",
    title: "Tabs",
    body: "Keep multiple sessions in tabs. Each tab remembers its own view, format, and pins.",
  },
  {
    id: "status-bar",
    target: "status-bar",
    title: "Status bar",
    body: "Line count, size, validity, cursor position. Live Transform updates output as you type.",
  },
  {
    id: "settings-gear",
    target: "settings-gear",
    title: "Settings",
    body: "Theme, line wrap, format-on-paste, pinned toolbar favorites, and replaying this tour live here.",
  },
  {
    id: "command-palette",
    target: "command-palette",
    centered: true,
    title: "Command palette",
    body: `${PALETTE_SHORTCUT} runs any action by name. The fastest way around. That's it. You're ready.`,
  },
];
