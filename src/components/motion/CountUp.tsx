"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useInViewOnce } from "@/lib/motion";

type CountUpProps = {
  /** Final value to count up to. */
  value: number;
  /** Animation duration in ms. */
  durationMs?: number;
  /** Number of decimal places to keep. */
  decimals?: number;
  /** Optional suffix appended after the number. */
  suffix?: string;
  /** Optional prefix prepended before the number. */
  prefix?: string;
  className?: string;
};

/**
 * CountUp - animates a numeric value from 0 to `value` on first viewport
 * entry. Reserves its final width (uses `tabular-nums`) to prevent layout
 * shift. Respects reduced motion: snaps to final value instantly.
 */
export function CountUp({
  value,
  durationMs = 700,
  decimals = 0,
  suffix = "",
  prefix = "",
  className,
}: CountUpProps) {
  const [ref, inView] = useInViewOnce<HTMLSpanElement>();
  const [display, setDisplay] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      setDisplay(value * easeOutCubic(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, durationMs, reduced]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
