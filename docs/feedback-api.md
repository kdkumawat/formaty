# Feedback system

Formaty is a fully static export - it cannot persist anything itself. The
feedback system therefore uses two parts:

1. **Frontend (this repo)** - the feedback dialog and the admin triage page.
2. **Backend (formaty-api repo)** - a Cloudflare Worker that stores feedback in
   **Cloudflare D1** (SQLite) and exposes the admin API. The complete drop-in
   implementation lives in [`formaty-api/`](../formaty-api) with setup steps.

## End-to-end flow

- A user opens the **Feedback** button (playground status bar, bottom row, next
  to the shortcuts icon, or the landing footer). The dialog supports **several
  items at once** - each with its own category and message - submitted as a
  single batched `POST /feedback`. Current page and browser info are attached
  automatically. A honeypot field filters bots, and the Worker rate-limits to
  5 submissions per IP per 10 minutes.
- Feedback lands in the D1 `feedback` table with `status = new`.
- The owner opens `https://formaty.dev/admin/feedback` (or `?token=...` for a
  bookmarked URL), pastes the admin token, and triages: mark **in progress**,
  **fixed**, **ignored**, or delete. The page is `noindex` and never linked
  publicly.

## What needs to be configured

| Key | Where | Purpose |
| --- | --- | --- |
| `FEEDBACK_ADMIN_TOKEN` | formaty-api Worker secret (`wrangler secret put`) | Admin protection for list/update/delete. Long random string, e.g. `openssl rand -hex 32`. |
| `FORMATY_API_URL` | formaty build env (Deploy env vars) | Base URL of the formaty-api Worker, e.g. `https://formaty-api.<subdomain>.workers.dev`. Already inlined by `next.config.ts`. |
| D1 database | formaty-api (`wrangler d1 create formaty-feedback`) | SQLite storage for feedback rows. |

Without `FORMATY_API_URL` the app stays fully functional - the dialog shows a
"not connected" state pointing to GitHub issues, and the admin page explains
the setup.

## Deploy steps

1. Apply `formaty-api/` files to the formaty-api repo and deploy (see
   [`formaty-api/README.md`](../formaty-api/README.md)).
2. Set `FORMATY_API_URL` in the formaty production env and redeploy.
3. Open `https://formaty.dev/admin/feedback`, paste the token once (kept in
   sessionStorage - it never ships to visitors in the bundle).
