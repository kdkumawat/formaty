import { useMemo, useRef, type Ref } from "react";

/**
 * Shared contract for the animated icons in this folder, adapted from
 * itsHover (https://github.com/itshover/itshover, Apache-2.0).
 *
 * The icons are deliberately styled to match the existing heroicons/24/outline
 * glyphs: 24-viewBox, `currentColor`, round caps, and a 1.5 stroke weight.
 * `strokeWidth` is expressed in "24-viewBox units" (heroicons convention), so
 * call sites can pass the same value regardless of the icon's own viewBox.
 */

/** Imperative control over one animated icon (matching itsHover's handle). */
export type AnimatedIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

export type AnimatedIconProps = {
  size?: number;
  color?: string;
  /** Stroke weight in 24-viewBox units (heroicons convention). Default 1.5. */
  strokeWidth?: number;
  className?: string;
};

export const DEFAULT_STROKE_WIDTH = 1.5;

/** Map a heroicons-equivalent stroke weight onto a non-24 viewBox. */
export function scaledStrokeWidth(strokeWidth: number, viewBox: number): number {
  return (strokeWidth * viewBox) / 24;
}

/**
 * Bind hover + focus on a *parent* element to an animated icon's imperative
 * handle. Use on buttons/triggers that contain a small icon: the icon's own
 * hover area is only ~14px, while the button is ~28px, and the icon never
 * receives keyboard focus itself.
 *
 * ```tsx
 * const icon = useIconAnimation();
 * <button {...icon.bind}><CopyIcon ref={icon.ref} /></button>
 * ```
 */
export function useIconAnimation() {
  const ref = useRef<AnimatedIconHandle>(null);
  return useMemo(
    () => ({
      ref: ref as Ref<AnimatedIconHandle>,
      /**
       * The ref may point at a static (non-animated) icon — e.g. the toolbar
       * triggers render heroicons through TriggerIcon, which forward the ref
       * to the raw SVG element instead of an AnimatedIconHandle. Guard every
       * call so we never invoke a method that doesn't exist on the node.
       */
      bind: {
        onPointerEnter: () => {
          const handle = ref.current;
          if (handle && typeof handle.startAnimation === "function") handle.startAnimation();
        },
        onPointerLeave: () => {
          const handle = ref.current;
          if (handle && typeof handle.stopAnimation === "function") handle.stopAnimation();
        },
        onFocus: () => {
          const handle = ref.current;
          if (handle && typeof handle.startAnimation === "function") handle.startAnimation();
        },
        onBlur: () => {
          const handle = ref.current;
          if (handle && typeof handle.stopAnimation === "function") handle.stopAnimation();
        },
      },
    }),
    [],
  );
}
