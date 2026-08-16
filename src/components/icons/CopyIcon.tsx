import { forwardRef, useImperativeHandle } from "react";
import { motion, useAnimate, useReducedMotion } from "framer-motion";
import { DEFAULT_STROKE_WIDTH, type AnimatedIconHandle, type AnimatedIconProps } from "./types";

/**
 * Copy — the front sheet nudges on hover/focus. Adapted from itsHover's
 * copy-icon (Apache-2.0) with a heroicons-matched stroke weight and
 * reduced-motion gating.
 */
const CopyIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = DEFAULT_STROKE_WIDTH, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const reduceMotion = useReducedMotion();

    const start = async () => {
      if (reduceMotion) return;
      await animate(
        ".front-copy",
        { x: [0, 3, 0], y: [0, 3, 0], rotate: [0, -4, 0] },
        { duration: 0.35, ease: "easeInOut" },
      );
    };

    const stop = () => {
      animate(".front-copy", { x: 0, y: 0, rotate: 0 }, { duration: 0.2, ease: "easeOut" });
    };

    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));

    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
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
        <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />
        <motion.path
          className="front-copy"
          d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z"
          style={{ transformOrigin: "center", transformBox: "fill-box" }}
        />
      </motion.svg>
    );
  },
);

CopyIcon.displayName = "CopyIcon";
export default CopyIcon;
