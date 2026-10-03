/**
 * Feedback API client for Formaty.
 *
 * The feedback backend lives in the formaty-api Cloudflare Worker (separate
 * repository, D1-backed /feedback endpoints). Formaty itself is a static
 * export, so it cannot persist anything - every submission and every admin
 * read goes to that Worker.
 *
 * Every function in this module degrades gracefully when the API is not
 * configured, so the rest of the app never breaks: dialogs show a friendly
 * "not connected" state instead of throwing.
 */

export type FeedbackCategory = "suggestion" | "bug" | "question" | "praise" | "other";
export type FeedbackStatus = "new" | "in_progress" | "fixed" | "ignored";

export interface FeedbackItemInput {
  message: string;
  category?: FeedbackCategory;
  email?: string;
}

export interface FeedbackItem extends FeedbackItemInput {
  id: string;
  page?: string;
  browser?: string;
  status: FeedbackStatus;
  created_at: number;
  updated_at: number;
}

export const FEEDBACK_CATEGORIES: Array<{ id: FeedbackCategory; label: string }> = [
  { id: "suggestion", label: "Suggestion" },
  { id: "bug", label: "Bug" },
  { id: "question", label: "Question" },
  { id: "praise", label: "Praise" },
  { id: "other", label: "Other" },
];

export const FEEDBACK_STATUSES: Array<{ id: FeedbackStatus; label: string }> = [
  { id: "new", label: "New" },
  { id: "in_progress", label: "In progress" },
  { id: "fixed", label: "Fixed" },
  { id: "ignored", label: "Ignored" },
];

/** Inlined at build time by next.config.ts env block (and/or NEXT_PUBLIC_*). */
const API_URL = process.env.FORMATY_API_URL ?? process.env.NEXT_PUBLIC_FORMATY_API_URL ?? "";

export function feedbackConfigured(): boolean {
  return API_URL.length > 0;
}

export const FEEDBACK_MAX_ITEMS = 5;
export const FEEDBACK_MIN_MESSAGE = 5;
export const FEEDBACK_MAX_MESSAGE = 2000;

/** Single fetch for the whole inbox - low volume (<500 items), filtered client-side. */
export const FEEDBACK_FETCH_LIMIT = 500;

/** Network timeout for admin reads/writes (AbortController). */
export const FEEDBACK_REQUEST_TIMEOUT_MS = 10_000;

/** How long the delete-undo affordance stays available. */
export const FEEDBACK_UNDO_WINDOW_MS = 8000;

/** Max parallel requests for bulk operations (no bulk endpoint - fan out client-side). */
const BULK_CONCURRENCY = 4;

export type FeedbackSubmitError = "not-configured" | "network" | "server" | "invalid";

export interface SubmitFeedbackPayload {
  items: FeedbackItemInput[];
  page?: string;
  browser?: string;
  /** Honeypot - must stay empty, otherwise the request is silently dropped. */
  website?: string;
}

export interface SubmitFeedbackResult {
  ok: boolean;
  count?: number;
  error?: FeedbackSubmitError | string;
}

