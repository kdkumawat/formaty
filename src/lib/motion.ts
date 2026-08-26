"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion, type Variants } from "framer-motion";

/**
 * Shared framer-motion variants and hooks for landing sections.
 *
 * Use these instead of authoring `initial` / `animate` / `transition` inline.
 * They respect `prefers-reduced-motion` automatically - when reduced motion is
 * preferred, framer-motion itself (with `<MotionConfig reducedMotion="user">`
 * in the layout) collapses tween durations to ~0.
 */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

/**
 * Returns `true` when the user has requested reduced motion. Snapshot once on
 * mount so server-rendered HTML matches the first client paint.
 */
export function useReducedMotionSafe(): boolean {
  const reduced = useReducedMotion();
  return reduced ?? false;
}

/**
 * Returns `true` once the element scrolls into view. Used for one-shot
 * triggers that don't need framer-motion's whileInView (e.g. starting a
 * count-up animation).
 */
export function useInViewOnce<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect();
            break;
          }
        }
      },
      options,
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [options]);

  return [ref, inView];
}

export type RevealProps = {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
  amount?: number;
  as?: "div" | "section" | "span" | "li" | "ul" | "header" | "footer";
  once?: boolean;
};
