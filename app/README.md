# Tracker Agentic App

> **Stack:** Next.js App Router · TypeScript · MongoDB · Gemini (server-side only)

A personal body care & self-improvement tracker powered by two AI agents (ingest + coach).

---

## Quick Start (Local Dev)

### Prerequisites

- **Node 20+** and **npm**
- **MongoDB** running locally: `mongod` (default port 27017)

### 1. Install dependencies

```bash
cd tracker-agentic-app/app
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local — the defaults work for local MongoDB
```

Key vars:

| Variable | Default | Notes |
|----------|---------|-------|
| `MONGO_URI` | `mongodb://127.0.0.1:27017/tracker` | Switch to Atlas URI for production |
| `JWT_ACCESS_SECRET` | *(must set)* | Min 32-char random string |
| `JWT_REFRESH_SECRET` | *(must set)* | Separate secret from access |
| `GEMINI_API_KEY` | *(plan 02+)* | Not required for plan 01 |

### 3. Run the dev server

```bash
npm run dev
# App at http://localhost:3000
```

---

## Creating and approving a user

1. **Register** via `POST /api/auth/register` (or the UI form in plan 04)
2. New accounts are **`pending`** — they see the demo dashboard only
3. **Approve manually** in MongoDB Compass / Atlas: set `status: "approved"` in `tracker.users`

---

## API Overview (Plan 01)

### Auth

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/auth/register` | email + username + password → pending account |
| `POST` | `/api/auth/login` | Credentials → access JWT + httpOnly refresh cookie |
| `POST` | `/api/auth/refresh` | Rotate refresh → new access token |
| `POST` | `/api/auth/logout` | Revoke refresh token + clear cookie |
| `GET`  | `/api/me` | Current user profile (any auth status) |

### User Data (approved only)

| Method | Route | Description |
|--------|-------|-------------|
| `GET/PUT` | `/api/goals` | Read/upsert workout, reading, water goals |
| `GET` | `/api/daily-entries` | Read entries by dateKey or date range |
| `GET/PUT` | `/api/progress` | Progress narrative (LLM generation in plan 03) |
| `GET/POST` | `/api/summaries` | Paginated summaries / 501 stub |

### Coach (approved only)

| Method | Route | Description |
|--------|-------|-------------|
| `GET/POST` | `/api/coach/conversations` | List (page-paginated) / create |
| `GET/PATCH/DELETE` | `/api/coach/conversations/:id` | Single conversation ops |
| `GET/POST` | `/api/coach/conversations/:id/messages` | Cursor-paginated messages / send |

---

## Security notes

- **userId** resolves **only** from the verified JWT — never from the request body
- Refresh tokens are **hashed** (SHA-256) before storage — raw token never persisted
- Refresh token **rotation** on every refresh call
- `pending` users get **403** on all approved-only routes
- Rate limiting on login (10/15 min) and register (5/15 min) per IP

---

## Plans

| # | File | Status |
|---|------|--------|
| 1 | `plans/01-backend-plan.md` | ✅ Done |
| 2 | `plans/02-ingest-agent-plan.md` | 🔜 Next |
| 3 | `plans/03-coach-agent-plan.md` | 🔜 Parallel with 02 |
| 4 | `plans/04-frontend-plan.md` | 🔜 After 02 + 03 |