export async function submitFeedback(payload: SubmitFeedbackPayload): Promise<SubmitFeedbackResult> {
  if (!API_URL) return { ok: false, error: "not-configured" };

  // Honeypot: pretend success without sending anything.
  if (payload.website && payload.website.trim().length > 0) {
    return { ok: true, count: payload.items.length };
  }

  const items = payload.items
    .map((i) => ({
      message: i.message.trim().slice(0, FEEDBACK_MAX_MESSAGE),
      category: i.category,
      email: i.email?.trim() || undefined,
    }))
    .filter((i) => i.message.length >= FEEDBACK_MIN_MESSAGE);

  if (items.length === 0) return { ok: false, error: "invalid" };

  try {
    const res = await fetch(`${API_URL}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        page: payload.page,
        browser: payload.browser,
      }),
    });
    if (!res.ok) {
      let detail = "";
      try {
        const data = (await res.json()) as { error?: string };
        detail = data.error ?? "";
      } catch {
        /* ignore parse errors */
      }
      return { ok: false, error: detail || `server (${res.status})` };
    }
    const data = (await res.json()) as { count?: number };
    return { ok: true, count: data.count ?? items.length };
  } catch {
    return { ok: false, error: "network" };
  }
}

// ---------------------------------------------------------------------------
// Admin API (typed errors so the UI can distinguish wrong-token from down)
// ---------------------------------------------------------------------------

export type FeedbackAdminError = "not-configured" | "unauthorized" | "network" | "server";

export type FetchFeedbackResult =
  | { ok: true; items: FeedbackItem[] }
  | { ok: false; error: FeedbackAdminError; status?: number };

export type FeedbackWriteResult =
  | { ok: true }
  | { ok: false; error: FeedbackAdminError; status?: number };

export interface FeedbackListQuery {
  status?: FeedbackStatus;
  limit?: number;
  offset?: number;
}

/** Build the query string for a feedback list request (pure - unit-tested). */
export function buildFeedbackQuery(query: FeedbackListQuery = {}): string {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  params.set("limit", String(query.limit ?? FEEDBACK_FETCH_LIMIT));
  params.set("offset", String(query.offset ?? 0));
  return params.toString();
}

/** Map an HTTP status / abort to an admin error code (pure - unit-tested). */
export function toAdminError(status: number | null): FeedbackAdminError {
  if (status === null) return "network";
  if (status === 401 || status === 403) return "unauthorized";
  return "server";
}

export function adminErrorMessage(error: FeedbackAdminError, status?: number): string {
  switch (error) {
    case "not-configured":
      return "The feedback API is not configured.";
    case "unauthorized":
      return "Incorrect admin token - check it and try again.";
    case "network":
      return "Could not reach the feedback service. Check your connection and try again.";
    case "server":
      return status ? `The service returned an error (${status}). Try again.` : "The service returned an error. Try again.";
  }
}

function withTimeout(signal?: AbortSignal): { signal: AbortSignal; done: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FEEDBACK_REQUEST_TIMEOUT_MS);
  const done = () => clearTimeout(timer);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return { signal: controller.signal, done };
}

export async function fetchFeedback(
  token: string,
  query: FeedbackListQuery = {},
): Promise<FetchFeedbackResult> {
  if (!API_URL) return { ok: false, error: "not-configured" };
  const clean = token.trim();
  if (!clean) return { ok: false, error: "unauthorized" };
  const { signal, done } = withTimeout();
  try {
    const res = await fetch(`${API_URL}/feedback?${buildFeedbackQuery(query)}`, {
      headers: { Authorization: `Bearer ${clean}` },
      signal,
    });
    if (!res.ok) return { ok: false, error: toAdminError(res.status), status: res.status };
    const data = (await res.json()) as { items?: FeedbackItem[] };
    return { ok: true, items: data.items ?? [] };
  } catch {
    return { ok: false, error: "network" };
  } finally {
    done();
  }
}

/**
 * Backwards-compatible list fetch returning `null` on any failure.
 * Prefer {@link fetchFeedback} for new code.
 */
export async function fetchFeedbackItems(
  token: string,
  query: FeedbackListQuery = {},
): Promise<FeedbackItem[] | null> {
  const res = await fetchFeedback(token, query);
  return res.ok ? res.items : null;
}

async function writeFeedbackItem(
  token: string,
  id: string,
  init: RequestInit,
): Promise<FeedbackWriteResult> {
  if (!API_URL) return { ok: false, error: "not-configured" };
  const clean = token.trim();
  if (!clean) return { ok: false, error: "unauthorized" };
  const { signal, done } = withTimeout();
  try {
    const res = await fetch(`${API_URL}/feedback/${encodeURIComponent(id)}`, {
      ...init,
      signal,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${clean}` },
    });
    if (!res.ok) return { ok: false, error: toAdminError(res.status), status: res.status };
    return { ok: true };
  } catch {
    return { ok: false, error: "network" };
  } finally {
    done();
  }
}

