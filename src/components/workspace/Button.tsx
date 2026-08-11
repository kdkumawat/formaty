"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  icon?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90 border-transparent",
  secondary:
    "bg-transparent border border-[var(--workspace-border)] text-[var(--workspace-text)] hover:bg-[var(--workspace-panel)]",
};

export function Button({
  variant = "secondary",
  children,
  icon,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <ShadcnButton
      type="button"
      variant="ghost"
      size="default"
      className={cn(
        "rounded-lg px-3 py-2 text-[13px] font-medium",
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </ShadcnButton>
  );
}
