"use client";

import { useEffect, useState } from "react";

function useMediaQuery(query: string, initial: boolean): boolean {
  const [matches, setMatches] = useState(initial);
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/**
 * Responsive flags for the workspace shell. Initial values match the server render
 * (desktop, tall) and are corrected on mount to avoid a hydration mismatch.
 */
export function useViewportLayout() {
  const isDesktopLayout = useMediaQuery("(min-width: 900px)", true);
  /** Viewport shorter than ~700px: stacked panes switch between Input and Output instead of scrolling. */
  const isShortViewport = useMediaQuery("(max-height: 699px)", false);
  return { isDesktopLayout, isShortViewport };
}
