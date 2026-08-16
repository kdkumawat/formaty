import { forwardRef, useImperativeHandle, useCallback } from "react";
import { motion, useAnimate, useReducedMotion } from "framer-motion";
import { DEFAULT_STROKE_WIDTH, type AnimatedIconHandle, type AnimatedIconProps } from "./types";

/**
 * Reset — the arrow-path glyph rotates 90° once on hover/focus (a classic
 * refresh affordance) and settles back on leave. Geometry matches heroicons'
 * arrow-path so the resting state is pixel-identical to the static icon.
 */
const ResetIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = DEFAULT_STROKE_WIDTH, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const reduceMotion = useReducedMotion();

    const start = useCallback(async () => {
      if (reduceMotion) return;
      await animate(
        ".reset-group",
        { rotate: [0, 90, 0], scale: [1, 0.92, 1] },
        { duration: 0.55, ease: "easeInOut" },
      );
    }, [animate, reduceMotion]);

    const stop = useCallback(() => {
      animate(".reset-group", { rotate: 0, scale: 1 }, { duration: 0.3, ease: "easeOut" });
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
        <motion.g className="reset-group" style={{ transformOrigin: "12px 12px" }}>
          <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </motion.g>
      </motion.svg>
    );
  },
);

ResetIcon.displayName = "ResetIcon";
export default ResetIcon;
