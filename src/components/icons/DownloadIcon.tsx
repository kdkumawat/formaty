import { forwardRef, useImperativeHandle, useCallback, useRef } from "react";
import { motion, useAnimate, useReducedMotion } from "framer-motion";
import { DEFAULT_STROKE_WIDTH, type AnimatedIconHandle, type AnimatedIconProps } from "./types";

/**
 * Download — the arrow drops into the tray once per hover/focus (a single
 * cycle; the upstream itsHover version loops, which we deliberately do not
 * want in a fast, calm tool). Adapted from itsHover's download-icon.
 */
const DownloadIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = DEFAULT_STROKE_WIDTH, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const runningRef = useRef(false);
    const reduceMotion = useReducedMotion();

    const start = useCallback(async () => {
      if (reduceMotion || runningRef.current) return;
      runningRef.current = true;

      animate(
        ".arrow-head",
        { y: [0, 8, 8, -8, 0], opacity: [1, 0, 0, 0, 1] },
        { duration: 0.9, times: [0, 0.4, 0.5, 0.6, 1], ease: "easeInOut" },
      );
      await animate(
        ".arrow-stem",
        { y: [0, 8, 8, -8, 0], opacity: [1, 0, 0, 0, 1] },
        { duration: 0.9, times: [0, 0.3, 0.4, 0.5, 1], ease: "easeInOut" },
      );
      await animate(".tray", { y: [0, 2, 0], scale: [1, 1.04, 1] }, { duration: 0.3, ease: "easeOut" });

      runningRef.current = false;
    }, [animate, reduceMotion]);

    const stop = useCallback(() => {
      runningRef.current = false;
      animate(".arrow-head, .arrow-stem, .tray", { y: 0, opacity: 1, scale: 1 }, { duration: 0.3 });
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
          className="tray"
          d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
          style={{ transformOrigin: "center bottom" }}
        />
        <motion.path className="arrow-stem" d="M12 15V3" style={{ transformOrigin: "center" }} />
        <motion.path className="arrow-head" d="m7 10 5 5 5-5" style={{ transformOrigin: "center" }} />
      </motion.svg>
    );
  },
);

DownloadIcon.displayName = "DownloadIcon";
export default DownloadIcon;
