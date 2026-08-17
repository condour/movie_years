// server.js
//
// Express server for the "years" match game.
//   - Serves the built React app from ./client/dist
//   - Exposes /api/round for a fresh set of 4 movies + their shuffled years
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

// Build one playable round: 4 movies with distinct release years, and the
// four years presented in a shuffled order (so the mapping is one-to-one).
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
  return {
    roundId: crypto.randomUUID(),
    // Movies include their year so the client keeps the mapping; the client
    // itself is the source of truth for correctness after submission.
    movies: picked.map(({ id, title, year, poster }) => ({ id, title, year, poster })),
    years,
  };
}

app.get('/api/round', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(buildRound());
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