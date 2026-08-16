# Guided Tour for First-Time Users — Spec

**Status:** Draft (interview complete, no code written yet)
**Version:** 1.0
**Date:** August 2026

---

## 1. Goal

Give first-time users a **comprehensive but passive** guided tour of the Formaty workspace so they understand the product's core surface — input/output, transforms, Compare, Utils, views, tabs, settings, and the command palette — within ~1 minute, without them having to read docs.

The tour is a **spotlight + tooltip walkthrough** (highlight a UI element, explain it, user clicks Next). It performs **no destructive actions**; the only side effect is loading a sample JSON payload into the input so the output-pane steps show real rendered content.

---

## 2. Interview decisions (locked)

| Topic | Decision |
|---|---|
| Location | **Workspace only** (playground / bare workspace). Landing page untouched. |
| Trigger | **Auto-start after a short delay** (~1.2s once the workspace settles) for first-timers |
| Existing quick-tip toast | **Keep the mechanism** (later visits, empty states) — but it is **suppressed for the rest of the first session** once the tour runs |
| Behavior | **Spotlight + tooltip only** — no auto-clicking, no demo actions |
| Length | **Comprehensive, 9–12 steps** |
| Coverage | All areas: Transform flow, Compare tab, Utils tab, Output views, Command palette & shortcuts, Settings & tabs |
| Implementation | **Custom component** (recommended): framer-motion + existing Radix/shadcn primitives, matching codebase conventions. **No new dependency.** |
| Persistence | **Reuse `formaty-onboarded`** localStorage key + **explicit replay** entry points |
| Controls | Skip / Next / Back / step dots; Esc closes; replay via ⌘K command |
| Replay entry | **Settings panel button + ⌘K command + status-bar help affordance** (near the existing `?` shortcuts button) |
| Mobile | **Desktop-first, degrade gracefully** — under the desktop breakpoint show a scrollable step-list card instead of precise highlights |
| Suppression | Do **not** run when `embed=1` or a `?tool=` preset is loaded (mid-workflow landings) |
| Sample data | **Load sample JSON into the input** at the intro step so output steps show real content |
| Analytics | Track `tour_started` / `tour_completed` / `tour_skipped` via the existing consent-gated `trackEvent` helper |
| Finale | End on the **command palette (⌘K)** — "run anything by name" + Done |
| Tone | **Concise dev-speak** ("Paste JSON, get a tree. Switch views here.") |

---

## 3. Trigger & timing

1. `WorkspaceContent` mounts; the tour decides whether to run **once**, after the workspace has settled:
   - Delay: **~1,200 ms** after mount (long enough for the layout + Monaco to render).
   - If the editor isn't ready when a step's target is resolved, the step waits (see §7 target resolution).
2. Auto-run **only** when ALL of these hold:
   - `localStorage.getItem("formaty-onboarded") !== "1"` (first-time)
   - Not an `embed=1` render
   - No `?tool=` preset loaded (no `loadedToolPreset`)
   - Not a shared-session load (`?id=`) — *recommendation, see §Open questions*
   - Not already open (no duplicate instance)
3. On auto-start:
   - Set the session flag so the quick-tip toast does **not** fire (`showFirstRunHint` stays false; the existing 8s auto-hide effect never arms).
   - Fire `trackEvent("tour_started", { source: "auto" })`.

---

## 4. Step outline (11 steps)

Steps are ordered to tell a coherent story: input → output → views → menus → tools → tabs → settings → palette.

| # | Target | Copy (draft, dev-speak) |
|---|---|---|
| 1 | **Intro card** (centered, no highlight) — *"Welcome to Formaty"* | "The Developer Data Workspace. Everything runs locally — your data never leaves the browser. Sample data is loaded so you can poke around." **← loads `SAMPLE_JSON` + runs parse here** |
| 2 | **Input editor** (`data-tour="input-editor"`) | "Paste JSON, CSV, YAML, XML, or a cURL — the format is auto-detected. This is your input." |
| 3 | **Output pane** (`data-tour="output-pane"`) | "Formatted output, computed instantly. Raw, Tree, Graph, Query, and Table views are all here." |
| 4 | **View switcher** (Raw / Tree / Graph / Query / Table, `data-tour="view-switcher"`) | "Switch how you look at the same data — tree for structure, query for JSONPath, table for rows." |
| 5 | **Format / View / Actions / Types menus** (`data-tour="toolbar-menus"`) | "Beautify, minify, validate, generate types, copy as SQL — the whole toolbox lives in these menus." |
| 6 | **Compare tab** (`data-tour="compare-tab"`) | "Compare document diffs or two lists — with SQL IN generation for database debugging." |
| 7 | **Utils tab** (`data-tour="utils-tab"`) | "UUIDs, Base64, JWT, hashes, time, regex — a whole toolkit that never touches a server." |
| 8 | **Tab bar** (`data-tour="tab-bar"`) | "Keep multiple sessions in tabs. Each tab remembers its own view, format, and pins." |
| 9 | **Status bar** (`data-tour="status-bar"`) | "Line count, size, validity, cursor position — and Live Transform updates output as you type." |
| 10 | **Settings gear** (`data-tour="settings-gear"`) | "Theme, line wrap, format-on-paste, pinned toolbar favorites, and replaying this tour live here." |
| 11 | **Command palette** (`data-tour="command-palette"`, highlight the trigger in the header) | "⌘K (Ctrl+K) runs any action by name — the fastest way around. That's it. You're ready." **Done button** |

