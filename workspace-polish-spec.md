# Workspace Polish — Implementation Spec

**Status:** Draft (no code changes yet)
**Scope:** Compare toolbar cleanup, global toast system, multi-tab fixes, Utils optimal UI
**Primary files:** `src/components/WorkspaceContent.tsx`, `src/components/workspace/OutputActionBar.tsx`, `src/components/UtilsPanel.tsx`, new toast module, `src/components/workspace/Header.tsx` (if needed)

---

## 0. Interview decisions (source of truth)

All decisions below came from 5 rounds of `ask_user` clarifying questions.

| # | Topic | Decision |
|---|-------|----------|
| 1 | Compare → Document Export button | **Remove the entire Export dropdown** (Copy left/right/paths/report + Download report JSON all gone from the toolbar) |
| 2 | Inline diff feedback (`diffActionFlash`) | **Toast everything** — swap, beautify, copy, clear, download, and errors all fire a toast |
| 3 | Copy feedback app-wide | **Toast every copy** ("Copied", "UUID copied", etc.) |
| 4 | Toast position | **Bottom-right corner** |
| 5 | Toast stacking | **Stack up to 3**, each on its own timer |
| 6 | Toast duration | **Per type:** success/info **2s**, error **4s** |
| 7 | Link/share feedback | **Two-line toast** — "Link copied" + truncated URL below |
| 8 | Multi-tab bug | **Both**: fix label clipping/overlap AND reset numbering per session |
| 9 | Tab rename | **Yes — double-click to rename** (inline; persists for session + share) |
| 10 | Tab auto-labels | **Short context labels** — `T1` (Transform), `C2` (Compare), `U3` (Utils) |
| 11 | UUID layout | **Dense grid cards, click card = copy** |
| 12 | UUID copy UX | **Click + keyboard nav (arrows/Enter) + "Copy on generate" toggle** (auto-copies batch after New) |
| 13 | UUID controls placement | **Sticky mini-bar at the list top** (title + controls inline, close to content) |
| 14 | Utils rollout scope | **Generators first** (UUID, Password); codec/text tools in a follow-up pass |
| 15 | Diff copy commands | **Keep them in ⌘K** (only the toolbar button is removed) |
| 16 | Toast interaction | **Click to dismiss + slide/fade animation** (framer-motion) |
| 17 | "Copy on generate" persistence | **Persist as a setting, default off** |
| 18 | Tab rail width | **Keep narrow (~32px)** |

---

## 1. Remove Compare → Document Export button

### 1.1 Current state

- The document-diff toolbar (rendered when `isDiffMode && diffKind === "document"`) contains an **Export** `<Dropdown>` with:
  - Copy left
  - Copy right
  - Copy path changes
  - Copy full report
  - Download report JSON
- It is controlled by `downloadMenuOpen && isDiffMode` (`downloadMenuOpen` is shared with the global Download menu — see §1.4 for the interplay).

### 1.2 Change

- **Delete the Export `<Dropdown>` block entirely** from the document-diff toolbar.
- Keep `copyDiffText`, `downloadDiffReport`, `swapDiffSides`, `beautifyDiffSides` (still used by ⌘K commands and the global Download button).

### 1.3 Why it's safe to remove (capability preserved)

