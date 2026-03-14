"use client";

import type { ReactNode } from "react";

interface PanelHeaderProps {
  title: string;
  actions?: ReactNode;
}

export function PanelHeader({ title, actions }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--workspace-border)] px-3.5 py-2.5">
      <h2 className="text-sm font-semibold text-[var(--workspace-text)]">
        {title}
      </h2>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
