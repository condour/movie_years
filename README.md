# Years 🎬

A web match game: four famous movies and four shuffled release years are shown.
Match each movie to the year it was released.

- **React** frontend (Vite) + **Node/Express** backend.
- Movie pool is the **top 1000 TMDB movies by vote count**, limited to titles
  released in **1950 or later** (well-known films people will recognise).
- The pool is downloaded **once** and stored as `movies.json` — the runtime
  server never calls TMDB, so no token is needed to run the site.

## Setup

```sh
# 1. Install dependencies
npm install
cd client && npm install && cd ..

# 2. Download the movie data into movies.json (needs a TMDB token in .env)
npm run fetch

# 3. Build the React frontend
npm run build

# 4. Run the game (serves the built app + the /api/round endpoint)
npm start
# → http://localhost:4310
```

The `.env` file (already present in this folder) is read by `npm run fetch` and
uses the `TMDB_ACCESS_TOKEN` key. It is git-ignored — never commit it.

> `movies.json` is **not** committed to the repo — it's regenerated on each
> machine by `npm run fetch`. If that file is missing, `npm start` will tell you
> to run `npm run fetch` first. To refresh the data later, just delete
> `movies.json` and re-run `npm run fetch`.

You can override the port with `PORT=8080 npm start`.

## Development

Run backend and frontend with hot-reload together:

```sh
npm run dev
```

- Backend on `http://localhost:4310`
- Frontend (Vite) on `http://localhost:5173`, frontend proxies `/api` → backend

## How it works

| Step | File | Purpose |
|------|------|---------|
| Data download | `fetch-movies.js` | Pulls TMDB `discover` sorted by `vote_count.desc`, keeps the top 1000 titles from 1950+, writes `movies.json`. |
| Server | `server.js` | Loads `movies.json` once. `GET /api/round` returns 4 movies with **distinct** release years plus the 4 years shuffled (one-to-one mapping) — **the true years are kept server-side and never sent to the browser**. `POST /api/submit` grades a round against its stored answer key, so correctness is decided on the server and can't be cheated. Serves the built React app. |
| Client | `client/src/App.jsx` | The game UI. It POSTs the user's matches to `/api/submit` and renders the server's verdict. |

## Playing

1. Click a **movie** to pick it up (or pick a **year** first — both orders work).
2. Click the matching **year** to assign it — a "chip" shows the assignment on
   the movie card.
3. Click an assigned movie again to un-assign it and change your mind.
4. Once all 4 are matched, hit **Submit**. The request is sent to the server,
   which grades the round (server-side). Correct matches turn green; wrong
   ones turn red and reveal the movie's true year (returned by the grader).
5. A running score accumulates across rounds. Click **Next round** to continue.