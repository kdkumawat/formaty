"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/Toast";
import {
  FEEDBACK_FETCH_LIMIT,
  FEEDBACK_UNDO_WINDOW_MS,
  adminErrorMessage,
  buildFeedbackFilename,
  bulkDeleteFeedback,
  bulkUpdateFeedbackStatus,
  countByStatus,
  downloadTextFile,
  feedbackConfigured,
  fetchFeedback,
  filterFeedbackItems,
  formatFeedbackBullets,
  formatFeedbackCsv,
  type FeedbackCategory,
  type FeedbackItem,
  type FeedbackSort,
  type FeedbackStatus,
} from "@/lib/feedback";
import { TokenGate } from "./_components/TokenGate";
import { FeedbackToolbar } from "./_components/FeedbackToolbar";
import { FeedbackTabs, type FeedbackTab } from "./_components/FeedbackTabs";
import { FeedbackCard } from "./_components/FeedbackCard";
import { BulkActionBar } from "./_components/BulkActionBar";
import { DeleteConfirmDialog } from "./_components/DeleteConfirmDialog";
import { FeedbackEmptyState, FeedbackErrorCard, FeedbackSkeleton } from "./_components/states";

const TOKEN_STORAGE_KEY = "formaty-feedback-admin-token";

function timeSince(ts: number | null): string {
  if (ts === null) return "";
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return new Date(ts).toLocaleTimeString();
}

