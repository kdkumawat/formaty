"use client";

import { CheckIcon, ExclamationTriangleIcon, InboxIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

export function FeedbackSkeleton() {
  return (
    <ul className="mt-5 space-y-3" aria-label="Loading feedback">
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="animate-pulse rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4"
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-20 rounded-full bg-[var(--workspace-border)]/60" />
            <div className="h-3 w-14 rounded bg-[var(--workspace-border)]/60" />
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full rounded bg-[var(--workspace-border)]/60" />
            <div className="h-3 w-3/4 rounded bg-[var(--workspace-border)]/60" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export interface FeedbackErrorCardProps {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}

export function FeedbackErrorCard({ message, onRetry, retrying }: FeedbackErrorCardProps) {
  return (
    <div className="mt-10 rounded-xl border border-destructive/40 bg-destructive/5 p-10 text-center">
      <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-destructive" />
      <p className="mt-3 text-sm font-medium text-[var(--workspace-text)]">
        Could not load feedback
      </p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[var(--workspace-text-muted)]">
        {message}
      </p>
      <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onRetry} disabled={retrying}>
        {retrying ? "Retrying…" : "Retry"}
      </Button>
    </div>
  );
}

export interface FeedbackEmptyStateProps {
  isFiltered: boolean;
  isNewTab: boolean;
  onClearFilters: () => void;
}

export function FeedbackEmptyState({ isFiltered, isNewTab, onClearFilters }: FeedbackEmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="mt-10 rounded-xl border border-dashed border-[var(--workspace-border)] p-10 text-center">
        <InboxIcon className="mx-auto h-8 w-8 text-[var(--workspace-text-muted)]" />
        <p className="mt-3 text-sm font-medium text-[var(--workspace-text)]">
          No feedback matches these filters
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    );
  }
  return (
    <div className="mt-10 rounded-xl border border-dashed border-[var(--workspace-border)] p-10 text-center">
      <CheckIcon className="mx-auto h-8 w-8 text-emerald-500" />
      <p className="mt-3 text-sm font-medium text-[var(--workspace-text)]">
        {isNewTab ? "No new feedback - you are all caught up!" : "Nothing here yet."}
      </p>
    </div>
  );
}
