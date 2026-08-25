"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowPathIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InboxIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/workspace/Tooltip";
import { toast } from "@/components/Toast";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  deleteFeedbackItem,
  feedbackConfigured,
  fetchFeedback,
  updateFeedbackStatus,
  type FeedbackCategory,
  type FeedbackItem,
  type FeedbackStatus,
} from "@/lib/feedback";

const TOKEN_STORAGE_KEY = "formaty-feedback-admin-token";

function categoryLabel(id: FeedbackCategory | undefined): string {
  return FEEDBACK_CATEGORIES.find((c) => c.id === id)?.label ?? "Other";
}

function timeAgo(ts: number): string {
  const diff = Math.max(0, Date.now() - ts * 1000);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts * 1000).toLocaleDateString();
}

export default function FeedbackAdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedbackStatus | "all">("new");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Read ?token= once and stash it in sessionStorage (never in the URL bar).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
      try {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, urlToken);
      } catch {
        /* ignore */
      }
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }
    try {
      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) setToken(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const data = await fetchFeedback(token, { limit: 200 });
    setLoading(false);
    if (data === null) {
      toast({ message: "Could not load feedback - check the token and API URL", type: "error" });
      return;
    }
    setItems(data);
  }, [token]);

  useEffect(() => {
    if (token) void refresh();
  }, [token, refresh]);

  const counts = useMemo(() => {
    const c: Record<FeedbackStatus | "all", number> = {
      all: items.length,
      new: 0,
      in_progress: 0,
      fixed: 0,
      ignored: 0,
    };
    for (const item of items) c[item.status] += 1;
    return c;
  }, [items]);

  const visible = useMemo(
    () => (activeTab === "all" ? items : items.filter((i) => i.status === activeTab)),
    [items, activeTab],
  );

  const setStatus = async (item: FeedbackItem, status: FeedbackStatus) => {
    if (!token) return;
    setBusyId(item.id);
    const ok = await updateFeedbackStatus(token, item.id, status);
    setBusyId(null);
    if (ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status, updated_at: Math.floor(Date.now() / 1000) } : i)),
      );
      toast({ message: `Marked ${status.replace("_", " ")}`, type: "success", duration: 1500 });
    } else {
      toast({ message: "Could not update item", type: "error" });
    }
  };

  const remove = async (item: FeedbackItem) => {
    if (!token) return;
    setBusyId(item.id);
    const ok = await deleteFeedbackItem(token, item.id);
    setBusyId(null);
    if (ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast({ message: "Deleted", type: "success", duration: 1500 });
    } else {
      toast({ message: "Could not delete item", type: "error" });
    }
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setToken(null);
    setTokenInput("");
    setItems([]);
  };

  /** Copy items in the currently selected tab as compact bullet points, ready to paste into an AI. */
  const copyAll = async () => {
    if (visible.length === 0) return;
    const lines = visible.map((item) => {
      const meta: string[] = [];
      if (item.page) meta.push(`page: ${item.page}`);
      if (item.email) meta.push(`email: ${item.email}`);
      meta.push(`status: ${FEEDBACK_STATUSES.find((s) => s.id === item.status)?.label ?? item.status}`);
      const metaStr = meta.length > 0 ? ` (${meta.join(", ")})` : "";
      return `- [${categoryLabel(item.category).toLowerCase()}] ${item.message}${metaStr}`;
    });
    const text = lines.join("\n");
    const tabLabel = activeTab === "all" ? "All" : FEEDBACK_STATUSES.find((s) => s.id === activeTab)?.label ?? activeTab;
    try {
      await navigator.clipboard.writeText(text);
      toast({
        message: `Copied ${visible.length} feedback item${visible.length === 1 ? "" : "s"} from ${tabLabel} as bullets`,
        type: "success",
      });
    } catch {
      toast({ message: "Could not copy to clipboard", type: "error" });
    }
  };

  if (!feedbackConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--workspace-background)] p-6">
        <div className="max-w-md rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-8 text-center">
          <InboxIcon className="mx-auto h-10 w-10 text-[var(--workspace-text-muted)]" />
          <h1 className="mt-4 text-lg font-semibold text-[var(--workspace-text)]">Feedback inbox</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--workspace-text-muted)]">
            The feedback API is not configured. Set{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">FORMATY_API_URL</code>{" "}
            (and deploy the feedback endpoints in the formaty-api Worker) to use this page. See{" "}
            <Link href="/docs" className="text-primary hover:underline">
              docs
            </Link>
            .
          </p>
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--workspace-background)] p-6">
        <div className="w-full max-w-sm rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-8">
          <InboxIcon className="h-10 w-10 text-[var(--workspace-text-muted)]" />
          <h1 className="mt-4 text-lg font-semibold text-[var(--workspace-text)]">Feedback inbox</h1>
          <p className="mt-2 text-sm text-[var(--workspace-text-muted)]">
            Enter your admin token to unlock. It is kept in this browser session only.
          </p>
          <form
            className="mt-5 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (tokenInput.trim()) {
                setToken(tokenInput.trim());
                try {
                  sessionStorage.setItem(TOKEN_STORAGE_KEY, tokenInput.trim());
                } catch {
                  /* ignore */
                }
              }
            }}
          >
            <Input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Admin token"
              autoComplete="off"
              className="h-10"
            />
            <Button type="submit" disabled={!tokenInput.trim()}>
              Unlock inbox
            </Button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--workspace-background)] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <InboxIcon className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold text-[var(--workspace-text)]">Feedback inbox</h1>
              <p className="text-xs text-[var(--workspace-text-muted)]">
                {items.length} item{items.length === 1 ? "" : "s"} total · newest first
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void copyAll()}
              disabled={loading || visible.length === 0}
            >
              <ClipboardDocumentListIcon className="h-4 w-4" />
              Copy all
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              disabled={loading}
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={logout}>
              Lock
            </Button>
          </div>
        </div>

        {/* Status tabs with counts */}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {(["all", ...FEEDBACK_STATUSES.map((s) => s.id)] as Array<FeedbackStatus | "all">).map((tab) => {
            const label = tab === "all" ? "All" : FEEDBACK_STATUSES.find((s) => s.id === tab)?.label ?? tab;
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
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

        {/* Items */}
        {loading && items.length === 0 ? (
          <p className="mt-10 text-center text-sm text-[var(--workspace-text-muted)]">Loading…</p>
        ) : visible.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-[var(--workspace-border)] p-10 text-center">
            <CheckIcon className="mx-auto h-8 w-8 text-emerald-500" />
            <p className="mt-3 text-sm font-medium text-[var(--workspace-text)]">
              {activeTab === "new" ? "No new feedback - you are all caught up!" : "Nothing here yet."}
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {visible.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        {categoryLabel(item.category)}
                      </span>
                      <span className="text-[10px] tabular-nums text-[var(--workspace-text-muted)]">
                        {timeAgo(item.created_at)}
                      </span>
                      {item.email && (
                        <span className="truncate text-[10px] text-[var(--workspace-text-muted)]">
                          {item.email}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--workspace-text)]">
                      {item.message}
                    </p>
                    {(item.page || item.browser) && (
                      <div className="mt-2.5 space-y-0.5 text-[10px] leading-snug text-[var(--workspace-text-muted)]">
                        {item.page && (
                          <p className="truncate font-mono">
                            <span className="opacity-70">page:</span> {item.page}
                          </p>
                        )}
                        {item.browser && (
                          <p className="truncate font-mono">
                            <span className="opacity-70">ua:</span> {item.browser}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {busyId === item.id ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <div className="flex items-center gap-1">
                        <Tooltip content="Mark in progress">
                          <button
                            type="button"
                            aria-label="Mark in progress"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-border)]/40 hover:text-amber-400"
                            onClick={() => void setStatus(item, "in_progress")}
                          >
                            <ClockIcon className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Mark fixed">
                          <button
                            type="button"
                            aria-label="Mark fixed"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--workspace-text-muted)] transition-colors hover:bg-emerald-500/15 hover:text-emerald-500"
                            onClick={() => void setStatus(item, "fixed")}
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Ignore">
                          <button
                            type="button"
                            aria-label="Ignore"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-border)]/40 hover:text-[var(--workspace-text)]"
                            onClick={() => void setStatus(item, "ignored")}
                          >
                            <XMarkIcon className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Delete">
                          <button
                            type="button"
                            aria-label="Delete"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--workspace-text-muted)] transition-colors hover:bg-red-500/15 hover:text-red-500"
                            onClick={() => void remove(item)}
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    )}
                    <span className="rounded-full border border-[var(--workspace-border)] px-2 py-0.5 text-[10px] font-medium text-[var(--workspace-text-muted)]">
                      {FEEDBACK_STATUSES.find((s) => s.id === item.status)?.label ?? item.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 flex items-center gap-1.5 text-[10px] text-[var(--workspace-text-muted)]">
          <ExclamationTriangleIcon className="h-3.5 w-3.5" />
          This page is protected by your admin token and is never indexed. Keep the token secret.
        </p>
      </div>
    </main>
  );
}
