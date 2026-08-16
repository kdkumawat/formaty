import { forwardRef, useImperativeHandle } from "react";
import { motion, useAnimate, useReducedMotion } from "framer-motion";
import { type AnimatedIconHandle, type AnimatedIconProps } from "./types";

/** The original Formaty braces glyph used 1.8 - keep the identical look. */
const BRACES_STROKE_WIDTH = 1.8;

/**
 * Braces — the JSON `{}` glyph. Keeps the exact geometry of the app's inline
 * BracesGlyph (heroicons has no braces icon) and borrows the motion language
 * of itsHover's code-icon: the braces spread slightly on hover/focus.
 */
const BracesIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = BRACES_STROKE_WIDTH, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const reduceMotion = useReducedMotion();

    const start = async () => {
      if (reduceMotion) return;
      animate(".left-brace", { x: -3, rotate: -3 }, { duration: 0.3, ease: "easeOut" });
      animate(".right-brace", { x: 3, rotate: 3 }, { duration: 0.3, ease: "easeOut" });
      await animate(".braces-group", { scale: [1, 1.08, 1] }, { duration: 0.45, ease: "easeInOut" });
    };

    const stop = () => {
      animate(".left-brace", { x: 0, rotate: 0 }, { duration: 0.2, ease: "easeInOut" });
      animate(".right-brace", { x: 0, rotate: 0 }, { duration: 0.2, ease: "easeInOut" });
      animate(".braces-group", { scale: 1 }, { duration: 0.2, ease: "easeOut" });
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
        style={{ overflow: "visible" }}
        aria-hidden
      >
        <motion.g className="braces-group" style={{ transformOrigin: "center" }}>
          <motion.path
            className="left-brace"
            d="M8 4c-2 0-3 1-3 3v3c0 1.5-.5 2.5-2 3 1.5.5 2 1.5 2 3v3c0 2 1 3 3 3"
          />
          <motion.path
            className="right-brace"
            d="M16 4c2 0 3 1 3 3v3c0 1.5.5 2.5 2 3-1.5.5-2 1.5-2 3v3c0 2-1 3-3 3"
          />
        </motion.g>
      </motion.svg>
    );
  },
);

BracesIcon.displayName = "BracesIcon";
export default BracesIcon;
