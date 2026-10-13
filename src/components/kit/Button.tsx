"use client";

import { forwardRef, type ButtonHTMLAttributes, type ElementType, type ReactNode } from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { focusRing, HEIGHT, type KitSize } from "./styles";
import { Tooltip } from "./Tooltip";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "selected" | "danger";

const PRESS = "active:translate-y-[0.5px] motion-reduce:active:translate-y-0";
const VARIANT: Record<ButtonVariant, string> = {
  primary: cn("key-action font-[560]", PRESS),
  secondary: cn(
    "bg-control text-[var(--workspace-text)] live:hover:bg-control-hover data-[state=open]:bg-control-hover live:active:bg-[color-mix(in_srgb,var(--control-hover),var(--workspace-text)_8%)]",
    PRESS,
  ),
  ghost: cn(
    "bg-transparent text-[var(--workspace-text)] live:hover:bg-control data-[state=open]:bg-control live:active:bg-control-hover",
    PRESS,
  ),
  selected: cn("key-ink font-[520]", PRESS),
  danger: cn(
    "bg-bad-bg text-bad live:hover:bg-[color-mix(in_srgb,var(--bad-bg),var(--bad)_10%)] live:active:bg-[color-mix(in_srgb,var(--bad-bg),var(--bad)_18%)]",
    PRESS,
  ),
};

const PAD: Record<KitSize, string> = { sm: "px-2.5", md: "px-3", lg: "px-4 text-[15px]" };
const ICON_ONLY: Record<KitSize, string> = {
  sm: "w-7 max-[900px]:w-9",
  md: "w-9",
  lg: "w-11",
};

/** Class string shared by Button, IconButton and the other kit controls built on a button. */
export function buttonClasses(variant: ButtonVariant, size: KitSize, iconOnly = false) {
  return cn(
    "group/btn relative inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[13px] font-[470] tracking-[-0.005em] transition-[background-color,box-shadow,translate] duration-[120ms] ease-out",
    "disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:cursor-not-allowed aria-disabled:opacity-45",
    focusRing,
    HEIGHT[size],
    iconOnly ? ICON_ONLY[size] : PAD[size],
    VARIANT[variant],
  );
}

/** 16px icon slot; 70 percent at rest, 100 on hover (filled variants and the selected ink key stay full). */
export function KitIcon({ children, variant = "secondary" }: { children: ReactNode; variant?: ButtonVariant }) {
  const full = variant === "primary" || variant === "selected";
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center [&>svg]:size-4",
        !full && "opacity-70 group-hover/btn:opacity-100",
      )}
    >
      {children}
    </span>
  );
}

export function Spinner() {
  return (
    <svg className="size-4 shrink-0 animate-spin" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** sm = 28px (36px below 900px), md = 36px, lg = 44px. */
  size?: KitSize;
  /** 16px icon element before the label, e.g. `<ArrowDownTrayIcon />` from @heroicons/react/16/solid. */
  icon?: ReactNode;
  iconRight?: ReactNode;
  /** Shows a spinner in place of the icon and disables the button. */
  loading?: boolean;
  /** Render the single child (e.g. a link) with the button's styling. */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "sm", icon, iconRight, loading, asChild, className, children, disabled, type, ...rest },
  ref,
) {
  const Comp: ElementType = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? "button")}
      disabled={asChild ? undefined : disabled || loading}
      aria-disabled={asChild && (disabled || loading) ? true : undefined}
      aria-busy={loading || undefined}
      className={cn(buttonClasses(variant, size), className)}
      {...rest}
    >
      {loading ? <Spinner /> : icon ? <KitIcon variant={variant}>{icon}</KitIcon> : null}
      <Slottable>{children}</Slottable>
      {iconRight ? <KitIcon variant={variant}>{iconRight}</KitIcon> : null}
    </Comp>
  );
});

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Required: aria-label and tooltip text. */
  label: string;
  /** Shortcut in Mac notation shown in the tooltip. */
  shortcut?: string;
  /** The 16px icon element. */
  children: ReactNode;
  variant?: ButtonVariant;
  size?: KitSize;
  loading?: boolean;
  tooltipSide?: "top" | "bottom" | "left" | "right";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, shortcut, children, variant = "ghost", size = "sm", loading, tooltipSide, className, disabled, type, ...rest },
  ref,
) {
  return (
    <Tooltip content={label} shortcut={shortcut} side={tooltipSide}>
      <button
        ref={ref}
        type={type ?? "button"}
        aria-label={label}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(buttonClasses(variant, size, true), className)}
        {...rest}
      >
        {loading ? <Spinner /> : <KitIcon variant={variant}>{children}</KitIcon>}
      </button>
    </Tooltip>
  );
});
