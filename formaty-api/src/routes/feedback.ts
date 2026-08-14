import type { Env } from "../types/env";
import { CONFIG } from "../config";
import { json, error } from "../utils/response";

const FEEDBACK_STATUSES = ["new", "in_progress", "fixed", "ignored"] as const;
type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

const FEEDBACK_CATEGORIES = ["suggestion", "bug", "question", "praise", "other"] as const;
type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

interface FeedbackRow {
  id: string;
  message: string;
  category: string;
  email: string | null;
  page: string | null;
  browser: string | null;
  status: string;
  created_at: number;
  updated_at: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Create the table on first use. Idempotent and cheap - safe to run per request. */
async function ensureTable(env: Env): Promise<void> {
  await env.FEEDBACK_DB.prepare(
    `CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      message TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      email TEXT,
      page TEXT,
      browser TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
  ).run();
  await env.FEEDBACK_DB.prepare(
    `CREATE INDEX IF NOT EXISTS idx_feedback_status_created ON feedback (status, created_at DESC)`,
  ).run();
}

/** Bearer token (header) or ?token= (URL) against FEEDBACK_ADMIN_TOKEN. */
function isAuthorized(request: Request, env: Env): boolean {
  const secret = env.FEEDBACK_ADMIN_TOKEN;
  if (!secret) return false;
  const header = request.headers.get("Authorization") ?? "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim() === secret;
  }
  return new URL(request.url).searchParams.get("token") === secret;
}

async function checkFeedbackRateLimit(ip: string, env: Env): Promise<boolean> {
  const key = `feedback_rate_limit:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - CONFIG.FEEDBACK_RATE_LIMIT_WINDOW;
  const raw = await env.RATE_LIMIT_KV.get(key);
  let count = 0;
  let lastReset = now;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { count: number; windowStart: number };
      if (parsed.windowStart >= windowStart) {
        count = parsed.count;
        lastReset = parsed.windowStart;
      }
    } catch {
      /* invalid entry - treat as fresh */
    }
  }
  if (count >= CONFIG.FEEDBACK_RATE_LIMIT_MAX) return false;
  await env.RATE_LIMIT_KV.put(
    key,
    JSON.stringify({ count: count + 1, windowStart: lastReset }),
    { expirationTtl: CONFIG.FEEDBACK_RATE_LIMIT_WINDOW + 60 },
  );
  return true;
}

/**
 * POST /feedback - public, batched create.
 * Body: { items: [{ message, category?, email? }], page?, browser?, website? }
 * `website` is a honeypot: bots that fill it get a fake 200 and nothing is stored.
 */
