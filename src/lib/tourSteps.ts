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
    body: "Formatted output, computed instantly. Text, Table, Tree, Graph and Query views are all here.",
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
    title: "Output",
    body: "Pick what you get: JSON, YAML, CSV, SQL, types, schemas. Options holds sort keys, indent and the rest.",
  },
  {
    id: "new-tab",
    target: "new-tab",
    title: "New tab",
    body: "Open a Transform, Compare or Utils tab. UUIDs, Base64, JWT, hashes, time and regex never touch a server.",
  },
  {
    id: "tab-bar",
    target: "tab-bar",
    title: "Tabs",
    body: "Keep several sessions open. Each tab remembers its own input, output and view.",
  },
  {
    id: "status-bar",
    target: "status-bar",
    title: "Status bar",
    body: "Size, cursor position and validity. Live toggles transforming as you type.",
  },
  {
    id: "settings-gear",
    target: "settings-gear",
    title: "Settings",
    body: "Theme, font size, line wrap and format-on-paste live here.",
  },
  {
    id: "command-palette",
    target: "command-palette",
    centered: true,
    title: "Command palette",
    body: `${PALETTE_SHORTCUT} runs any action by name. The fastest way around. That's it. You're ready.`,
  },
];
