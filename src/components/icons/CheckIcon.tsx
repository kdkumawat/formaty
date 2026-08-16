import { motion } from "framer-motion";
import { DEFAULT_STROKE_WIDTH, type AnimatedIconProps } from "./types";

/**
 * Check — draws itself once when mounted (state transition). Used to confirm a
 * successful copy instead of a toast: the glyph animates in and the previous
 * Copy icon swaps out at the same size, so there is no layout shift.
 */
export default function CheckIcon({
  size = 24,
  color = "currentColor",
  strokeWidth = DEFAULT_STROKE_WIDTH,
  className = "",
}: AnimatedIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <motion.path
        d="M5 12l5 5l10 -10"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      />
    </svg>
  );
}
