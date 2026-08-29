"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { dismissUpdate, subscribeToVersionUpdates } from "@/lib/versionCheck";

/** Floating "new version available" toast. Polls `/version.json` via
 *  `subscribeToVersionUpdates`; appears when a different id is live. Refresh
 *  snapshots the current workspace state to sessionStorage so it survives
 *  the reload; Dismiss hides until a *newer* id appears. */
export function UpdateToast() {
  const [remote, setRemote] = useState<string | null>(null);

  useEffect(() => {
    const sub = subscribeToVersionUpdates((id) => setRemote(id));
    return () => sub.stop();
  }, []);

  const onRefresh = () => {
    // WorkspaceContent's `pagehide` listener flushes the latest state to
    // localStorage synchronously before this reload; the existing
    // mount-time hydrate then restores it.
    window.location.reload();
  };

  const onDismiss = () => {
    if (remote) dismissUpdate(remote);
    setRemote(null);
  };

  return (
    <AnimatePresence>
      {remote ? (
        <motion.div
          key="update-toast"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-4 right-4 z-[300] w-[calc(100%-2rem)] max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <ArrowPathIcon
              className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--card-foreground)]">
                New version available
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
                Refresh to load the latest updates.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRefresh}
                  className="h-8 rounded-md bg-[var(--primary)] px-3 text-xs font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="h-8 rounded-md px-3 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss update notification"
              className="rounded-md p-1 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
            >
              <XMarkIcon className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