export async function handlePostFeedback(request: Request, env: Env): Promise<Response> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const allowed = await checkFeedbackRateLimit(ip, env);
  if (!allowed) {
    return error("Rate limit exceeded - try again later", 429);
  }

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    return error("Content-Type must be application/json", 415);
  }
  const contentLength = request.headers.get("Content-Length");
  if (contentLength && parseInt(contentLength, 10) > CONFIG.MAX_BODY_SIZE) {
    return error("Payload too large", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Invalid JSON", 400);
  }

  if (typeof body !== "object" || body === null) return error("Invalid JSON", 400);
  const obj = body as Record<string, unknown>;

  // Honeypot: pretend success, store nothing.
  if (typeof obj.website === "string" && obj.website.trim().length > 0) {
    return json({ ok: true, count: 0 });
  }

  const rawItems = Array.isArray(obj.items) ? obj.items : [];
  if (rawItems.length === 0 || rawItems.length > CONFIG.FEEDBACK_MAX_ITEMS) {
    return error(`Provide between 1 and ${CONFIG.FEEDBACK_MAX_ITEMS} feedback items`, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  const page = typeof obj.page === "string" ? obj.page.slice(0, 500) : null;
  const browser = typeof obj.browser === "string" ? obj.browser.slice(0, 300) : null;
  const rows: Array<{ id: string; message: string; category: string; email: string | null }> = [];

  for (const raw of rawItems) {
    if (typeof raw !== "object" || raw === null) {
      return error("Each feedback item must be an object", 400);
    }
    const item = raw as Record<string, unknown>;
    const message = typeof item.message === "string" ? item.message.trim() : "";
    if (message.length < CONFIG.FEEDBACK_MIN_MESSAGE || message.length > CONFIG.FEEDBACK_MAX_MESSAGE) {
      return error(
        `Feedback message must be ${CONFIG.FEEDBACK_MIN_MESSAGE}-${CONFIG.FEEDBACK_MAX_MESSAGE} characters`,
        400,
      );
    }
    const category =
      typeof item.category === "string" &&
      (FEEDBACK_CATEGORIES as readonly string[]).includes(item.category)
        ? (item.category as FeedbackCategory)
        : "other";
    let email: string | null = null;
    if (typeof item.email === "string" && item.email.trim().length > 0) {
      email = item.email.trim().slice(0, 254);
      if (!EMAIL_RE.test(email)) return error("Invalid email address", 400);
    }
    rows.push({ id: crypto.randomUUID(), message, category, email });
  }

  await ensureTable(env);

  const stmt = env.FEEDBACK_DB.prepare(
    `INSERT INTO feedback (id, message, category, email, page, browser, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
  );
  const batch = rows.map((r) =>
    stmt.bind(r.id, r.message, r.category, r.email, page, browser, now, now),
  );
  await env.FEEDBACK_DB.batch(batch);

  return json({ ok: true, count: rows.length }, 201);
}

/** GET /feedback?status=&limit=&offset= - admin only, newest first. */
export async function handleListFeedback(request: Request, env: Env): Promise<Response> {
  if (!isAuthorized(request, env)) return error("Unauthorized", 401);

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  if (status && !(FEEDBACK_STATUSES as readonly string[]).includes(status)) {
    return error("Invalid status", 400);
  }
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") ?? 200) || 200));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0) || 0);

  await ensureTable(env);

  let rows: FeedbackRow[];
  let total = 0;
  if (status) {
    const listRes = await env.FEEDBACK_DB.prepare(
      `SELECT * FROM feedback WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
      .bind(status, limit, offset)
      .all<FeedbackRow>();
    rows = listRes.results ?? [];
    const countRes = await env.FEEDBACK_DB.prepare(
      `SELECT COUNT(*) AS total FROM feedback WHERE status = ?`,
    )
      .bind(status)
      .first<{ total: number }>();
    total = countRes?.total ?? 0;
  } else {
    const listRes = await env.FEEDBACK_DB.prepare(
      `SELECT * FROM feedback ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
      .bind(limit, offset)
      .all<FeedbackRow>();
    rows = listRes.results ?? [];
    const countRes = await env.FEEDBACK_DB.prepare(
      `SELECT COUNT(*) AS total FROM feedback`,
    ).first<{ total: number }>();
    total = countRes?.total ?? 0;
  }

  return json({ items: rows, total, limit, offset });
}

/** PATCH /feedback/:id - admin only. Body: { status }. */
export async function handleUpdateFeedback(
  id: string,
  request: Request,
  env: Env,
): Promise<Response> {
  if (!isAuthorized(request, env)) return error("Unauthorized", 401);
  if (!id || id.length > 64) return error("Invalid id", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Invalid JSON", 400);
  }
  const status = (body as { status?: unknown } | null)?.status;
  if (typeof status !== "string" || !(FEEDBACK_STATUSES as readonly string[]).includes(status)) {
    return error("Invalid status", 400);
  }

  await ensureTable(env);
  const res = await env.FEEDBACK_DB.prepare(
    `UPDATE feedback SET status = ?, updated_at = ? WHERE id = ?`,
  )
    .bind(status, Math.floor(Date.now() / 1000), id)
    .run();
  if (res.meta.changes === 0) return error("Not found", 404);

  return json({ ok: true });
}

/** DELETE /feedback/:id - admin only. */
export async function handleDeleteFeedback(id: string, request: Request, env: Env): Promise<Response> {
  if (!isAuthorized(request, env)) return error("Unauthorized", 401);
  if (!id || id.length > 64) return error("Invalid id", 400);

  await ensureTable(env);
  const res = await env.FEEDBACK_DB.prepare(`DELETE FROM feedback WHERE id = ?`).bind(id).run();
  if (res.meta.changes === 0) return error("Not found", 404);

  return json({ ok: true });
}
