"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  icon?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-[background-color] duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--workspace-background)] disabled:opacity-60 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-content hover:opacity-90 focus:ring-primary",
  secondary:
    "bg-transparent border border-[var(--workspace-border)] text-[var(--workspace-text)] hover:bg-[var(--workspace-panel)] focus:ring-[var(--workspace-border)]",
};

export function Button({
  variant = "secondary",
  children,
  icon,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
