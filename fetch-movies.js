// fetch-movies.js
//
// One-time data preparation step. Downloads The Movie Database's most-voted
// movies, keeps the top `COUNT` post-1950 titles, and writes them to a local
// `movies.json` file. The runtime server only ever reads that file — it never
// talks to TMDB again.
//
//   node fetch-movies.js
//
// Reads the read-access token from `TMDB_ACCESS_TOKEN` in a .env file (or the
// environment). To rebuild from scratch: delete movies.json and re-run.

import 'dotenv/config';
import { writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const TMDB_API = 'https://api.themoviedb.org/3';
const TOKEN = process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_KEY;

// ---- Tuning knobs --------------------------------------------------------
const DESIRED_COUNT = 1000; // how many top movies to keep
const MIN_YEAR = 1950; // only titles released on or after this year
const MAX_PAGES = 120; // safety cap on how many TMDB pages we pull (20 each)
const OUT_FILE = 'movies.json';
// ---------------------------------------------------------------------------

if (!TOKEN) {
  console.error(
    'No TMDB credentials found. Set TMDB_ACCESS_TOKEN (or TMDB_API_KEY) in .env and retry.'
  );
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(page) {
  const url = new URL(`${TMDB_API}/discover/movie`);
  url.searchParams.set('language', 'en-US');
  url.searchParams.set('sort_by', 'vote_count.desc');
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('include_video', 'false');
  url.searchParams.set('page', String(page));

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
  });
  if (!resp.ok) {
    throw new Error(`TMDB returned ${resp.status} ${resp.statusText} on page ${page}`);
  }
  return resp.json();
}

async function download() {
  let movies = [];
  const seenById = new Set();
  const seenByTitle = new Set();

  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await fetchPage(page);
    for (const r of data.results || []) {
      // Drop anything that isn't a normal theatrical film.
      if (r.adult || r.video) continue;
      const year = parseInt(String(r.release_date || '').slice(0, 4), 10);
      if (!Number.isFinite(year) || year < MIN_YEAR) continue;
      if (seenById.has(r.id) || seenByTitle.has(r.title)) continue;

      seenById.add(r.id);
      seenByTitle.add(r.title);
      movies.push({
        id: r.id,
        title: r.title,
        year,
        vote_count: r.vote_count,
        poster: r.poster_path || null,
      });
    }
    console.log(
      `page ${page}: ${Math.min(movies.length, DESIRED_COUNT)} movies (total ${data.total_pages} pages available)`
    );

    if (movies.length >= DESIRED_COUNT) break;
    if (page >= data.total_pages) break;
    await sleep(250); // be polite to the API
  }

  movies = movies.slice(0, DESIRED_COUNT);
  return movies;
}

async function main() {
  if (existsSync(OUT_FILE)) {
    console.log(`movies.json already exists (${OUT_FILE}) — delete it first to re-download.`);
    const existing = JSON.parse(await readFile(OUT_FILE, 'utf8'));
    console.log(`Found ${existing.length} cached movies.`);
    process.exit(0);
  }

  console.log(`Downloading top ${DESIRED_COUNT} post-${MIN_YEAR} movies from TMDB...`);
  const movies = await download();
  if (movies.length < 20) {
    console.error(`Only ${movies.length} movies found — something may be wrong.`);
    process.exit(1);
  }

  await writeFile(OUT_FILE, JSON.stringify(movies, null, 2));
  console.log(`\nSaved ${movies.length} movies to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});