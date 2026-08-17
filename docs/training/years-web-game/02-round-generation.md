# Module 2 — Round generation (`server.js`)

**Objective:** See how one `/api/round` call turns the loaded pool into a fair,
well-formed puzzle — and what guarantee the game depends on.

## Reading the pool once

At startup the server loads the whole pool into memory and shuts down if it's
missing:

```js
let movies = [];
try {
  const data = JSON.parse(await readFile(path.join(__dirname, 'movies.json'), 'utf8'));
  movies = data;
} catch (err) {
  console.error('Could not load movies.json — run "npm run fetch" first.');
  process.exit(1);
}
const PORT = process.env.PORT || 4310;
```

After this, `movies` is a module-level array, reused by every request.

## A cryptographic shuffle

The server brings its own shuffle rather than `Math.random`, for unbiased
ordering — a Fisher–Yates style loop seeded with `crypto.randomBytes`:

```js
function shuffled(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(crypto.randomBytes(4).readUInt32BE(0) / 0xffffffff * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
```

## The one-to-one guarantee

`buildRound()` walks a shuffled copy of the pool, keeping a set of years it has
already used. A movie is kept only if its release year is **new**:

```js
function buildRound() {
  const picked = [];
  const usedYears = new Set();
  for (const m of shuffled(movies)) {
    if (usedYears.has(m.year)) continue;   // already have this year → skip
    picked.push(m);
    usedYears.add(m.year);
    if (picked.length === 4) break;        // four distinct years is enough
  }

  const years = shuffled(picked.map((m) => m.year));   // shuffle the 4 years
  return {
    roundId: crypto.randomUUID(),
    movies: picked.map(({ id, title, year, poster }) => ({ id, title, year, poster })),
    years,
  };
}
```

Two deliberate consequences:

- **Distinct years.** No two movies in a round share a release year. That makes
  "title → year" a true one-to-one mapping, so the matching puzzle has a
  well-defined answer.
- **Published mapping.** Each movie's real `year` is **included** in the
  payload (`movies: [...]` keeps `year`). The four `years` are the same values,
  just **reordered**. The client therefore always has the truth; it grades
  locally (Module 3).

## Serving

```js
app.get('/api/round', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(buildRound());
});
```

`Cache-Control: no-store` stops browsers/proxies from reusing a round. Finally
the server serves the built React bundle (`client/dist`) and, for anything not
under `/api`, returns `index.html` (SPA-style fallback).

## Quiz

Answer from **this module only**.

**Q1.** What invariant does `buildRound()` guarantee about the four chosen movies?

- A. They all have the same release year.
- B. They are the four highest-vote-count films in the pool.
- C. No two share a release year.
- D. They are always consecutive pages from TMDB.

**Q2.** Why does the round require each movie to have a *different* year?

- A. So the years look visually distinct on screen.
- B. So the title-to-year mapping is one-to-one and the puzzle is well-defined.
- C. So the client doesn't need the true year value.
- D. To make the puzzle deliberately impossible.

**Q3.** The response contains both `movies[].year` and a `years` array. What is
the exact relationship between them?

- A. `years` is a shuffled permutation of the four `movies[].year` values.
- B. `years` are random integers unrelated to any movie in the round.
- C. `years` contains every year in `movies.json`.
- D. `years` equals the movies' years in the same order.

## Answer key

<!-- ROT13:START -->
Nafjref: 1-P, 2-O, 3-Q
1-P: ohvyqEbhaq fxvcf nal zbivr jubfr eryrnfr lrne nyernql fvgf va hfrqLrnef, thnenagrrvat sbhe zbivrf jvgu cnvejvfr-qvfgvapg eryrnfr lrnef.
2-O: qvfgvapg lrnef znxr gur gvgyr-gb-lrne znccvat bar-gb-bar, fb gur zngpuvat chmmyr fgnlf jryy-qrsvarq.
3-Q: gur lrnef neenl vf n fuhssyrq crezhgngvba bs rknpgyl gur sbhe cvpxrq zbivrf lrnef, cebqhprq ol gur pelcgb-onpxrq Svfure-Lngrf urycre fuhssyrq().
<!-- ROT13:END -->