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

**Gmail on Render:** Gmail SMTP often fails on Render (`ENETUNREACH`). Use **Resend** instead:

1. Create a free account at [resend.com](https://resend.com) → **API Keys** → create a key.
2. On **Render → Environment** add:
   - `RESEND_API_KEY` = `re_…`
   - `EMAIL_FROM` = `Tube Mill Reports <onboarding@resend.dev>` (or your verified domain)
3. **Redeploy** Render.

Free Resend can send from `onboarding@resend.dev` to **your Resend signup email** only until you verify a domain. For real supervisors, verify a domain in Resend or upgrade.

Keep **SMTP_*** in Render for reference, but when `RESEND_API_KEY` is set, the app sends via **HTTPS**, not SMTP.

Also on Render set `PUBLIC_APP_URL=https://tube-mill.vercel.app` (no trailing slash). Remove or ignore `API_URL` / `APP_URL` localhost values on Render.