export async function updateFeedbackStatus(
  token: string,
  id: string,
  status: FeedbackStatus,
): Promise<FeedbackWriteResult> {
  return writeFeedbackItem(token, id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function deleteFeedbackItem(token: string, id: string): Promise<FeedbackWriteResult> {
  return writeFeedbackItem(token, id, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Bulk operations (no bulk endpoint - bounded-parallel fan-out, per-id results)
// ---------------------------------------------------------------------------

export interface BulkOperationResult {
  succeeded: string[];
  failed: Array<{ id: string; error: FeedbackAdminError }>;
}

async function runBulk(ids: string[], fn: (id: string) => Promise<FeedbackWriteResult>): Promise<BulkOperationResult> {
  const succeeded: string[] = [];
  const failed: Array<{ id: string; error: FeedbackAdminError }> = [];
  const queue = [...ids];
  const workers = Array.from({ length: Math.min(BULK_CONCURRENCY, queue.length) }, async () => {
    while (queue.length > 0) {
      const id = queue.shift();
      if (id === undefined) return;
      const res = await fn(id);
      if (res.ok) succeeded.push(id);
      else failed.push({ id, error: res.error });
    }
  });
  await Promise.all(workers);
  return { succeeded, failed };
}

export function bulkUpdateFeedbackStatus(
  token: string,
  ids: string[],
  status: FeedbackStatus,
): Promise<BulkOperationResult> {
  return runBulk(ids, (id) => updateFeedbackStatus(token, id, status));
}

export function bulkDeleteFeedback(token: string, ids: string[]): Promise<BulkOperationResult> {
  return runBulk(ids, (id) => deleteFeedbackItem(token, id));
}

// ---------------------------------------------------------------------------
// Pure presentation / filtering / export helpers (unit-tested)
// ---------------------------------------------------------------------------

export function categoryLabel(id: FeedbackCategory | undefined): string {
  return FEEDBACK_CATEGORIES.find((c) => c.id === id)?.label ?? "Other";
}

export function statusLabel(id: FeedbackStatus): string {
  return FEEDBACK_STATUSES.find((s) => s.id === id)?.label ?? id;
}

export function timeAgo(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts * 1000);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts * 1000).toLocaleDateString();
}

export function absoluteTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

export type FeedbackSort = "newest" | "oldest";

export interface FeedbackFilter {
  status: FeedbackStatus | "all";
  query: string;
  category: FeedbackCategory | "all";
  sort: FeedbackSort;
}

export const DEFAULT_FEEDBACK_FILTER: FeedbackFilter = {
  status: "new",
  query: "",
  category: "all",
  sort: "newest",
};

export function filterFeedbackItems(items: FeedbackItem[], filter: FeedbackFilter): FeedbackItem[] {
  const q = filter.query.trim().toLowerCase();
  const out = items.filter((item) => {
    if (filter.status !== "all" && item.status !== filter.status) return false;
    if (filter.category !== "all" && (item.category ?? "other") !== filter.category) return false;
    if (!q) return true;
    const haystack = [item.message, item.email ?? "", item.page ?? "", item.browser ?? ""]
      .join("\n")
      .toLowerCase();
    return q.split(/\s+/).every((token) => haystack.includes(token));
  });
  out.sort((a, b) =>
    filter.sort === "newest" ? b.created_at - a.created_at : a.created_at - b.created_at,
  );
  return out;
}

export function countByStatus(items: FeedbackItem[]): Record<FeedbackStatus | "all", number> {
  const counts: Record<FeedbackStatus | "all", number> = {
    all: items.length,
    new: 0,
    in_progress: 0,
    fixed: 0,
    ignored: 0,
  };
  for (const item of items) counts[item.status] += 1;
  return counts;
}

/** Compact bullet list ready to paste into an AI / issue tracker. */
export function formatFeedbackBullets(items: FeedbackItem[]): string {
  return items
    .map((item) => {
      const meta: string[] = [];
      if (item.page) meta.push(`page: ${item.page}`);
      if (item.email) meta.push(`email: ${item.email}`);
      meta.push(`status: ${statusLabel(item.status)}`);
      const metaStr = meta.length > 0 ? ` (${meta.join(", ")})` : "";
      return `- [${categoryLabel(item.category).toLowerCase()}] ${item.message}${metaStr}`;
    })
    .join("\n");
}

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** CSV export (header + one row per item). */
export function formatFeedbackCsv(items: FeedbackItem[]): string {
  const header = "id,category,status,message,email,page,browser,created_at,updated_at";
  const rows = items.map((item) =>
    [
      item.id,
      item.category ?? "",
      item.status,
      item.message,
      item.email ?? "",
      item.page ?? "",
      item.browser ?? "",
      String(item.created_at),
      String(item.updated_at),
    ]
      .map(csvCell)
      .join(","),
  );
  return [header, ...rows].join("\n");
}

export function buildFeedbackFilename(
  tab: FeedbackStatus | "all",
  format: "csv" | "json",
  now: Date = new Date(),
): string {
  const date = now.toISOString().slice(0, 10);
  return `feedback-${tab}-${date}.${format}`;
}

/** Trigger a client-side file download (Blob URL, cleaned up afterwards). */
export function downloadTextFile(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
