# Module 3 — Client state and interaction (`App.jsx`)

**Objective:** Understand the four pieces of component state, how pick-up/drop
works in both orders, and how Submit is scored.

## The state model

```js
const [selectedMovieId, setSelectedMovieId] = useState(null); // movie picked up
const [selectedYearIdx, setSelectedYearIdx] = useState(null); // year picked up
const [assignments, setAssignments] = useState({});           // { [movieId]: yearIdx }
const [submitted, setSubmitted] = useState(false);
const [score, setScore] = useState({ correct: 0, total: 0 });
```

Two subtle choices:

- `assignments` maps **movieId → yearIdx**, where `yearIdx` is an *index into
  `round.years`*, not the year value itself. The real year is looked up later
  with `round.years[assignments[movie.id]]`.
- `selectedMovieId` and `selectedYearIdx` are mutually exclusive by convention:
  each click handler clears the other selection first, so at most one thing is
  ever "picked up".

A small helper converts assignments into two lookup views, used by the year
cards to know which indexes are already taken:

```js
const assignedMovieYears = useMemo(() => {
  const byYear = {}, byMovie = {};
  for (const [mid, yIdx] of Object.entries(assignments)) {
    byMovie[mid] = Number(yIdx);
    byYear[Number(yIdx)] = mid;
  }
  return { byYear, byMovie };
}, [assignments]);
```

## Two click orders, one drop rule

The design brief allowed either "movie first, then year" or "year first, then
movie" — the code supports **both**. Symmetrically, each handler:

1. clears the *other* selection (`setSelectedMovieId(null)` / `setSelectedYearIdx(null)`);
2. checks if its counterpart is already picked up → if so, **drop** and assign;
3. otherwise, toggle itself as picked up.

Movie side:

```js
function handleMovieClick(movieId) {
  if (submitted) return;
  setSelectedYearIdx(null);                              // (1) clear lifted year
  if (movieId in assignments) {                          // already assigned?
    const next = { ...assignments };                     //     → un-assign
    delete next[movieId];
    setAssignments(next);
    return;
  }
  if (selectedYearIdx != null) {                         // (2) year is lifted?
    setAssignments((a) => ({ ...a, [movieId]: selectedYearIdx }));
    setSelectedMovieId(null); setSelectedYearIdx(null);
    return;
  }
  setSelectedMovieId(movieId === selectedMovieId ? null : movieId);  // (3) toggle
}
```

Year side:

```js
function handleYearClick(yearIdx) {
  if (submitted) return;
  setSelectedMovieId(null);                              // (1) clear lifted movie
  if (yearIdx in assignedMovieYears.byYear) return;      // taken → ignore
  if (selectedMovieId != null) {                         // (2) movie is lifted?
    setAssignments((a) => ({ ...a, [selectedMovieId]: yearIdx }));
    setSelectedMovieId(null); setSelectedYearIdx(null);
    return;
  }
  setSelectedYearIdx(yearIdx === selectedYearIdx ? null : yearIdx);   // (3) toggle
}
```

Because a year can map to only one movie, the year side *ignores* clicks on an
already-used year index, while the movie side *un-assigns* — an intentional
asymmetry. A movie you click again drops its match, freeing that year for reuse
elsewhere if it was already assigned.

## Submitting and scoring

Submit is enabled only when all four movies are matched, then grades locally:

```js
function submit() {
  const total = round.movies.length;
  let correct = 0;
  for (const m of round.movies) {
    if (m.year === round.years[assignments[m.id]]) correct++;
  }
  setScore((s) => ({ correct: s.correct + correct, total: s.total + total }));
  setSubmitted(true);
}
```

The comparison uses the index indirection from the state model: `round.years[
assignments[m.id]]` is the year the user picked, compared to `m.year`, the true
year that the server published. After that, `cardState(movie)` returns
`'correct'` / `'wrong'` (or `null` before submit) to drive the green/red
styling, and the footer button switches from **Submit** to **Next round**
(which calls `startRound()` and resets all state).

## Quiz

Answer from **this module only**.

**Q1.** What exactly does `assignments` store as values?

- A. The chosen year value itself, e.g. `1996`.
- B. An index into `round.years` for the chosen year.
- C. The chosen movie's TMDB id.
- D. A boolean saying whether the movie has been matched.

**Q2.** A user clicks a **year first**, then clicks a **movie**. What happens?

- A. The movie is assigned to that year (drop works in this order too).
- B. Nothing — only movie-first order is supported.
- C. The year selection is cleared and the pick-up is cancelled.
- D. The movie replaces whatever was previously assigned to it.

**Q3.** After matching all four movies, you click one of them again. What happens?

- A. The game auto-submits.
- B. The movie is locked in and cannot change.
- C. Its assignment is deleted, un-matching it for the round.
- D. It jumps to the top of the movie list.

## Answer key

<!-- ROT13:START -->
Nafjref: 1-O, 2-N, 3-P
1-O: nffvtazragf zncf rnpu zbivrVq gb n lrneVqk, na vaqrk vagb ebhaq.lrnef; gur erny lrne vf yngre ernq onpx jvgu ebhaq.lrnef[nffvtazragf[vq]].
2-N: obgu pyvpx beqref jbex: cvpx n zbivr gura n lrne, be cvpx n lrne gura n zbivr; gur qebc ybtvp yvirf va obgu unaqyref.
3-P: pyvpxvat na nffvtarq zbivr pnyyf qryrgr ba vgf xrl, ha-nffvtavat vg fb lbh pna punatr gur zngpu; Fhozvg fgnlf qvfnoyrq hagvy rknpgyl sbhe zngpurf rkvfg.
<!-- ROT13:END -->