// server.js
//
// Express server for the "years" match game.
//   - Serves the built React app from ./client/dist
//   - Exposes /api/round for a fresh set of 4 movies + their shuffled years
//   - Grades submitted matches on /api/submit (server-side, cheat-proof)
//
// The movie pool is read once from movies.json (produced by fetch-movies.js).
// No runtime TMDB calls.

import express from 'express';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4310;

let movies = [];
try {
  const data = JSON.parse(await readFile(path.join(__dirname, 'movies.json'), 'utf8'));
  movies = data;
  console.log(`Loaded ${movies.length} movies from movies.json`);
} catch (err) {
  console.error('Could not load movies.json — run "npm run fetch" first.');
  process.exit(1);
}

const app = express();
app.use(express.json());

// Deterministic-ish shuffle source (crypto-based RNG, seeded per call).
function shuffled(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(crypto.randomBytes(4).readUInt32BE(0) / 0xffffffff * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Server-side answer keys for in-flight rounds, keyed by round id.
// The true year mapping is NEVER sent to the client (see buildRound), so a
// player cannot read the answer out of the page state or the bundle.
const rounds = new Map(); // roundId -> { byId: Map(movieId -> year), years }

// Build one playable round: 4 movies with distinct release years, and the
// four years presented in a shuffled order (so the mapping is one-to-one).
// The answer key is stored server-side; the client only receives the movie
// posters/titles and the shuffled years, not the true years.
function buildRound() {
  const picked = [];
  const usedYears = new Set();
  for (const m of shuffled(movies)) {
    if (usedYears.has(m.year)) continue;
    picked.push(m);
    usedYears.add(m.year);
    if (picked.length === 4) break;
  }

  const years = shuffled(picked.map((m) => m.year));
  const roundId = crypto.randomUUID();
  rounds.set(roundId, {
    byId: new Map(picked.map((m) => [String(m.id), m.year])),
    years,
  });
  return {
    roundId,
    // Deliberately no `year` in the movie objects — the browser must not
    // know the true years. See /api/submit for where grading actually happens.
    movies: picked.map(({ id, title, poster }) => ({ id, title, poster })),
    years,
  };
}

app.get('/api/round', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(buildRound());
});

// Grade a submitted round against the stored answer key. Correctness is
// decided here, server-side, so a client cannot cheat by tampering with its
// own score or by reading true years it was never sent.
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

// Static production build (if present).
const dist = path.join(__dirname, 'client', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`years game running at http://localhost:${PORT}`);
});