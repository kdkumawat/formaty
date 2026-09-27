/**
 * "Explored" checkboxes for list-compare output.
 *
 * The user walks through a bucket of items (e.g. Common users to migrate) and
 * marks each one done. Checked keys persist per panel in localStorage so the
 * marks survive reloads, and can be cleared with a single action.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

export interface CheckedItemsApi {
  /** Set of checked item keys (the compare-normalized key). */
  checked: Set<string>;
  isChecked: (key: string) => boolean;
  toggle: (key: string) => void;
  clear: () => void;
  /** Number of checked items. */
  count: number;
}

export function useCheckedItems(storageKey: string, enabled: boolean): CheckedItemsApi {
  const [checked, setChecked] = useState<Set<string>>(() => {
    if (!enabled || typeof window === "undefined") return new Set();
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return new Set();
      return new Set(parsed.filter((x): x is string => typeof x === "string"));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (!enabled) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...checked]));
    } catch {
      /* ignore */
    }
  }, [checked, enabled, storageKey]);

  const toggle = useCallback((key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const clear = useCallback(() => setChecked(new Set()), []);

  const isChecked = useCallback((key: string) => checked.has(key), [checked]);

  return useMemo(
    () => ({ checked, isChecked, toggle, clear, count: checked.size }),
    [checked, isChecked, toggle, clear],
  );
}
