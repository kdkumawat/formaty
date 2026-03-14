"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DropdownProps {
  trigger: React.ReactNode | ((open: boolean) => React.ReactNode);
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentClassName?: string;
  rootClassName?: string;
  align?: "start" | "end";
  side?: "top" | "bottom";
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

  const [position, setPosition] = useState<{ top: number; left?: number; right?: number } | null>(null);
  useLayoutEffect(() => {
    if (!open || typeof document === "undefined") return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const gap = 4;
    if (side === "top") {
      setPosition({
        top: rect.top - gap,
        ...(align === "start" ? { left: rect.left } : { right: window.innerWidth - rect.right }),
      });
    } else {
      setPosition({
        top: rect.bottom + gap,
        ...(align === "start" ? { left: rect.left } : { right: window.innerWidth - rect.right }),
      });
    }
  }, [open, align, side]);

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
      {open &&
        typeof document !== "undefined" &&
        position &&
        createPortal(
          <div
            ref={contentRef}
            className={`fixed z-[100] ${contentClassName}`}
            style={{
              [side === "top" ? "bottom" : "top"]: side === "top" ? `calc(100vh - ${position.top}px)` : position.top,
              left: position.left,
              right: position.right,
            }}
          >
            {children}
          </div>,
          document.body
        )}
    </div>
  );
}
