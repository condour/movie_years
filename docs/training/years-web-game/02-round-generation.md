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
const rounds = new Map(); // roundId -> { byId: Map(movieId -> year), years }

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
  const roundId = crypto.randomUUID();
  // Store the truth server-side; the `year` field is dropped from the payload.
  rounds.set(roundId, {
    byId: new Map(picked.map((m) => [String(m.id), m.year])),
    years,
  });
  return {
    roundId,
    movies: picked.map(({ id, title, poster }) => ({ id, title, poster })),
    years,
  };
}
```

Two deliberate consequences:

- **Distinct years.** No two movies in a round share a release year. That makes
  "title → year" a true one-to-one mapping, so the matching puzzle has a
  well-defined answer.
- **Hidden answer key.** Each movie's real `year` is **never** included in the
  payload (`movies: [...]` now keeps only `id`, `title`, `poster`). The true
  title→year mapping is stored in the `rounds` map keyed by the round's
  `roundId`. The four `years` are still sent, but only as the **shuffled
  display values**; the browser can't tell which year belongs to which movie
  until the server grades the round (via `POST /api/submit`, Module 3).

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

## Grading (server-side)

The client never sees the true years, so when the user locks in a match it
POSTs the round id and the `{ movieId: yearIdx }` assignments to `/api/submit`.
The server looks up the stored answer key and grades there:

```js
app.post('/api/submit', (req, res) => {
  const { roundId, assignments = {} } = req.body || {};
  const key = rounds.get(roundId);
  if (!key) {
    return res.status(404).json({ error: 'unknown or expired round' });
  }

  let correct = 0;
  const results = {}; // movieId -> { correct, year: true release year }
  for (const [movieId, year] of key.byId) {
    const chosenIdx = assignments[movieId];
    const chosenYear = chosenIdx != null ? key.years[chosenIdx] : null;
    const ok = chosenYear === year;
    if (ok) correct++;
    results[movieId] = { correct: ok, year };
  }

  res.json({ correct, total: key.byId.size, results });
});
```

`app.use(express.json())` (added near the top of `server.js`) parses the POST
body, so the middleware is actually used now. The response returns the tally
plus, per movie, whether the choice was right and the **true** year — so the
client can show the correct answer without having been trusted with it up
front.

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

**Q3.** In the `/api/round` payload, which statement is true about how the true
release years are handled?

- A. Each movie object carries its real `year`, and `years` is a reordering of them.
- B. `years` is the only year source sent to the client; the movie→year truth is
  kept server-side keyed by `roundId`.
- C. Both `years` and each true mapping are sent so the client can grade locally.
- D. `years` gets unrelated random integers; no year is tied to any movie.

## Answer key

<!-- ROT13:START -->
Nafjref: 1-P, 2-O, 3-O
1-P: ohvyqEbhaq fxvcf nal zbivr jubfr eryrnfr lrne nyernql fvgf va hfrqLrnef, thnenagrrvat sbhe zbivrf jvgu cnvejvfr-qvfgvapg eryrnfr lrnef.
2-O: qvfgvapg lrnef znxr gur gvgyr-gb-lrne znccvat bar-gb-bar, fb gur zngpuvat chmmyr fgnlf jryy-qrsvarq.
3-O: bayl gur fuhssyrq lrnef neenl vf frag gb gur pyvrag; gur zbivr-gb-lrne gehgu vf fgberq freire-fvqr va gur ebhaqf znc xrlrq ol ebhaqVq naq hfrq bayl ol CBFG /ncv/fhozvg sbe tenqvat.
<!-- ROT13:END -->