"use client";

import type { ReactNode } from "react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  children: ReactNode;
}

export function Toolbar({ children }: ToolbarProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b border-[var(--workspace-border)] bg-[var(--workspace-background)] px-6 py-2"
      style={{ padding: "8px 24px" }}
    >
      {children}
    </div>
  );
}

export function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}

export function ToolbarDivider() {
  return (
    <div
      className="h-6 w-px shrink-0 bg-[var(--workspace-border)]"
      aria-hidden
    />
  );
}

export function ToolbarButton({
  primary,
  disabled,
  onClick,
  children,
  icon,
  title,
  className = "",
}: {
  primary?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  icon?: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <ShadcnButton
      type="button"
      variant="ghost"
      size="default"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3.5 py-2 text-[13px] font-medium",
        primary
          ? "bg-primary text-primary-foreground hover:opacity-90 border-transparent"
          : "bg-transparent border-[var(--workspace-border)] text-[var(--workspace-text)] hover:bg-[var(--workspace-panel)]",
        className,
      )}
    >
      {icon}
      {children}
    </ShadcnButton>
  );
}
