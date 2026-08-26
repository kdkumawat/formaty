"use client";

import { motion, useReducedMotion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/motion";

type SplitTextProps = {
  text: string;
  className?: string;
  /** Tag to render for the outer element. */
  as?: "h1" | "h2" | "h3" | "p" | "span";
  /** Stagger between words, in seconds. */
  stagger?: number;
  /** Initial delay in seconds. */
  delay?: number;
};

/**
 * SplitText - animates a string word-by-word with a fade-up stagger. The
 * whole string is split into individual `motion.span` words. Each word is
 * wrapped in an inline-block so transforms don't break the line layout.
 *
 * On reduced motion, renders the plain string instantly.
 */
export function SplitText({
  text,
  className,
  as = "h2",
  stagger = 0.05,
  delay = 0,
}: SplitTextProps) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  const Component = motion[as] as typeof motion.h2;

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{text}</Plain>;
  }

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        ...staggerContainer,
        show: {
          opacity: 1,
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
      aria-label={text}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={fadeUp}
          className="inline-block"
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </Component>
  );
}
