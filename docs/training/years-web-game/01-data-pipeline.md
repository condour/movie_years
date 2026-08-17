# Module 1 — The data pipeline (`fetch-movies.js`)

**Objective:** Follow how a raw TMDB response becomes the cleaned `movies.json`
pool, and what rules govern which movies make the cut.

## Entry point

`main()` is a guard + orchestration wrapper:

```js
async function main() {
  if (existsSync(OUT_FILE)) {
    console.log(`movies.json already exists (${OUT_FILE}) — delete it first to re-download.`);
    const existing = JSON.parse(await readFile(OUT_FILE, 'utf8'));
    console.log(`Found ${existing.length} cached movies.`);
    process.exit(0);
  }
  // ...otherwise call download() and writeFile(OUT_FILE, JSON.stringify(movies, null, 2))
}
```

Note the **one-time contract**: if `movies.json` already exists, the script
bails out instead of clobbering the cache. To refresh, delete the file and
re-run.

## Honing in on "well-known"

TMDB orders by a field we choose. The script asks for `vote_count.desc`, i.e.
the movies with the most ratings first — a proxy for films people actually
recognise:

```js
url.searchParams.set('sort_by', 'vote_count.desc');
```

`download()` walks pages (20 results each) and stops once it has collected
`DESIRED_COUNT` (**1000**) cleaned movies, with a `MAX_PAGES` (120) safety
cap and a 250 ms `sleep` between pages to be polite to the API.

## The filter that decides "is this keepable"

Per raw result `r`, all of these must hold to be pushed into the pool:

```js
if (r.adult || r.video) continue;                                   // (1) not adult/short video

const year = parseInt(String(r.release_date || '').slice(0, 4), 10); // (2) parse first 4 chars
if (!Number.isFinite(year) || year < MIN_YEAR) continue;            // must be a real number >= MIN_YEAR

if (seenById.has(r.id) || seenByTitle.has(r.title)) continue;        // (3) no duplicates
seenById.add(r.id);
seenByTitle.add(r.title);
```

- **(1)** rejects adult content and videos that aren't real theatrical films.
- **(2)** `MIN_YEAR === 1950` — and note it's **`>=`**, so a movie released in
  1950 itself passes; anything earlier is dropped.
- **(3)** a row is dropped if its `id` **or** its exact `title` has already been
  seen. Two different films that share a title still collapse to one row.

Because we keep removing movies, we may paginate past page 1; the log reports
`page N: <kept> movies` as it goes. After reaching the goal it trims to the
first 1000 with `movies.slice(0, DESIRED_COUNT)`.

Each kept row is reduced to exactly what the game needs:

```js
movies.push({ id: r.id, title: r.title, year, vote_count: r.vote_count, poster: r.poster_path || null });
```

## Quiz

Answer from **this module only**.

**Q1.** How does the script choose which movies to prioritise while downloading?

- A. It sets `sort_by=vote_count.desc`, so the most-voted films arrive first.
- B. It sorts by the release date, newest first.
- C. It requests the smallest `vote_average` first to find obscure films.
- D. It picks a random page of TMDB each loop to maximise variety.

**Q2.** The year filter is `year < MIN_YEAR → continue` with `MIN_YEAR = 1950`.
Which statement is exactly true?

- A. Only films released strictly after 1950 are kept.
- B. Films released in 1950 and later are kept (1950 passes).
- C. The filter also rejects every film with a poster.
- D. The filter rejects all films released before 2010.

**Q3.** A very popular film appears in two TMDB pages under the exact same
title. What happens?

- A. Two rows are stored, one per page.
- B. Both are kept; duplicates are harmless.
- C. The second occurrence is skipped because the title is already in a Set.
- D. Only the row with the higher `vote_count` survives.

## Answer key

<!-- ROT13:START -->
Nafjref: 1-N, 2-O, 3-Q
1-N: srgpuCntr frgf fbeg_ol=ibgr_pbhag.qrfp, fb gur zbfg-ibgrq zbivrf fgernz va svefg naq qbjaybnq() fgbcf bapr QRFVERQ_PBHAG (1000) ebjf ner pbyyrpgrq.
2-O: ZVA_LRNE vf 1950 naq gur svygre xrrcf eryrnfr lrnef >= 1950 (fb 1950 vgfrys cnffrf) juvyr nyfb erwrpgvat nqhyg naq ivqrb ragevrf.
3-Q: qrqhcr hfrf gjb Frgf, bar xrlrq ol vq naq bar ol gvgyr, fb n gvgyr frra gjvpr fgvyy pbagevohgrf bayl n fvatyr ebj gb zbivrf.wfba.
<!-- ROT13:END -->