export default function FeedbackAdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<FeedbackTab>("new");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState<FeedbackCategory | "all">("all");
  const [sort, setSort] = useState<FeedbackSort>("newest");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<FeedbackItem[] | null>(null);
  const [confirming, setConfirming] = useState(false);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const pendingDeleteRef = useRef<{ items: FeedbackItem[]; timer: number } | null>(null);

  // Read ?token= once and stash it in sessionStorage (never in the URL bar).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      const clean = urlToken.trim();
      window.history.replaceState({}, "", window.location.pathname);
      if (clean) {
        setToken(clean);
        try {
          sessionStorage.setItem(TOKEN_STORAGE_KEY, clean);
        } catch {
          /* ignore */
        }
      }
      return;
    }
    try {
      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) setToken(stored);
    } catch {
      /* ignore */
    }
  }, []);

  // Debounce search input.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  // "/" focuses search when not typing somewhere already.
  useEffect(() => {
    if (!token) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [token]);

  // Flush a pending (undo-window) delete - fire the real DELETE requests.
  const flushPendingDelete = useCallback(
    async (auth: string) => {
      const pending = pendingDeleteRef.current;
      pendingDeleteRef.current = null;
      if (!pending) return;
      window.clearTimeout(pending.timer);
      const res = await bulkDeleteFeedback(
        auth,
        pending.items.map((i) => i.id),
      );
      if (res.failed.length > 0) {
        const failedIds = new Set(res.failed.map((f) => f.id));
        setItems((prev) => [...pending.items.filter((i) => failedIds.has(i.id)), ...prev]);
        toast({
          message: `Could not delete ${res.failed.length} item${res.failed.length === 1 ? "" : "s"} - restored`,
          type: "error",
        });
      }
    },
    [],
  );

  const load = useCallback(
    async (auth: string, background: boolean) => {
      if (background) setRefreshing(true);
      else {
        setLoading(true);
        setLoadError(null);
      }
      const res = await fetchFeedback(auth, { limit: FEEDBACK_FETCH_LIMIT });
      if (background) setRefreshing(false);
      else setLoading(false);
      if (!res.ok) {
        if (!background) setLoadError(adminErrorMessage(res.error, res.status));
        else toast({ message: adminErrorMessage(res.error, res.status), type: "error" });
        return res;
      }
      setItems(res.items);
      setLastUpdated(Date.now());
      if (!background) setLoadError(null);
      return res;
    },
    [],
  );

  // Initial load after token is known (incl. ?token= deep link).
  useEffect(() => {
    if (token) void load(token, false);
  }, [token, load]);

  // Discard pending delete timers on unmount.
  useEffect(() => {
    return () => {
      const pending = pendingDeleteRef.current;
      if (pending) window.clearTimeout(pending.timer);
    };
  }, []);

  const unlock = useCallback(
    async (candidate: string): Promise<{ ok: true } | { ok: false; message: string }> => {
      const res = await fetchFeedback(candidate, { limit: 1 });
      if (!res.ok) return { ok: false, message: adminErrorMessage(res.error, res.status) };
      setToken(candidate);
      try {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, candidate);
      } catch {
        /* ignore */
      }
      void load(candidate, false);
      return { ok: true };
    },
    [load],
  );

  const counts = useMemo(() => countByStatus(items), [items]);

  const visible = useMemo(
    () =>
      filterFeedbackItems(items, {
        status: activeTab,
        query: debouncedQuery,
        category,
        sort,
      }),
    [items, activeTab, debouncedQuery, category, sort],
  );

  const visibleIds = useMemo(() => visible.map((i) => i.id), [visible]);
  const selectedVisible = useMemo(
    () => visible.filter((i) => selectedIds.has(i.id)),
    [visible, selectedIds],
  );
  const allVisibleSelected = visible.length > 0 && visible.every((i) => selectedIds.has(i.id));

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const all = visibleIds.every((id) => next.has(id));
      if (all) for (const id of visibleIds) next.delete(id);
      else for (const id of visibleIds) next.add(id);
      return next;
    });
  }, [visibleIds]);

  const mutateStatus = useCallback(
    async (targets: FeedbackItem[], status: FeedbackStatus) => {
      if (!token || targets.length === 0) return;
      const ids = new Set(targets.map((i) => i.id));
      setBusyIds((prev) => new Set([...prev, ...ids]));
      if (targets.length > 1) setBulkBusy(true);
      const now = Math.floor(Date.now() / 1000);
      const previous = new Map(targets.map((i) => [i.id, i.status]));
      setItems((prev) => prev.map((i) => (ids.has(i.id) ? { ...i, status, updated_at: now } : i)));
      const res = await bulkUpdateFeedbackStatus(
        token,
        targets.map((i) => i.id),
        status,
      );
      setBusyIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
      setBulkBusy(false);
      if (res.failed.length === 0) {
        const label = status === "in_progress" ? "in progress" : status;
        toast({ message: `Marked ${res.succeeded.length} ${label}`, type: "success", duration: 1500 });
        if (targets.length > 1) setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const id of res.succeeded) next.delete(id);
          return next;
        });
      } else {
        const failedIds = new Set(res.failed.map((f) => f.id));
        setItems((prev) =>
          prev.map((i) =>
            failedIds.has(i.id) ? { ...i, status: previous.get(i.id) ?? i.status } : i,
          ),
        );
        toast({
          message: `${res.succeeded.length} updated, ${res.failed.length} failed - failed items restored`,
          type: "error",
        });
      }
    },
    [token],
  );

  const copyText = useCallback(async (text: string, success: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast({ message: success, type: "success" });
    } catch {
      toast({ message: "Could not copy to clipboard", type: "error" });
    }
  }, []);

  const copyItems = useCallback(
    (targets: FeedbackItem[], label: string) => {
      if (targets.length === 0) return;
      void copyText(
        formatFeedbackBullets(targets),
        `Copied ${targets.length} feedback item${targets.length === 1 ? "" : "s"} from ${label} as bullets`,
      );
    },
    [copyText],
  );

  const exportItems = useCallback(
    (targets: FeedbackItem[], format: "csv" | "json") => {
      if (targets.length === 0) return;
      const text =
        format === "csv" ? formatFeedbackCsv(targets) : JSON.stringify(targets, null, 2);
      downloadTextFile(
        buildFeedbackFilename(activeTab, format),
        text,
        format === "csv" ? "text/csv" : "application/json",
      );
      toast({ message: `Exported ${targets.length} items as ${format.toUpperCase()}`, type: "success" });
    },
    [activeTab],
  );

  /** Confirm step done - remove from UI now, fire DELETE after the undo window. */
  const confirmDelete = useCallback(async () => {
    if (!token || !deleteTarget || deleteTarget.length === 0) return;
    setConfirming(true);
    // A second delete flushes the previous pending one first (single undo slot).
    await flushPendingDelete(token);
    const snapshot = deleteTarget;
    const snapshotIds = new Set(snapshot.map((i) => i.id));
    setDeleteTarget(null);
    setConfirming(false);
    setItems((prev) => prev.filter((i) => !snapshotIds.has(i.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of snapshotIds) next.delete(id);
      return next;
    });
    const timer = window.setTimeout(() => {
      void flushPendingDelete(token);
    }, FEEDBACK_UNDO_WINDOW_MS);
    pendingDeleteRef.current = { items: snapshot, timer };
    toast({
      message: `Deleted ${snapshot.length} item${snapshot.length === 1 ? "" : "s"}`,
      type: "success",
      duration: FEEDBACK_UNDO_WINDOW_MS,
      action: {
        label: "Undo",
        onClick: () => {
          const pending = pendingDeleteRef.current;
          if (pending) window.clearTimeout(pending.timer);
          pendingDeleteRef.current = null;
          setItems((prev) => [...snapshot, ...prev]);
          toast({ message: "Delete undone", type: "success", duration: 1500 });
        },
      },
    });
  }, [token, deleteTarget, flushPendingDelete]);

  const logout = () => {
    const pending = pendingDeleteRef.current;
    if (pending) window.clearTimeout(pending.timer);
    pendingDeleteRef.current = null;
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setToken(null);
    setItems([]);
    setSelectedIds(new Set());
    setLoadError(null);
    setLastUpdated(null);
  };

  const clearFilters = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setCategory("all");
    setActiveTab("all");
  }, []);

  const isFiltered = query.trim().length > 0 || category !== "all" || activeTab !== "all";
  const tabLabel =
    activeTab === "all" ? "All" : activeTab === "in_progress" ? "In progress" : activeTab;

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

  if (!token) return <TokenGate onUnlock={unlock} />;

  return (
    <main className="min-h-screen bg-[var(--workspace-background)] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <InboxIcon className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold text-[var(--workspace-text)]">Feedback inbox</h1>
              <p className="text-xs text-[var(--workspace-text-muted)]">
                {items.length} item{items.length === 1 ? "" : "s"} total ·{" "}
                {lastUpdated ? `updated ${timeSince(lastUpdated)}` : "newest first"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyItems(visible, tabLabel)}
              disabled={loading || visible.length === 0}
            >
              <ClipboardDocumentListIcon className="h-4 w-4" />
              Copy all
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => load(token, true)}
              disabled={loading || refreshing}
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading || refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={logout}>
              Lock
            </Button>
          </div>
        </div>

        <FeedbackTabs active={activeTab} counts={counts} onChange={setActiveTab} />

        <FeedbackToolbar
          query={query}
          onQuery={setQuery}
          category={category}
          onCategory={setCategory}
          sort={sort}
          onSort={setSort}
          resultCount={visible.length}
          totalCount={items.length}
          searchRef={searchRef}
        />

        {loading ? (
          <FeedbackSkeleton />
        ) : loadError && items.length === 0 ? (
          <FeedbackErrorCard
            message={loadError}
            retrying={false}
            onRetry={() => load(token, false)}
          />
        ) : visible.length === 0 ? (
          <FeedbackEmptyState
            isFiltered={isFiltered}
            isNewTab={activeTab === "new"}
            onClearFilters={clearFilters}
          />
        ) : (
          <>
            <div className="mt-5 flex items-center gap-2.5 px-1">
              <Checkbox
                checked={allVisibleSelected}
                onCheckedChange={() => toggleSelectAllVisible()}
                aria-label={allVisibleSelected ? "Deselect all visible" : "Select all visible"}
              />
              <span className="text-[11px] text-[var(--workspace-text-muted)]">
                {selectedIds.size > 0 ? (
                  <>
                    <span className="font-semibold text-[var(--workspace-text)] tabular-nums">
                      {selectedIds.size}
                    </span>{" "}
                    selected · {visible.length} visible
                  </>
                ) : (
                  <>{visible.length} visible</>
                )}
              </span>
            </div>
            <ul className="mt-2 space-y-3">
              {visible.map((item) => (
                <FeedbackCard
                  key={item.id}
                  item={item}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={() => toggleSelect(item.id)}
                  busy={busyIds.has(item.id)}
                  onStatus={(status) => void mutateStatus([item], status)}
                  onDelete={() => setDeleteTarget([item])}
                  onCopy={() => copyItems([item], "item")}
                />
              ))}
            </ul>
          </>
        )}

        <BulkActionBar
          count={selectedVisible.length}
          busy={bulkBusy}
          onStatus={(status) => void mutateStatus(selectedVisible, status)}
          onDelete={() => setDeleteTarget(selectedVisible)}
          onCopy={() => copyItems(selectedVisible, "selection")}
          onExportCsv={() => exportItems(selectedVisible, "csv")}
          onExportJson={() => exportItems(selectedVisible, "json")}
          onClear={() => setSelectedIds(new Set())}
        />

        <p className="mt-8 flex items-center gap-1.5 text-[10px] text-[var(--workspace-text-muted)]">
          <ExclamationTriangleIcon className="h-3.5 w-3.5" />
          This page is protected by your admin token and is never indexed. Keep the token secret.
        </p>
      </div>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        count={deleteTarget?.length ?? 0}
        confirming={confirming}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </main>
  );
}
