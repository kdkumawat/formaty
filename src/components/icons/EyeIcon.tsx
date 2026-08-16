import { forwardRef, useImperativeHandle, useCallback } from "react";
import { motion, useAnimate, useReducedMotion } from "framer-motion";
import { DEFAULT_STROKE_WIDTH, type AnimatedIconHandle, type AnimatedIconProps } from "./types";

/**
 * View / inspect — the pupil contracts and the eye narrows slightly on
 * hover/focus ("looking closer"). Adapted from itsHover's eye-icon.
 */
const EyeIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = DEFAULT_STROKE_WIDTH, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const reduceMotion = useReducedMotion();

    const start = useCallback(async () => {
      if (reduceMotion) return;
      animate(".eye-pupil", { scale: 0.7 }, { duration: 0.15, ease: "easeOut" });
      animate(".eye-shape", { scaleY: 0.9 }, { duration: 0.15, ease: "easeOut" });
    }, [animate, reduceMotion]);

    const stop = useCallback(async () => {
      animate(".eye-pupil, .eye-shape", { scale: 1, scaleY: 1 }, { duration: 0.2, ease: "easeInOut" });
    }, [animate]);

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
          d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
          className="eye-pupil"
          style={{ transformOrigin: "50% 50%" }}
        />
        <motion.path
          d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"
          className="eye-shape"
          style={{ transformOrigin: "50% 50%" }}
        />
      </motion.svg>
    );
  },
);

EyeIcon.displayName = "EyeIcon";
export default EyeIcon;
