import { forwardRef, useImperativeHandle, useCallback } from "react";
import { motion, useAnimate, useReducedMotion } from "framer-motion";
import { DEFAULT_STROKE_WIDTH, type AnimatedIconHandle, type AnimatedIconProps } from "./types";

/**
 * Beautify — the sparkles twinkle once on hover/focus. Adapted from itsHover's
 * sparkles-icon. This is the only "decorative" motion in the toolbar and it is
 * reserved for the Beautify action, where a light polish reads as intent.
 */
const SparklesIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = DEFAULT_STROKE_WIDTH, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const reduceMotion = useReducedMotion();

    const start = useCallback(async () => {
      if (reduceMotion) return;
      animate(".sparkle-main", { rotate: 180, scale: [1, 1.15, 1] }, { duration: 0.6, ease: "easeInOut" });
      animate(
        ".sparkle-top",
        { rotate: -90, scale: [1, 0.85, 1.05], opacity: [1, 0.65, 1] },
        { duration: 0.5, ease: "easeInOut", delay: 0.1 },
      );
      animate(
        ".sparkle-bottom",
        { rotate: 90, scale: [1, 1.1, 0.95], opacity: [1, 0.7, 1] },
        { duration: 0.5, ease: "easeInOut", delay: 0.05 },
      );
    }, [animate, reduceMotion]);

    const stop = useCallback(() => {
      animate(".sparkle-main", { rotate: 0, scale: 1 }, { duration: 0.25 });
      animate(".sparkle-top", { rotate: 0, scale: 1, opacity: 1 }, { duration: 0.25 });
      animate(".sparkle-bottom", { rotate: 0, scale: 1, opacity: 1 }, { duration: 0.25 });
    }, [animate]);

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
        style={{ overflow: "visible" }}
        aria-hidden
      >
        <motion.path
          className="sparkle-bottom"
          d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2z"
          style={{ transformOrigin: "18px 18px" }}
        />
        <motion.path
          className="sparkle-top"
          d="M16 6a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2z"
          style={{ transformOrigin: "18px 6px" }}
        />
        <motion.path
          className="sparkle-main"
          d="M9 18a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z"
          style={{ transformOrigin: "9px 12px" }}
        />
      </motion.svg>
    );
  },
);

SparklesIcon.displayName = "SparklesIcon";
export default SparklesIcon;
