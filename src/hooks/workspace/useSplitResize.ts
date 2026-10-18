"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MIN_SPLIT = 25;
const MAX_SPLIT = 60;

export const clampSplit = (value: number) => Math.max(MIN_SPLIT, Math.min(MAX_SPLIT, value));

/** Input/output pane split (percent of the container width) with drag-to-resize. */
export function useSplitResize(initial = 41) {
  const [split, setSplitRaw] = useState(initial);
  const [isResizing, setIsResizing] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);

  /** Clamps, so restored sessions and shared links can pass raw numbers. */
  const setSplit = useCallback((value: number) => setSplitRaw(clampSplit(value)), []);
  const startResize = useCallback(() => setIsResizing(true), []);
  const nudgeSplit = useCallback((delta: number) => setSplitRaw((s) => clampSplit(s + delta)), []);

  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (event: MouseEvent) => {
      const section = splitContainerRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const nextSplit = ((event.clientX - rect.left) / rect.width) * 100;
      setSplitRaw(clampSplit(Math.round(nextSplit)));
    };

    const onMouseUp = () => setIsResizing(false);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing]);

  return { split, setSplit, isResizing, startResize, nudgeSplit, splitContainerRef };
}
