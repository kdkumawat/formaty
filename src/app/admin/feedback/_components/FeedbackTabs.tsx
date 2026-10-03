"use client";

import { FEEDBACK_STATUSES, type FeedbackStatus } from "@/lib/feedback";

export type FeedbackTab = FeedbackStatus | "all";

export interface FeedbackTabsProps {
  active: FeedbackTab;
  counts: Record<FeedbackTab, number>;
  onChange: (tab: FeedbackTab) => void;
}

export function FeedbackTabs({ active, counts, onChange }: FeedbackTabsProps) {
  const tabs: FeedbackTab[] = ["all", ...FEEDBACK_STATUSES.map((s) => s.id)];
  return (
    <div className="mt-5 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by status">
      {tabs.map((tab) => {
        const label =
          tab === "all" ? "All" : FEEDBACK_STATUSES.find((s) => s.id === tab)?.label ?? tab;
        const selected = active === tab;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              selected
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-[var(--workspace-border)] text-[var(--workspace-text-muted)] hover:border-primary/30 hover:text-[var(--workspace-text)]"
            }`}
          >
            {label}
            <span className="tabular-nums opacity-70">{counts[tab]}</span>
          </button>
        );
      })}
    </div>
  );
}
