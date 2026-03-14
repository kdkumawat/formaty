"use client";

import type { ReactNode } from "react";

interface EditorPanelProps {
  header: ReactNode;
  children: ReactNode;
  className?: string;
}

export function EditorPanel({ header, children, className = "" }: EditorPanelProps) {
  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-[var(--workspace-border)] bg-[var(--workspace-panel)] shadow-sm ${className}`}
    >
      {header}
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
