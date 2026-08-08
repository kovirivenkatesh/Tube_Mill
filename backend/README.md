# Tube Mill — Backend (Express + MongoDB)

## Setup

```bash
cd backend
npm install
copy .env.example .env
```

Edit `.env`: set `MONGODB_URI`, SMTP settings, and optional `ADMIN_EMAILS`, `PUBLIC_APP_URL`.

## Run

```bash
npm run dev
```

- **API:** http://localhost:3001

## MongoDB

| Variable | Example |
|----------|---------|
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/tube-mill-app` |
| Atlas | `mongodb+srv://USER:PASS@cluster.mongodb.net/tube-mill-app` |

**Optional — import legacy JSON:**

```bash
npm run migrate:json
```

Reads `data/files/users.json` and `submissions.json` if present.

## SMTP

Gmail: use an [App Password](https://support.google.com/accounts/answer/185833).  
Supervisor **Approve / Reject** links in email use **`PUBLIC_APP_URL`**, e.g. `{PUBLIC_APP_URL}/approve/:token`.

### Production (Render + Vercel)

In **Render → your web service → Environment** (not only local `.env`), set:

| Variable | Value |
|----------|--------|
| `PUBLIC_APP_URL` | Your **Vercel** site URL, e.g. `https://tube-mill.vercel.app` (no trailing slash) |
| `APP_URL` | Same as above (optional fallback) |

Redeploy Render after saving. **Old emails** still contain old localhost links; submit a **new** report to get correct links.

Local `backend/.env` can keep `PUBLIC_APP_URL=http://localhost:5173` for dev.
