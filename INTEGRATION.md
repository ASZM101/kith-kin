# Frontend Integration

This branch adds a React frontend in `web/` that talks to the existing Elysia backend in `app/` using the API in `notes.md`. The backend is unchanged. All art is placeholder.

## Layout

```
app/                    Elysia backend (untouched)
web/                    React + Vite + TypeScript frontend
  src/App.tsx           shows the login screen or the dashboard
  src/lib/api.ts        every API call, plus temporary stubs (see below)
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

The backend has no CORS, so the Vite dev server proxies `/login`, `/logout`, `/question`, `/info`, `/history` and `/profile` to port 3000. For a production build run `bun run build` in `web/`; the output in `web/dist` needs to be served from the same origin as the API (for example by the backend, or a reverse proxy).

## How the frontend uses the API

| notes.md route | Backend today | Frontend behavior |
| --- | --- | --- |
| `POST /login` (formdata `username`, `password`) | done | Sends form data, stores the returned token in localStorage |
| `POST /logout` | done | Calls it, then clears the stored token |
| `GET /question` | done (plain text) | Shows the text. Also accepts JSON `"..."` or `{ "question": "..." }` if that changes later |
| `POST /question` (formdata `question`, `answer`) | not built | Sends the real request. On 404 it saves the answer in the local stub |
| `GET /info` | not built | Calls it. On 404 it shows stub pet stats |
| `GET /history?page=&count=` | not built | Calls it. On 404 it shows answers saved in the stub |

Every request sends `Authorization: Bearer <token>`. Any 401 (other than on login) clears the token and goes back to the login screen.

Once a route exists on the backend, the frontend uses it automatically. The stub fallbacks are marked `TODO` in `web/src/lib/api.ts` and can be deleted then.

### Response shapes the frontend expects

notes.md doesn't define these, so these are what the frontend is written against. Change `web/src/lib/api.ts` if the backend picks something different.

`GET /info`

```json
{
  "username": "test",
  "partner": "partner-name-or-null",
  "coins": 20,
  "streak": 3,
  "pet": { "name": "Kith", "hunger": 70, "happiness": 70 }
}
```

`hunger` and `happiness` run 0 to 100, where 100 is best. The frontend works out the mood: `hungry` if hunger < 30, else `sad` if happiness < 30, else `happy` if both are 60 or more, else `neutral`.

`GET /history?page=1&count=5`

```json
{
  "page": 1,
  "count": 5,
  "total": 12,
  "items": [
    {
      "question": "question 3",
      "answers": [{ "username": "test", "answer": "hello", "answered_at": "2026-10-28T17:00:00Z" }]
    }
  ]
}
```

Items are grouped by question, as notes.md describes.

`POST /question` only needs a 2xx status on success.

## Stubs

notes.md describes feeding and petting the pet with coins but has no route for it, so `api.feed()` and `api.pet()` are stub functions that change local state only.

| Stub | Rule |
| --- | --- |
| Starting state | 20 coins, 70 fullness, 70 happiness, 0 streak |
| Answer a question | +10 coins |
| Feed | costs 5 coins, +25 fullness |
| Pet | costs 3 coins, +15 happiness |

Stub data is kept in memory and resets when the page reloads. There is no decay in the stub; that belongs on the backend.

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

- `POST /question`, `GET /info`, `GET /history` from notes.md, returning the shapes above
- Routes for feeding and petting, then point `api.feed()` / `api.pet()` at them
- Storage for pairs, pet state, coins, streaks and answers
- Pet decay over time
- Serving `web/dist`, or CORS, for production
