"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

interface DropdownProps {
  trigger: React.ReactNode | ((open: boolean) => React.ReactNode);
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentClassName?: string;
  rootClassName?: string;
  align?: "start" | "end";
  side?: "top" | "bottom";
  /**
   * Prefer anchoring to the right edge of the viewport (settings panels).
   * Still tracks the trigger vertically.
   */
  preferScreenRight?: boolean;
  /** Gap from viewport edges when clamping (px). */
  edgePadding?: number;
}

export function Dropdown({
  trigger,
  children,
  open,
  onOpenChange,
  contentClassName = "",
  rootClassName = "",
  align = "start",
  side = "top",
  preferScreenRight = false,
  edgePadding = 8,
}: DropdownProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      )
        return;
      close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const [style, setStyle] = useState<React.CSSProperties | null>(null);

  const updatePosition = useCallback(() => {
    if (!open || typeof document === "undefined") return;
    const triggerEl = triggerRef.current;
    const content = contentRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const gap = 6;
    const pad = edgePadding;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = content?.offsetWidth ?? 320;
    const ch = content?.offsetHeight ?? 240;

    let top: number;
    if (side === "bottom") {
      top = rect.bottom + gap;
      if (top + ch > vh - pad && rect.top - gap - ch > pad) {
        top = Math.max(pad, rect.top - gap - ch);
      } else {
        top = Math.min(top, Math.max(pad, vh - pad - ch));
      }
    } else {
      top = Math.max(pad, rect.top - gap - ch);
    }

    let left: number | undefined;
    let right: number | undefined;

    if (preferScreenRight) {
      right = pad;
      left = undefined;
      if (cw > vw - pad * 2) {
        left = pad;
        right = pad;
      }
    } else if (align === "end") {
      right = Math.max(pad, vw - rect.right);
      const panelLeft = vw - right - cw;
      if (panelLeft < pad) {
        right = Math.max(pad, vw - pad - cw);
      }
    } else {
      left = Math.min(Math.max(pad, rect.left), Math.max(pad, vw - pad - cw));
    }

    setStyle({
      position: "fixed",
      top,
      left,
      right,
      zIndex: 200,
    });
  }, [open, align, side, preferScreenRight, edgePadding]);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }
    updatePosition();
    const id = requestAnimationFrame(() => updatePosition());
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition, children]);

  return (
    <div className={`relative inline-block ${rootClassName}`} ref={triggerRef}>
      <div
        onClick={() => onOpenChange(!open)}
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpenChange(!open);
        }}
      >
        {typeof trigger === "function" ? trigger(open) : trigger}
      </div>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && style && (
              <motion.div
                ref={contentRef}
                className={contentClassName}
                onPointerDown={(e) => e.stopPropagation()}
                style={style}
                initial={{ opacity: 0, y: side === "bottom" ? -4 : 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: side === "bottom" ? -3 : 3, scale: 0.98 }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