- **Global Copy** (`OutputActionBar` Copy button) already copies a **full diff report** in diff mode: `getActiveOutputText()` calls `formatDiffReport(left, right, summary, lineStats)`.
- **Global Download** (`OutputActionBar` Download) already calls `downloadDiffReport()` in diff mode.
- **⌘K commands stay** (per decision #15): `Diff: Copy left`, `Diff: Copy right`, `Diff: Copy full report`, `Diff: Download report` (lines ~2641–2644 of `WorkspaceContent.tsx`).
- The **command palette "Diff: Copy path changes"** does not currently exist as a standalone command — acceptable; the report copy covers it. (Optional: add a `diff-copy-paths` palette command for parity.)

### 1.4 `downloadMenuOpen` state cleanup

- The Export dropdown used `downloadMenuOpen && isDiffMode`. After removal, verify no other diff-mode consumer needs `downloadMenuOpen`; the global Download menu still uses `downloadMenuOpen && !isDiffMode`.
- Remove any now-dead state/branches without breaking the global Download menu.

---

## 2. Inline diff feedback → toasts (remove `diffActionFlash`)

### 2.1 Current state

- `flashDiffAction(msg)` sets `diffActionFlash`; rendered as an inline `animate-pulse` span in the document-diff toolbar (line ~3574).
- Call sites: swap (1858), beautify errors (1880, 1884), beautify ok (1891), copy (1914), copy failed (1924), download report (1944), clear (1955).

### 2.2 Change

- **Remove the inline `diffActionFlash` span** and the `flashDiffAction` → state → timeout machinery.
- Replace every `flashDiffAction(...)` call with a **toast call** (per decision #2 — toast everything).

### 2.3 Message → toast mapping (document-diff toolbar)

| Event | Toast message | Type |
|-------|--------------|------|
| Swap sides | `Swapped left ↔ right` | info (2s) |
| Beautify both sides | `Beautified both sides` | success (2s) |
| Beautify one side | `Beautified left` / `Beautified right` | success (2s) |
| Beautify invalid JSON | `Beautify needs valid JSON` | error (4s) |
| Nothing to beautify | `Nothing to beautify` | info (2s) |
| Copy left/right/paths/report | `Copied left` / `Copied right` / `Copied path changes` / `Copied full report` | success (2s) |
| Copy failed | `Copy failed` | error (4s) |
| Download report | `Report downloaded` | success (2s) |
| Clear sides | `Cleared both` / `Cleared left` / `Cleared right` | info (2s) |

---

## 3. Toast system (new)

### 3.1 Architecture

- New module, e.g. `src/components/Toast.tsx` (client component) exposing:
  - `<Toaster />` — render once at the workspace root.
  - `useToast()` hook returning `toast({ message, type?, url?, duration? })` (or a `toast` callable via context).
- Use **framer-motion** (already a dependency) for slide-in + fade + slide-out; **click on a toast dismisses it early** (decision #16).
- Theme via existing CSS vars (`--workspace-border`, `--workspace-panel`, `--workspace-text`, `text-error`, `text-primary`) so it follows light/dark.

### 3.2 Behavior (decisions #4, #5, #6, #16)

- **Position:** fixed bottom-right; stacked upward with a **max of 3 visible** (newest on top/bottom — pick one, recommend newest at bottom near the corner). Oldest auto-dismisses first if the cap is exceeded.
- **Duration:** success/info **2000ms**; error **4000ms** (overridable per call).
- **Interaction:** click anywhere on a toast to dismiss immediately; `role="status"` / `aria-live="polite"` for a11y; errors use `role="alert"`.
- **Link toast (decision #7):** when `url` is provided, render two lines — bold title ("Link copied") + truncated URL (max ~400px, `title` attr for full value).

### 3.3 Toast types

`"success" | "error" | "info"` (optionally "link" implied by `url` presence). Visual differentiation:
- success: primary/emerald accent
- error: `text-error` / red accent
- info: muted text with neutral accent
- link: title in primary + muted URL line

### 3.4 Migration checklist (replace `shareNotification` banner)

Current: single `shareNotification` string + `window.setTimeout(...)` at ~25 call sites, rendered as a fixed bottom-center banner (lines ~4479–4493). **Remove the banner entirely.**

| Call site (approx. line) | Current text | New toast |
|--------------------------|--------------|-----------|
| 954 | `Live transform off for large files` | info, 2s |
| 2117 / 2136 / 3640 / 3653 | `Downloaded` | success, 2s |
| 2121 | `Download failed` | error, 4s |
| 2215–2220 | Link copied + URL (special-cased `startsWith("http")`) | **link toast** (title + URL), 4s |
| 2237 / 2251 / 2303 / 3622 | `Copied` | success, 2s |
| 2241 / 2255 / 2305 | `Copy failed` | error, 4s |
| 2322 / 2334 / 2349 | `Reset` | success, 2s (or info) |
| 2379 | `History exported` | success, 2s |
| 2609 | `Embed URL copied` | success, 2s |
| 3869 / 4272 | `msg` (UtilsPanel `onNotify` passthrough: "Copied", "UUID copied", "Password copied", "UUIDs copied") | success, 2s |

Notes:
- `UtilsPanel` currently reports via `onNotify?.(msg)` → `WorkspaceContent` `flash(msg)` → `setShareNotification`. Replace with `useToast()` directly inside `UtilsPanel` (drop the `onNotify` prop chain).
- The **first-run "Quick tip" hint** and the **share-confirm dialog** are separate UI, **not** part of the toast system — keep them as-is.
- The `copyState` / `shareState` / `actionBounce` micro-states (button bounce animations) can stay; toasts are additive, not a replacement for button affordances.

---

## 4. Multi-tab fixes

### 4.1 Root causes (verified in code)

- **Clipping/overlap:** the tab rail is `w-8` (32px); each label is `<span style={{ writingMode: "vertical-rl", textOrientation: "mixed", maxHeight: 26 }}>` — long labels clip, and `textOrientation: "mixed"` renders digits sideways, producing the messy stacked look seen in the screenshots.
- **Numbering:** `tabCounterRef` is persisted in `localStorage` (`tabCounter`), so a fresh page shows `Tab 8`, `Tab 9` from a previous session.

### 4.2 Changes

1. **Label rendering (decision #8, #18):**
   - Keep the rail ~32px wide.
   - Render labels cleanly with `vertical-rl`; constrain with `overflow-hidden` + `whitespace-nowrap`; no `maxHeight: 26` clipping of the label box. Clip gracefully (fade/ellipsis for long custom names) and keep the existing `title={tab.label}` tooltip for full name on hover.
   - Ensure adjacent tabs never overlap (remove any padding/margin overlap; consistent `py-0.5` + centered flex).
2. **Per-session numbering (decision #8):**
   - Reset the tab counter on app load instead of restoring it from localStorage.
   - When tabs are restored from a previous session, compute the new counter so auto-names **avoid collisions** with restored labels (e.g., start counter at `max(existing numeric suffix)+1`).
3. **Context labels (decision #10):**
   - Auto-name = tool letter + number: `T1` (Transform), `C2` (Compare), `U3` (Utils). Letter derives from the tab's current `activeOperation`/tool.
   - When a tab is in the default/transform state → `T#`; Compare → `C#`; Utils → `U#`.
   - Renamed tabs show the custom name instead (truncated in the rail).
4. **Rename (decision #9):**
   - **Double-click** a tab in the rail switches it to an inline edit mode (small vertical input, or horizontal input that rotates) with the current label selected.
   - **Enter** or blur commits; **Esc** cancels; trim + reject empty.
   - Renames persist in the `tabs` state → session persistence, tab snapshots, and share (tab labels already flow through `Tab` objects).
   - Keep the close `x` on hover; add a subtle "rename" affordance (pencil) on hover when renaming is supported.

---

## 5. Utils optimal UI — generators first (UUID, Password)

### 5.1 Core principle (from the request)

> "User should have to travel less and adjust less for click/mouse travel."

Concrete guidelines applied to every tool:
- **Controls live next to the content they affect** — no long mouse trips between a header control and the output.
- **Whole clickable surface = the action target** (click a card/row anywhere to copy, not a tiny hover-only icon).
- **Keyboard paths** for repetitive operations (arrows + Enter) so the mouse isn't required.
- **No dead space** — lists/grids fill the pane (the auto-fill + `auto-rows-fr` grid from the previous pass stays).
- **Hover-revealed controls are optional affordances, never the only path.**

### 5.2 UUID tool redesign

Current state (`UtilsPanel.tsx`): header row with `UUID` label + `Count` stepper + `New` / `One` / `NIL` / `Copy all`; body = responsive card grid (auto-fill columns, rows stretch), each card has a number, `break-all` UUID, and a **hover-only copy icon** (opacity-0 → 100).

New design:

1. **Sticky mini-bar at the list top (decision #13):**
   - Slim, always-visible bar directly above the grid: compact `UUID` title (small), `Count` stepper, `New`, `One`, `NIL`, `Copy all`, plus the new **"Copy on generate"** toggle.
   - Replaces the current `flex-wrap` pane header; the mini-bar stays pinned while the grid scrolls.
2. **Dense grid cards, click card = copy (decisions #11, #12):**
   - Entire card is a `<button>`/clickable; clicking copies that UUID with a **checkmark flash** on the card + a "UUID copied" toast (decision #3).
   - Keep the hover copy icon as a redundant affordance; keep `select-all` so text selection still works.
3. **Keyboard navigation (decision #12):**
   - Arrow keys move a focus ring across the grid; **Enter** copies the focused card; focus is visibly styled; grid is a focusable region (`role="grid"`/`tabindex` semantics).
4. **"Copy on generate" toggle (decisions #12, #17):**
   - When on, pressing `New` (or `One`/`NIL`) auto-copies the whole batch to the clipboard and toasts `N UUIDs copied` (or `UUID copied`).
   - Persisted in `localStorage` (e.g., `formaty-util-copy-on-generate`), **default off**.
5. Keep count cap (1–50) and the `regenerateUuids` behavior.

### 5.3 Password tool (same pass)

Apply the same interaction model:
- Click the password display/card to copy (whole surface).
- `New` regenerates; **"Copy on generate"** (shared toggle) auto-copies.
- Keep char-set chips + strength meter; group them in the sticky mini-bar near the length stepper so all password controls are one row, adjacent to the output.

### 5.4 Codec / text tools (follow-up pass — decisions #14)

Do **not** change in this pass; record the pattern to apply later:
- Output panes become click-to-copy surfaces (with check flash + toast).
- Consistent keyboard copy (Ctrl/Cmd+C already works in textareas; add focused-output Enter-to-copy where sensible).
- Keep the bidirectional codec edit model (plain ⇄ encoded) intact.

---

## 6. Out of scope / kept as-is

- First-run "Quick tip" hint (bottom-center card) — separate onboarding UI.
- Share-confirm dialog.
- Theme toggle, command palette, settings panel (recently tabbed — untouched by this request).
- Global Download button & OutputActionBar layout (except adding toasts for its feedback).
- The vertical tab rail width (~32px) — per decision #18.

---

## 7. Expected file changes

| File | Change |
|------|--------|
| `src/components/Toast.tsx` (new) | `<Toaster />` + `useToast()` (context, framer-motion, stacking, durations, link variant) |
| `src/components/WorkspaceContent.tsx` | Remove Export dropdown + `diffActionFlash` span; migrate `shareNotification` → toasts; remove bottom-center banner; tab rail rendering + per-session counter + context labels + double-click rename; wire `UtilsPanel` toasts |
| `src/components/UtilsPanel.tsx` | Sticky mini-bar controls; click-to-copy cards + check flash; keyboard nav; "Copy on generate" toggle (persisted); drop `onNotify` in favor of toast hook; same for Password |
| `src/components/workspace/OutputActionBar.tsx` | Possibly unchanged (feedback toasts live in `WorkspaceContent`) |
| `src/components/workspace/Header.tsx` | Likely unchanged |
| `src/lib/utils/devtools.ts` | Possibly export a shared "copy on generate" storage key / util helpers |

---

## 8. Verification plan

1. `bunx tsc --noEmit` — 0 errors.
2. `bun run lint` — clean.
3. `bun run build` — static export succeeds (27 routes).
4. Manual browser checks (if browser agent is healthy):
   - Compare → Document: Export button gone; swap/beautify/copy/clear/download all produce bottom-right toasts; errors stay 4s; click dismisses.
   - Copy from UUID grid → toast; click card copies; arrow+Enter copies; "Copy on generate" persists across reload and is off by default.
   - Multi-tab: fresh load starts at Tab 1; labels read `T1`/`C2`/`U3`; no overlap in the 32px rail; double-click renames; rename survives tab switch + reload.
   - Global Copy in diff mode still copies the report; ⌘K "Diff: Copy left/right/report" still work.
5. Spawn code-reviewer after implementation.

---

## 9. Open questions / assumptions (for the implementer)

- **Diff "Copy path changes"**: no standalone ⌘K command exists today (report copy covers it). Assumed acceptable; can add a `diff-copy-paths` command for parity.
- **Toast cap eviction**: oldest toast dismisses when a 4th arrives. Assumed; trivially adjustable.
- **Tab letter mapping**: Transform/default → `T`, Compare → `C`, Utils → `U`. Assumed; per decision #10.
- **Rename input in a 32px rail**: a rotated vertical input; if too fiddly, a small horizontal popover editor anchored to the tab is the fallback (flagged for implementer discretion).

---

## 10. Implementation plan (ordered)

Dependency-first order: the toast system is the foundation, then Compare cleanup, then the independent multi-tab and Utils workstreams.

### Phase A — Toast foundation
1. Create `src/components/Toast.tsx`: `ToastProvider`/`useToast()` + `<Toaster />`.
   - `toast({ message, type?, url?, duration? })`; types `success | error | info`; link variant via `url`.
   - Fixed **bottom-right**, stacked upward, **cap 3** (oldest evicted), newest at bottom.
   - Durations: success/info **2000ms**, error **4000ms** (overridable). Click-to-dismiss.
   - framer-motion `AnimatePresence` slide-in/fade-out; `role="status"`/`role="alert"` + `aria-live`.
   - Theme tokens: `--workspace-border/panel/text`, `text-error`, `text-primary`.
2. Mount `<Toaster />` once in `WorkspaceContent` (replaces the old banner slot).

### Phase B — Notification migration + Compare cleanup
3. Replace every `setShareNotification(x) + setTimeout(...)` site (~25) with `toast(...)`; delete the bottom-center banner JSX and the `shareNotification` state; `startsWith("http")` sites become link toasts.
4. `flashDiffAction` → toast; delete `diffActionFlash` state + inline `animate-pulse` span; map messages per §2.3 table.
5. Remove the Export `<Dropdown>` from the document-diff toolbar (§1); keep ⌘K diff commands; verify/clean `downloadMenuOpen` diff branches.
6. `UtilsPanel`: replace `onNotify` prop chain with `useToast()`; delete `onNotify` from props + `WorkspaceContent` call site.

### Phase C — Multi-tab
7. Stop persisting `tabCounter`; on session restore compute counter = `max(existing numeric suffix) + 1` (collision-safe).
8. New-tab labels use context naming: `T#`/`C#`/`U#` from the tab's active tool (§4.2).
9. Fix rail label rendering: clean `vertical-rl`, `overflow-hidden`, no overlap, truncation + `title` tooltip; keep ~32px rail.
10. Double-click rename: inline edit in rail (Enter/blur commit, Esc cancel, non-empty), persists via `tabs` state → session + share. Fallback: small popover editor if the rotated input is too fiddly.

### Phase D — Utils optimal UI (generators)
11. UUID: sticky mini-bar (compact title + Count stepper + New/One/NIL/Copy all + Copy-on-generate toggle) pinned above the grid.
12. UUID: whole-card click-to-copy (checkmark flash + toast), keyboard nav (arrows move focus, Enter copies), keep hover icon + `select-all`.
13. "Copy on generate" (localStorage `formaty-util-copy-on-generate`, **default off**): auto-copies batch after New/One/NIL with `N UUIDs copied` toast.
14. Password: click-to-copy display, shared toggle integration, keep chips + strength meter grouped in the mini-bar row.

### Phase E — Verification
15. `bunx tsc --noEmit`, `bun run lint`, `bun run build` (static export).
16. Code review; browser spot-check of: Export gone + diff toasts, UUID card/keyboard/auto-copy, tab labels/rename/counter reset, global copy still working.

### Suggested commit splits
- **Commit 1:** Phases A+B (toast system + Compare cleanup + notification migration).
- **Commit 2:** Phase C (multi-tab).
- **Commit 3:** Phase D (Utils generators).
