# Module 4 — Final round (requires opening the code)

Unlike modules 0–3, these questions are **not** answerable from the lesson text
alone. Open the actual files and trace the logic side by side.

**Open:**

- `client/src/App.jsx` — the two handlers `handleMovieClick` / `handleYearClick`,
  the render body, and `submit()`.
- `server.js` — the route wiring (`/api/round`, `/api/submit`, static files).

Work through the trace before answering.

## Quiz

**Q1.** Trace `handleYearClick`. Suppose a movie has been picked up
(`selectedMovieId` set) and the user clicks a year button whose index another
movie **already** uses. What is the exact result?

- A. The new movie overwrites that year's assignment on the card.
- B. The click is ignored (early return) and the movie stays picked up.
- C. Both movies become assigned to the same year and the UI shows a clash.
- D. The earlier movie is un-assigned to make room.

**Q2.** Trace `handleMovieClick` in the *opposite* starting state: a year has
just been picked up (`selectedYearIdx` set), and the user clicks a movie that
**already has** an assignment. Which branch runs, and what ends up where?

- A. `setSelectedYearIdx(null)` runs first, then the "un-assign" branch — the
  movie's assignment is deleted and the lifted year is dropped.
- B. The lifted year overwrites the movie's existing assignment.
- C. The movie is picked up alongside its old assignment, so it appears twice.
- D. The handler returns immediately and nothing changes.

**Q3.** In the render body of `App.jsx` this line appears:

```js
const movieById = Object.fromEntries(round.movies.map((m) => [m.id, m]));
```

Where else is `movieById` referenced in the file, and what role does it play?

- A. It is used by `handleMovieClick` to look up each movie's data.
- B. It is never referenced anywhere else in the file — dead code.
- C. It is passed to the `<img>` components for the poster URL.
- D. It replaces the `movieById` lookup in the scoring loop.

**Q4.** Read `server.js`, focusing on `app.use(express.json())` and the list of
routes (`/api/round`, static files). Does the JSON body-parsing middleware
actually get a request body to parse?

- A. No — `/api/round` is a GET and static serving sends files, so
  `express.json()` is never handed a request body.
- B. Yes — the client POSTs `{ roundId, assignments }` as JSON to `/api/submit`
  for server-side grading, so the middleware is required.
- C. Yes — the client POSTs JSON straight to `/api/round`.
- D. Yes — WebSocket upgrades send JSON that the middleware reads.

## Answer key

<!-- ROT13:START -->
Nafjref: 1-O, 2-N, 3-O, 4-O
1-O: unaqyrLrnePyvpx ergheaf rneyl jura lrneVqk vf nyernql vafvqr nffvtarqZbivrLrnef.olLrne, fb gur pyvpx vf vtaberq naq gur zbivr fgnlf cvpxrq hc.
2-N: unaqyrZbivrPyvpx pnyyf frgFryrpgrqLrneVqk(ahyy) orsber gur nffvtazrag oenapu, fb pyvpxvat na nyernql-nffvtarq zbivr obgu qebcf gung nffvtazrag naq pyrnef nal yvsgrq lrne.
3-O: zbivrOlVq vf pbzchgrq va gur eraqre obql ohg arire ersreraprq naljurer ryfr va gur svyr, znxvat vg qrnq pbqr.
4-O: gur pyvrag CBFGf {ebhaqVq, nffvtazragf} nf WFBA gb /ncv/fhozvg sbe tenqvat, fb rkcerff.wfba() svanyyl unf n erdhrfg obql gb cnefr.
<!-- ROT13:END -->