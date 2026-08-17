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
  are shown. Only the **shuffled years** are sent; each movie's **true**
  release year is kept in a server-side answer key keyed by round id.
- **Correctness judge:** the **server**. Because the true years never reach the
  browser, a player can't read the answer out of the page state or the bundle.
  When the user submits, `App.jsx` POSTs the round id + matches to
  `POST /api/submit`, and the server grades against its answer key and returns
  the per-movie results.

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

**Q2.** Where does the running game actually decide whether a match is correct
(cards turn green/red)?

- A. On the client, inside `App.jsx`, using each movie's true year.
- B. On the server, at `POST /api/submit`, against an answer key kept per round.
- C. By a second call to TMDB at submit time.
- D. The server re-reads `movies.json` for the answer on every submission.

**Q3.** In development mode, how does the React dev server reach `/api/round`?

- A. It opens a direct WebSocket to TMDB.
- B. Express serves the React source tree on 5173.
- C. Vite proxies `/api/*` to the Express backend on 4310.
- D. The browser imports `movies.json` directly over the network.

## Answer key

<!-- ROT13:START -->
Nafjref: 1-O, 2-O, 3-P
1-O: freire.wf bayl ernqf zbivrf.wfba qhevat vgf jubyr yvsrgvzr; srgpu-zbivrf.wf qbrf gur bar-gvzr qbjaybnq. Gur ehagvzr znxrf mreb GZQO pnyyf.
2-O: gur freire xrrcf rnpu ebhaq'f gehr lrnef va n freire-fvqr nafjre xrl naq tenqrf ba CBFG /ncv/fhozvg, fb pbeerpgarff vf arire qrpvqrq va gur oebjfre.
3-P: qri zbqr ehaf gjb cebprffrf (Rkcerff ba 4310 naq Ivgr ba 5173); Ivgr cebkvrf /ncv gb gur onpxraq, juvyr cebqhpgvba freirf gur ohvyg ncc fgenvtug sebz Rkcerff.
<!-- ROT13:END -->