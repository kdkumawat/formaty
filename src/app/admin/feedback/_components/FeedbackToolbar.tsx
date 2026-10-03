"use client";

import type { RefObject } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FEEDBACK_CATEGORIES,
  type FeedbackCategory,
  type FeedbackSort,
} from "@/lib/feedback";

export interface FeedbackToolbarProps {
  query: string;
  onQuery: (q: string) => void;
  category: FeedbackCategory | "all";
  onCategory: (c: FeedbackCategory | "all") => void;
  sort: FeedbackSort;
  onSort: (s: FeedbackSort) => void;
  resultCount: number;
  totalCount: number;
  searchRef: RefObject<HTMLInputElement | null>;
}

export function FeedbackToolbar({
  query,
  onQuery,
  category,
  onCategory,
  sort,
  onSort,
  resultCount,
  totalCount,
  searchRef,
}: FeedbackToolbarProps) {
  const filtered = query.trim().length > 0 || category !== "all";
  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-48">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--workspace-text-muted)]" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search message, email, page…  ( / )"
            className="h-8 pl-8 pr-8 text-xs"
            aria-label="Search feedback"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onQuery("")}
              className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-[var(--workspace-text-muted)] transition-colors hover:text-[var(--workspace-text)]"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select
          value={category}
          onValueChange={(v) => onCategory(v as FeedbackCategory | "all")}
        >
          <SelectTrigger className="h-8 w-36 text-xs" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All categories</SelectItem>
            {FEEDBACK_CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => onSort(v as FeedbackSort)}>
          <SelectTrigger className="h-8 w-28 text-xs" aria-label="Sort order">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest" className="text-xs">Newest</SelectItem>
            <SelectItem value="oldest" className="text-xs">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {filtered && (
        <p className="text-[11px] text-[var(--workspace-text-muted)]" role="status">
          Showing{" "}
          <span className="font-semibold text-[var(--workspace-text)] tabular-nums">
            {resultCount}
          </span>{" "}
          of <span className="tabular-nums">{totalCount}</span>
        </p>
      )}
    </div>
  );
}
