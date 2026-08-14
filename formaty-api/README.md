# formaty-api feedback endpoints (drop-in)

This folder contains the feedback backend for Formaty, written to be copied into
the **formaty-api** repository (Cloudflare Workers + TypeScript + KV). It adds a
`/feedback` API backed by **Cloudflare D1** (SQLite), with:

- `POST /feedback` — public, batched create (1-10 items per request), IP rate
  limited (5 / 10 min), honeypot anti-spam field, 5-2000 char validation.
- `GET /feedback?status=&limit=&offset=` — admin list (Bearer token), newest first.
- `PATCH /feedback/:id` — admin, set `status` (`new | in_progress | fixed | ignored`).
- `DELETE /feedback/:id` — admin, remove an item.

## Apply the changes

Copy these files over the existing ones in `formaty-api`:

| File here | Destination in formaty-api |
| --- | --- |
| `src/index.ts` | `src/index.ts` (replaces) |
| `src/routes/feedback.ts` | `src/routes/feedback.ts` (new) |
| `src/types/env.ts` | `src/types/env.ts` (replaces) |
| `src/config.ts` | `src/config.ts` (replaces) |
| `wrangler.toml` | `wrangler.toml` (replaces - keeps your KV ids) |
| `schema.sql` | `schema.sql` (new) |

No other files change; the playground routes stay exactly as they were.

## Setup (one-time)

```bash
cd formaty-api
npm install

# 1. Create the D1 database (SQLite)
wrangler d1 create formaty-feedback
#   -> copy the printed database_id into wrangler.toml under [[d1_databases]]

# 2. Create the table
wrangler d1 execute formaty-feedback --file=./schema.sql

# 3. Set the admin token (this is your "config level protection")
wrangler secret put FEEDBACK_ADMIN_TOKEN
#   -> paste a long random string, e.g. openssl rand -hex 32

# 4. Deploy
npm run deploy
```

## Using it

```bash
# Public: submit feedback (batched - several items at once)
curl -X POST https://YOUR_WORKER_URL/feedback \
  -H "Content-Type: application/json" \
  -d '{"items":[{"message":"CSV output should stay on raw view","category":"bug"},{"message":"Love the keyboard shortcuts","category":"praise"}],"page":"/json-to-csv"}'

# Admin: list new feedback
curl "https://YOUR_WORKER_URL/feedback?status=new" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Admin: mark as fixed
curl -X PATCH https://YOUR_WORKER_URL/feedback/ITEM_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"status":"fixed"}'
```

The token can also be passed as `?token=` (for convenience when opening the
admin page from a bookmarked URL).

## Frontend (formaty repo)

The Formaty app already contains the UI:

- **Feedback dialog** (playground status bar + landing footer) - multi-entry,
  batched submit, honeypot, graceful "not connected" fallback.
- **Admin page** at `https://formaty.dev/admin/feedback` - token protected,
  filter by status, mark fixed / in progress / ignored, delete.

It needs the API URL inlined at build time. Set `FORMATY_API_URL` in the
formaty build env (it is already wired through `next.config.ts`), e.g.
`https://formaty-api.YOUR_SUBDOMAIN.workers.dev`. Without it the dialog shows a
"not connected" state and the admin page explains what to configure.
