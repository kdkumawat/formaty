"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a stable `schedule()` that calls `reset` after `ms`. A new call cancels the
 * previous timer (rapid re-clicks keep the feedback visible for the full delay), and
 * the timer is cleared on unmount.
 */
export function useDelayedReset(reset: () => void, ms = 1400) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetRef = useRef(reset);
  useEffect(() => {
    resetRef.current = reset;
  });
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => resetRef.current(), ms);
  }, [ms]);
}
