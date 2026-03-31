"use client";

import type { ReactNode } from "react";

interface PanelHeaderProps {
  title: string;
  actions?: ReactNode;
}

export function PanelHeader({ title, actions }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 py-2.5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
        {title}
      </h2>
      {actions ? <div className="flex items-center gap-1.5">{actions}</div> : null}
    </div>
  );
}
