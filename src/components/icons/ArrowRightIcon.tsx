import { forwardRef, useImperativeHandle } from "react";
import { motion, useAnimate, useReducedMotion } from "framer-motion";
import { DEFAULT_STROKE_WIDTH, type AnimatedIconHandle, type AnimatedIconProps } from "./types";

/**
 * Arrow right — nudges forward on hover/focus. Adapted from itsHover's
 * arrow-narrow-right-icon; used on landing CTAs where a one-beat nudge is
 * enough to invite the click without turning the page into a gallery.
 */
const ArrowRightIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = DEFAULT_STROKE_WIDTH, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const reduceMotion = useReducedMotion();

    const start = async () => {
      if (reduceMotion) return;
      await animate(".arrow-group", { x: [0, 3, 0] }, { duration: 0.45, ease: "easeInOut" });
    };

    const stop = () => {
      animate(".arrow-group", { x: 0 }, { duration: 0.2, ease: "easeOut" });
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
        <motion.g className="arrow-group">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M5 12l14 0" />
          <path d="M15 16l4 -4" />
          <path d="M15 8l4 4" />
        </motion.g>
      </motion.svg>
    );
  },
);

ArrowRightIcon.displayName = "ArrowRightIcon";
export default ArrowRightIcon;
