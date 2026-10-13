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
import { Button, Kbd } from "@/components/kit";
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

  // Open from the help menu.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("formaty:open-shortcuts", onOpen);
    return () => window.removeEventListener("formaty:open-shortcuts", onOpen);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[14px]">Keyboard shortcuts</DialogTitle>
          <DialogDescription className="text-[13px]">
            Everything is reachable from the keyboard. Press <Kbd keys="⌘K" /> to run any action by name.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="mb-3 last:mb-0">
              <p className="mb-1 px-1 text-[12px] font-medium text-[var(--workspace-text-muted)]">{group.title}</p>
              <div className="overflow-hidden rounded-lg border border-[var(--workspace-border)]">
                {group.items.map((item, i) => (
                  <div
                    key={item.keys}
                    className={`flex items-center justify-between gap-4 bg-[var(--workspace-panel)] px-3 py-1.5 text-[13px] ${
                      i > 0 ? "border-t border-[var(--workspace-border)]" : ""
                    }`}
                  >
                    <span className="text-[var(--workspace-text)]">{item.label}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {item.keys.split(" · ").map((k) => (
                        <Kbd key={k} keys={k} />
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
