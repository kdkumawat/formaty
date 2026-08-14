export interface Env {
  PLAYGROUND_KV: KVNamespace;
  RATE_LIMIT_KV: KVNamespace;
  // Feedback storage (Cloudflare D1 - SQLite).
  FEEDBACK_DB: D1Database;
  // Secret set via `wrangler secret put FEEDBACK_ADMIN_TOKEN`.
  FEEDBACK_ADMIN_TOKEN?: string;
}
