"use client";

import type { ReactNode } from "react";

const toolbarBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent px-3.5 py-2 text-[13px] font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--workspace-border)] focus:ring-offset-2 focus:ring-offset-[var(--workspace-background)] disabled:opacity-60 disabled:cursor-not-allowed";

const toolbarBtnPrimary =
  "bg-primary text-primary-content hover:opacity-90 border-transparent";

const toolbarBtnSecondary =
  "bg-transparent border-[var(--workspace-border)] text-[var(--workspace-text)] hover:bg-[var(--workspace-panel)]";

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
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`${toolbarBtn} ${
        primary ? toolbarBtnPrimary : toolbarBtnSecondary
      } ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
