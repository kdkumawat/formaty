"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import type { RevealProps } from "@/lib/motion";

/**
 * Reveal - wraps a block in a `whileInView` fade-up. The block animates once
 * when it scrolls into view. Respects `prefers-reduced-motion` automatically
 * (via the `<MotionConfig reducedMotion="user">` wrapper in `app/layout.tsx`).
 */
export function Reveal({
  children,
  className,
  variants = fadeUp,
  delay = 0,
  amount = 0.15,
  as = "div",
  once = true,
}: RevealProps) {
  const reduced = useReducedMotion();
  const Component = motion[as] as typeof motion.div;
  // When reduced motion is on, snap to final state (no y/opacity transition).
  const finalVariants: Variants | undefined = reduced
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : variants;

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={finalVariants}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </Component>
  );
}