Step 11 copy should be treated as the takeaway; the palette trigger is highlighted, not opened.

---

## 5. Spotlight + tooltip UI

- **Spotlight:** a rounded rectangle that "cuts out" the target element (screen-sized overlay with a hole), dimming everything else. Target gets a subtle ring highlight (respects `--primary` / theme variables).
- **Tooltip card:** fixed-position card attached to the highlighted element (above/below/left/right auto-flipped), containing:
  - Step title (small caps) + body copy
  - **Step dots** (current / total)
  - **Back** (ghost, disabled on step 1) · **Next** (primary) · **Skip** (text)
  - Closes on **Esc**
- **Intro (step 1) and finale (step 11):** centered cards, no spotlight.
- Animations via `framer-motion` (fade/scale, ~150–200 ms), wrapped in `MotionConfig reducedMotion="user"` to honor reduced-motion preferences.
- The card is portaled (rendered at `document.body`) so it can never be clipped by workspace panes.
- While open, the card receives initial focus (role `dialog`, `aria-modal="false"` so the rest of the page stays usable — the tour is passive); Tab order cycles the card's controls.

### Mobile / compact fallback (< 1280px, i.e. `!isDesktopLayout`)

- No spotlight, no coordinate math. Render the same steps as a **scrollable centered card** (max-width ~92vw) with the same controls.
- Steps still list titles/copy so the content is identical, just without precise element highlighting.

---

## 6. Sample data behavior

- At **step 1 (intro)**, load the sample so all subsequent steps show real output:
  - Reuse the existing empty-state sample path: `setInput(SAMPLE_JSON)` + `parseOnly(SAMPLE_JSON, "json")` (same call the empty-state sample buttons use), **without** pushing to undo history or toasting.
  - This renders the output pane with the parsed JSON tree so steps 3–5 point at real content.
- If the user already has input (edge: first-run flag set but input non-empty — e.g. restored session), skip loading the sample; tour proceeds with their data.
- Loading is silent (no toast); the tour's copy at step 1 mentions it.

---

## 7. Target resolution

- Add stable `data-tour` attributes to the elements the tour highlights (see step table) rather than relying on CSS-class selectors that may change.
- Resolution: when advancing to a step, look up the element. If absent (Monaco/panes mount async), **retry every 100 ms up to ~3 s**, then fall back to a centered card (no spotlight) for that step rather than failing.
- On each step: `scrollIntoView({ block: "nearest", behavior: "smooth" })` if the target is off-screen (should be rare — the workspace is one screen).
- Recompute the spotlight rect on resize/scroll (listen, debounce ~100 ms) so the highlight stays glued to the element.

---

## 8. Persistence & replay

- **First-run flag:** reuse `formaty-onboarded` (value `"1"`).
  - Set on **tour completion**, on **Skip**, and on **Esc** (same as the current quick-tip dismissal).
  - `Clear cache & reload` wipes localStorage → tour will re-show on the next load (accepted).
  - `Reset to default (all tabs)` does **not** touch the flag (it resets settings, not tour state).
- **Replay** (does not change the flag):
  1. **Settings panel** — "Replay tour" button (in the General section, near reset controls).
  2. **Command palette** — new command "Take the tour" (group: Settings).
  3. **Status bar** — a small help affordance next to the existing `?` shortcuts button (dispatches a `formaty:replay-tour` window event, same pattern as `formaty:open-shortcuts`).
  - Replay events: `trackEvent("tour_started", { source: "settings" | "palette" | "statusbar" })`.
- Replay works even if the user is mid-flow (any tab/mode); it doesn't reset their input or state. Steps highlight whatever is currently rendered.

