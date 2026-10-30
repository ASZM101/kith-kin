# Frontend Integration

This branch adds a React frontend in `web/` that talks to the existing Elysia backend in `app/` using the API in `notes.md`. The backend is unchanged. All art is placeholder.

## Layout

```
app/                    Elysia backend (untouched)
web/                    React + Vite + TypeScript frontend
  src/App.tsx           shows the login screen or the dashboard
  src/lib/api.ts        every API call
  src/components/       LoginScreen, Dashboard, PetCard, PetCanvas, QuestionCard, HistoryList
  public/assets/        placeholder art
  vite.config.ts        dev proxy to the backend
```

## Running it

Needs [Bun](https://bun.sh). Use two terminals:

```powershell
# terminal 1: backend on http://localhost:3000
cd app
bun install
bun run dev

# terminal 2: frontend on http://localhost:5173
cd web
bun install
bun run dev
```

Open http://localhost:5173 and log in as `test` / `admin123` (from `app/TestUsers.md`).

The backend has no CORS, so the Vite dev server proxies `/login`, `/logout`, `/question`, `/info`, `/history`, `/spend` and `/profile` to port 3000. For a production build run `bun run build` in `web/`; the output in `web/dist` needs to be served from the same origin as the API (for example by the backend, or a reverse proxy).

## How the frontend uses the API

All calls live in `web/src/lib/api.ts`. Every request sends `Authorization: Bearer <token>`, and any 401 (other than on login) clears the token and goes back to the login screen.

| Route | Request | Response the frontend reads |
| --- | --- | --- |
| `POST /login` | formdata `username`, `password` | `{ "token": "..." }`, stored in localStorage |
| `POST /logout` | none | ignored, token is cleared either way |
| `GET /question` | none | plain text question |
| `POST /question` | formdata `question`, `answer` | 2xx on success (backend adds 5 coins) |
| `GET /info` | none | `{ "coins": 5, "happiness": 5 }` |
| `GET /history?page=&count=` | `page` starts at 0 | bare array `[{ "question": "...", "answer": "..." }]`, oldest first |
| `POST /spend` | JSON `{ "coins": 1 \| 5 \| 10 }` | 2xx on success, 403 for an invalid amount or too few coins |

`/history` has no total, so the history list also fetches the next page to decide whether "Next" is enabled.

The pet card shows happiness only (the backend has no hunger). Mood is `sad` below 30, `happy` at 60 or more, else `neutral`. The three spend buttons are Pet (1), Treat (5) and Feed (10).

If `/info` fails, the dashboard shows an error banner and keeps the question, history and spend buttons usable.

## Replacing placeholder assets

Each file has a `PLACEHOLDER` comment inside. Replace the files and keep the names.

| File | Used for | Suggested format |
| --- | --- | --- |
| `web/public/assets/pet/happy.svg` | pet when happy | 256x256, transparent |
| `web/public/assets/pet/neutral.svg` | pet when neutral | 256x256, transparent |
| `web/public/assets/pet/hungry.svg` | pet when hungry | 256x256, transparent |
| `web/public/assets/pet/sad.svg` | pet when sad | 256x256, transparent |
| `web/public/assets/icons/food.svg` | feed button and particles | 64x64 |
| `web/public/assets/icons/heart.svg` | pet button and particles | 64x64 |
| `web/public/assets/icons/coin.svg` | coin counter | 64x64 |
| `web/public/assets/icons/streak.svg` | streak counter | 64x64 |
| `web/public/assets/logo.svg` | favicon, header, login | 64x64 |

To use PNGs, change the extensions in `SPRITES` and `PARTICLES` in `web/src/components/PetCanvas.tsx` and in the `<img>` tags. The pet is drawn on an HTML5 canvas in the `draw` function of `PetCanvas.tsx`, which is where sprite sheet animation would go.

## What the backend still needs (for whoever builds it)

- `GET /info` reads `users[users[username]].pet`, which throws, so it currently returns 500. It probably means `pets[users[username].pet]`.
- `POST /spend` uses `Math.max(100, ...)`, which jumps happiness to at least 100. It probably means `Math.min`.
- `POST /login` with an unknown username throws (500). The frontend shows that as a wrong username/password.
- Pairing, streaks, partner answers in history, and pet decay.
- Serving `web/dist`, or CORS, for production.
