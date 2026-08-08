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
Supervisor review links use `PUBLIC_APP_URL` (or `APP_URL`), e.g. `{PUBLIC_APP_URL}/approve/:token`.
