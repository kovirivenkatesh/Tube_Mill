# Tube Mill — Frontend (React + Vite)

## Setup

```bash
cd frontend
npm install
```

## Run

```bash
npm run dev
```

- **UI:** http://localhost:5173  
- API requests are proxied to the backend (see `vite.config.js`). Start the API from `../backend` first.

## Run frontend + backend together

From this folder:

```bash
npm run dev:all
```

## Build

```bash
npm run build
npm run preview
```

## Deploy on Vercel

| Setting | Value |
|---------|--------|
| Root Directory | `frontend` (or `Tube_Mill/frontend` if repo root is above) |
| Build Command | `npm run build` |
| Output Directory | `dist` |

`vercel.json` in this folder rewrites all routes to `index.html` so **refresh** on `/departments`, `/approve/...`, etc. does not show **404 NOT_FOUND**.

Environment variable: `VITE_API_BASE=https://YOUR-SERVICE.onrender.com/api`
