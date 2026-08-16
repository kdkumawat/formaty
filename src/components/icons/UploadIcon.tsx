import { forwardRef, useImperativeHandle, useCallback, useRef } from "react";
import { motion, useAnimate, useReducedMotion } from "framer-motion";
import { DEFAULT_STROKE_WIDTH, type AnimatedIconHandle, type AnimatedIconProps } from "./types";

/**
 * Upload — the arrow lifts out of the tray and drops back once per hover/focus
 * (single cycle; the upstream itsHover version loops, which we avoid).
 */
const UploadIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = DEFAULT_STROKE_WIDTH, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const runningRef = useRef(false);
    const reduceMotion = useReducedMotion();

    const start = useCallback(async () => {
      if (reduceMotion || runningRef.current) return;
      runningRef.current = true;

      // Fly up and fade out
      await animate(".arrow-group", { y: -12, opacity: 0 }, { duration: 0.35, ease: "easeIn" });
      // Instant reset to the bottom
      await animate(".arrow-group", { y: 12, opacity: 0 }, { duration: 0 });
      // Fly back in from below
      await animate(".arrow-group", { y: 0, opacity: 1 }, { duration: 0.35, ease: "easeOut" });

      runningRef.current = false;
    }, [animate, reduceMotion]);

    const stop = useCallback(() => {
      runningRef.current = false;
      animate(".arrow-group", { y: 0, opacity: 1 }, { duration: 0.3, ease: "easeOut" });
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
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <motion.g className="arrow-group">
          <path d="M12 3v12" />
          <path d="m17 8-5-5-5 5" />
        </motion.g>
      </motion.svg>
    );
  },
);

UploadIcon.displayName = "UploadIcon";
export default UploadIcon;
