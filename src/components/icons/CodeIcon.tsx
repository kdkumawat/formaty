import { forwardRef, useImperativeHandle } from "react";
import { motion, useAnimate, useReducedMotion } from "framer-motion";
import { DEFAULT_STROKE_WIDTH, type AnimatedIconHandle, type AnimatedIconProps } from "./types";

/**
 * Code — the angle brackets spread slightly apart on hover/focus, reading as
 * "expanding / formatting code". Adapted from itsHover's code-icon.
 */
const CodeIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = DEFAULT_STROKE_WIDTH, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const reduceMotion = useReducedMotion();

    const start = async () => {
      if (reduceMotion) return;
      animate(".left-bracket", { x: -3.5 }, { duration: 0.3, ease: "easeOut" });
      animate(".right-bracket", { x: 3.5 }, { duration: 0.3, ease: "easeOut" });
    };

    const stop = () => {
      animate(".left-bracket", { x: 0 }, { duration: 0.2, ease: "easeInOut" });
      animate(".right-bracket", { x: 0 }, { duration: 0.2, ease: "easeInOut" });
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
        <motion.path className="right-bracket" d="m16 18 6-6-6-6" />
        <motion.path className="left-bracket" d="m8 6-6 6 6 6" />
      </motion.svg>
    );
  },
);

CodeIcon.displayName = "CodeIcon";
export default CodeIcon;
