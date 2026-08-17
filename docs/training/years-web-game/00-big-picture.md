# Module 0 — Big picture

**Objective:** Understand the two-phase architecture and why the runtime never
touches the network.

## The one-time download

The whole design hinges on a *data-loading split*. Talking to TMDB is
expensive, rate-limited, and needs a secret token, so the app does it exactly
**once**, then forgets about it.

- **`fetch-movies.js`** is a preparation script (run manually via `npm run
  fetch`). It needs `TMDB_ACCESS_TOKEN` from `.env`, downloads the top movies,
  and writes a local file **`movies.json`**.
- **`server.js`** reads `movies.json` at startup and serves the game. It never
  makes a TMDB call again.

That split means you can clone the repo and run the site with **no token at
all** — as long as `movies.json` has been produced once on that machine.
Because the file is regenerable, it is **git-ignored** (see `.gitignore`), so
a fresh checkout just runs `npm run fetch` to rebuild it. The server even
grants up front: if the file is missing it prints
`Could not load movies.json — run "npm run fetch" first.` and exits.

```
TMDB ──npm run fetch──▶ fetch-movies.js ──writes──▶ movies.json
                                                       │
                                   (runtime, no TMDB) │ read once at startup
                                                       ▼
                                        server.js ──/api/round──▶ React client
```

## Two roles for "backend"

- **Data authority:** the server picks which 4 movies appear and which 4 years
  are shown. Each movie's **true** release year is included in the round
  payload.
- **Correctness judge:** the **client**. Because the true year ships with every
  movie, `App.jsx` can compare the user's choice to the real year locally and
  colour the cards green/red. No round-trip to the server is needed to grade.

## Dev vs. production

| Mode | Processes | How React talks to Express |
| ---- | --------- | -------------------------- |
| Dev (`npm run dev`) | Express on **4310** + Vite on **5173** | Vite proxy forwards `/api/*` → 4310 |
| Production (`npm start`) | Express on **4310** (port overridable via `PORT`) | Express serves the built `client/dist` files itself |

## Quiz

Answer from **this module only** — the repo is not needed.

**Q1.** After the initial build, how does the running game get its movie data?

- A. It queries TMDB for a fresh top-1000 list every time a round starts.
- B. It reads the pre-generated `movies.json` produced by `fetch-movies.js`.
- C. It downloads a new list from TMDB on every page load.
- D. It ships the movie list embedded inside the React bundle.

**Q2.** Where is a round's correctness actually judged (movies marked
green/red)?

- A. On the server, in the `/api/round` handler.
- B. In the client, inside `App.jsx`, using each movie's true year.
- C. By a second call to TMDB at submit time.
- D. The server holds an answer sheet retrieved from `movies.json`.

**Q3.** In development mode, how does the React dev server reach `/api/round`?

- A. It opens a direct WebSocket to TMDB.
- B. Express serves the React source tree on 5173.
- C. Vite proxies `/api/*` to the Express backend on 4310.
- D. The browser imports `movies.json` directly over the network.

## Answer key

<!-- ROT13:START -->
Nafjref: 1-O, 2-O, 3-N
1-O: freire.wf bayl ernqf zbivrf.wfba qhevat vgf jubyr yvsrgvzr; srgpu-zbivrf.wf qbrf gur bar-gvzr qbjaybnq. Gur ehagvzr znxrf mreb GZQO pnyyf.
2-O: gur freire vapyhqrf rnpu zbivr gehr eryrnfr lrne va gur ebhaq cnlybnq, fb pbeerpgarff vf whqtrq pyvrag-fvqr va Ncc.wfk, abg ba gur freire.
3-N: qri zbqr ehaf gjb cebprffrf (Rkcerff ba 4310 naq Ivgr ba 5173); Ivgr cebkvrf /ncv gb gur onpxraq, juvyr cebqhpgvba freirf gur ohvyg ncc fgenvtug sebz Rkcerff.
<!-- ROT13:END -->