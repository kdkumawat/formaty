"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button as UiButton } from "@/components/ui/button";
import { isEditableTarget, SHORTCUT_GROUPS } from "@/lib/shortcuts";

/**
 * Keyboard-shortcuts reference overlay for the Formaty workspace.
 *
 * Opened with `?` or ⌘/ (Ctrl+/ on Windows/Linux). Action shortcuts themselves
 * are handled inside WorkspaceContent; this component only owns its own open
 * state and renders the reference list.
 */
export function KeyboardShortcutsOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key === "/") {
        event.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (!mod && event.key === "?") {
        // Let typing `?` into editors/inputs do its normal thing.
        if (isEditableTarget(event.target)) return;
        event.preventDefault();
        setOpen(true);
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, []);

  // Open from the status-bar `?` button (dispatched by StatusBar).
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("formaty:open-shortcuts", onOpen);
    return () => window.removeEventListener("formaty:open-shortcuts", onOpen);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">Keyboard shortcuts</DialogTitle>
          <DialogDescription className="text-xs">
            Everything is reachable from the keyboard. Press{" "}
            <kbd className="rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--workspace-text)]">
              ⌘K
            </kbd>{" "}
            to run any action by name.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="mb-3 last:mb-0">
              <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                {group.title}
              </p>
              <div className="overflow-hidden rounded-lg border border-[var(--workspace-border)]">
                {group.items.map((item, i) => (
                  <div
                    key={item.keys}
                    className={`flex items-center justify-between gap-4 bg-[var(--workspace-panel)] px-3 py-2 text-xs ${
                      i > 0 ? "border-t border-[var(--workspace-border)]" : ""
                    }`}
                  >
                    <span className="text-[var(--workspace-text)]">{item.label}</span>
                    <kbd className="shrink-0 rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--workspace-text-muted)]">
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <UiButton variant="outline" onClick={() => setOpen(false)}>
            Close
          </UiButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
