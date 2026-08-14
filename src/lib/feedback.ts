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

export interface FeedbackListQuery {
  status?: FeedbackStatus;
  limit?: number;
  offset?: number;
}

export async function fetchFeedback(
  token: string,
  query: FeedbackListQuery = {},
): Promise<FeedbackItem[] | null> {
  if (!API_URL) return null;
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  params.set("limit", String(query.limit ?? 200));
  params.set("offset", String(query.offset ?? 0));
  try {
    const res = await fetch(`${API_URL}/feedback?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: FeedbackItem[] };
    return data.items ?? [];
  } catch {
    return null;
  }
}

export async function updateFeedbackStatus(
  token: string,
  id: string,
  status: FeedbackStatus,
): Promise<boolean> {
  if (!API_URL) return false;
  try {
    const res = await fetch(`${API_URL}/feedback/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteFeedbackItem(token: string, id: string): Promise<boolean> {
  if (!API_URL) return false;
  try {
    const res = await fetch(`${API_URL}/feedback/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}
