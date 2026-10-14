"use client";

import { forwardRef, useRef, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";
import { focusRing, HEIGHT, type KitSize } from "./styles";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  /** Required when `label` is not text (icon-only segments). */
  "aria-label"?: string;
}

export interface SegmentedProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: KitSize;
  /** brand: chosen segment is the ink key. neutral: chosen segment is a raised panel-coloured tile. */
  tone?: "brand" | "neutral";
  "aria-label"?: string;
  className?: string;
}

/** Single-select switch. Radiogroup semantics; arrow keys move and select, Home/End jump. */
export function Segmented<T extends string = string>({
  options,
  value,
  onChange,
  size = "sm",
  tone = "brand",
  "aria-label": ariaLabel,
  className,
}: SegmentedProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (e: KeyboardEvent, from: number) => {
    const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    const pos = enabled.indexOf(from);
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? enabled[(pos + 1) % enabled.length]
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? enabled[(pos - 1 + enabled.length) % enabled.length]
          : e.key === "Home"
            ? enabled[0]
            : e.key === "End"
              ? enabled[enabled.length - 1]
              : undefined;
    if (next === undefined) return;
    e.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("inline-flex shrink-0 items-stretch gap-0.5 rounded-md bg-control p-0.5 ring-1 ring-inset ring-[var(--input)]", HEIGHT[size], className)}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        const button = (
          <button
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o["aria-label"]}
            disabled={o.disabled}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => move(e, i)}
            className={cn(
              "group/seg inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[5px] px-2.5 text-[13px] font-[470] tracking-[-0.005em] transition-[background-color,box-shadow,translate] duration-[120ms] ease-out disabled:cursor-not-allowed disabled:opacity-45",
              focusRing,
              size === "lg" && "px-3 text-[15px]",
              on
                ? tone === "brand"
                  ? "bg-selected text-selected-foreground ring-1 ring-inset ring-selected-border font-[520] shadow-[0_1px_2px_rgba(17,18,20,0.08)] dark:shadow-none"
                  : "key-tile font-[520]"
                : "text-[var(--workspace-text)] live:hover:bg-control-hover live:active:bg-[color-mix(in_srgb,var(--control-hover),var(--workspace-text)_8%)]",
            )}
          >
            {o.icon && <span aria-hidden className={cn("inline-flex size-4 shrink-0 [&>svg]:size-4", !on && "opacity-70 group-hover/seg:opacity-100")}>{o.icon}</span>}
            {o.label}
          </button>
        );
        return o["aria-label"] ? (
          <Tooltip key={o.value} content={o["aria-label"]}>
            {button}
          </Tooltip>
        ) : (
          <span key={o.value} className="contents">
            {button}
          </span>
        );
      })}
    </div>
  );
}

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** Toggled on: ink fill. */
  on: boolean;
  size?: KitSize;
  icon?: ReactNode;
  /** 16px icon after the label, e.g. a chevron on a chip that opens a menu. */
  iconRight?: ReactNode;
}

/** Toggle chip (output picker): rest bg-control, on bg-brand. Carries aria-pressed. */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip({ on, size = "sm", ...props }, ref) {
  return <Button ref={ref} variant={on ? "selected" : "ghost"} size={size} aria-pressed={on} {...props} className={cn(!on && "text-[var(--workspace-text-muted)] live:hover:bg-control-hover", props.className)} />;
});
