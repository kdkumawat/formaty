import { forwardRef, useCallback, useEffect, useImperativeHandle } from "react";
import { motion, useAnimate, useReducedMotion } from "framer-motion";
import { DEFAULT_STROKE_WIDTH, type AnimatedIconHandle, type AnimatedIconProps } from "./types";

/**
 * Heart for the "Made with ❤️" line - beats gently on its own and gives a
 * slightly bigger thump on hover/focus. Same motion language as the rest of
 * the itsHover-inspired icon set.
 */
const HeartIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = DEFAULT_STROKE_WIDTH, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const reduceMotion = useReducedMotion();

    // Gentle continuous heartbeat while visible.
    useEffect(() => {
      if (reduceMotion) return;
      const controls = animate(
        ".heart-shape",
        { scale: [1, 1.12, 1] },
        { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
      );
      return () => controls.stop();
    }, [animate, reduceMotion]);

    const start = useCallback(async () => {
      if (reduceMotion) return;
      animate(".heart-shape", { scale: 1.22 }, { duration: 0.12, ease: "easeOut" });
    }, [animate, reduceMotion]);

    const stop = useCallback(async () => {
      if (reduceMotion) return;
      animate(".heart-shape", { scale: [1, 1.12, 1] }, { duration: 1.2, ease: "easeInOut" });
    }, [animate, reduceMotion]);

    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));

    return (
      <motion.svg
        ref={scope}
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
        onHoverStart={start}
        onHoverEnd={stop}
        aria-hidden
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <motion.path
          d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"
          className="heart-shape"
          style={{ transformOrigin: "50% 50%" }}
        />
      </motion.svg>
    );
  },
);

HeartIcon.displayName = "HeartIcon";
export default HeartIcon;