---

## 9. Analytics

| Event | When | Properties |
|---|---|---|
| `tour_started` | auto-start or replay | `source: auto / settings / palette / statusbar` |
| `tour_completed` | Done clicked on final step | `steps: <n>` |
| `tour_skipped` | Skip or Esc | `step: <n>` (the step they left) |

All via the existing consent-gated `trackEvent` helper — no new analytics plumbing.

---

## 10. Implementation plan (recommended)

**Custom component — rationale:** the codebase already builds everything custom (Dropdown, Tooltip, KeyboardShortcutsOverlay) on Radix + framer-motion; a tour library (react-joyride / driver.js) would add a dependency with its own styling that fights the app's theme. A custom spotlight is ~200 lines and matches the established patterns.

**New files:**
- `src/components/GuidedTour.tsx` — the tour state machine + spotlight + tooltip card + mobile fallback.
  - Props: `open`, `onOpenChange`, `onDone` (marks onboarded + fires analytics).
  - Step definitions live here or in `src/lib/tourSteps.ts` (keeps the component lean, mirrors `SHORTCUT_GROUPS` in `src/lib/shortcuts.ts`).

**Edits to existing files:**
- `src/components/WorkspaceContent.tsx`
  - Add `data-tour` attributes to the ~10 targets (tab bar, toolbar tabs, menus row, view switcher, status bar, settings gear, command-palette trigger, input/output panes).
  - Mount `<GuidedTour>`; wire the auto-start decision (delay + suppression checks incl. `loadedToolPreset` / `embed`) and the session toast suppression.
  - Add "Replay tour" to the Settings panel content + the command palette command list (`commandPaletteCommands`).
  - Ensure the tour and the 8s quick-tip timer never both arm in the first session.
- `src/components/workspace/StatusBar.tsx` (or wherever the `?` button lives) — add the replay affordance dispatching `formaty:replay-tour`.

**Non-goals:** no new dependency; no landing-page tour; no auto-advance; no changes to `formaty-onboarded` semantics beyond what's described.

---

## 11. Edge cases & accessibility

- **Embed / tool preset landings:** tour suppressed (decided). Shared-link (`?id=`) landings: suppress too (recommendation — see Open questions).
- **User interacts mid-tour** (starts typing/clicking): keep the tour running (it's passive); Skip is always available. Spotlight must not block pointer events on the page (hole is `pointer-events: none`).
- **Monaco not yet mounted** when a step targets the input/output: target-retry fallback (§7).
- **Theme:** spotlight + card use `var(--workspace-*)` tokens and `--primary` so light/dark/system all work.
- **Reduced motion:** `MotionConfig reducedMotion="user"`.
- **A11y:** `role="dialog"`, `aria-label="Product tour"`, initial focus on the card, Esc closes, controls are real `<button>`s with focus rings; no focus trap (page stays usable).
- **SessionStorage / admin:** tour never runs on `/admin` (not part of the workspace render).
- **Double-arming:** guard so the tour can't open twice (ref check) and the quick-tip toast is suppressed for the first session once the tour starts.
- **Very small screens:** mobile fallback card handles it; no coordinate math below 1280px.

---

## 12. Verification plan (for the implementation phase)

- Typecheck + lint + existing test suite (123 tests) pass.
- Headless-browser walkthrough (CDP, same approach used for the Ctrl+Enter work):
  - First visit (no flag): tour auto-starts after delay, sample JSON loads, output renders, all 11 steps resolve, Done sets `formaty-onboarded`.
  - `embed=1` and `?tool=json-formatter` landings: no tour.
  - Skip/Esc sets the flag; replay from Settings / ⌘K / status bar re-opens it.
  - Second visit (flag set): no auto-start, quick-tip toast behavior unchanged.
- Confirm exactly one `tour_started` event on auto-start and one `tour_completed` on Done.

---

## 13. Open questions (for later)

1. **Shared-link (`?id=`) landings:** confirm the tour is suppressed there too (recommended — they're mid-workflow, like tool presets).
2. **Exact copy:** the drafts in §4 are placeholders; user may want to polish wording ("I'll write the copy" was not chosen, but final wording should still be reviewed).
3. **Mid-tour interaction:** keep-running (recommended) vs. auto-dismiss-on-first-keystroke — confirm preference.
4. **Step 1 sample-load timing:** load immediately at tour start vs. when step 2 (input) is reached — immediate is recommended so the output is ready by step 3.
5. **Replay while a tool preset is loaded:** allow (recommended — it's a replay, not a first-run) — confirm.
