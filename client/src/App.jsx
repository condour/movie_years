import { useCallback, useEffect, useMemo, useState } from 'react';

const IMG_BASE = 'https://image.tmdb.org/t/p/w185';

function loadRound() {
  return fetch('/api/round').then((r) => {
    if (!r.ok) throw new Error('failed to load round');
    return r.json();
  });
}

export default function App() {
  const [round, setRound] = useState(null);
  const [error, setError] = useState(null);

  // selectedMovieId: id currently picked up (waiting for a year).
  // selectedYearIdx: year currently picked up (waiting for a movie).
  // assignments: { [movieId]: yearIdx }
  // submitted: whether results are shown for the current round.
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [selectedYearIdx, setSelectedYearIdx] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const startRound = useCallback(async () => {
    try {
      const r = await loadRound();
      setRound(r);
      setAssignments({});
      setSelectedMovieId(null);
      setSelectedYearIdx(null);
      setSubmitted(false);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    startRound();
  }, [startRound]);

  const assignmentCount = Object.keys(assignments).length;
  const allAssigned = assignmentCount === 4 && !submitted;

  const assignedMovieYears = useMemo(() => {
    // which yearIdx values are already used, and by which movie
    const byYear = {};
    const byMovie = {};
    for (const [mid, yIdx] of Object.entries(assignments)) {
      byMovie[mid] = Number(yIdx);
      byYear[Number(yIdx)] = mid;
    }
    return { byYear, byMovie };
  }, [assignments]);

  if (error) {
    return <div className="app error-screen">Could not start the game: {error}</div>;
  }
  if (!round) return <div className="app loading">Loading a round…</div>;

  const movieById = Object.fromEntries(round.movies.map((m) => [m.id, m]));

  // ---- Interaction --------------------------------------------------------
  function handleMovieClick(movieId) {
    if (submitted) return;
    setSelectedYearIdx(null);

    // If this movie already has an assigned year, clicking again un-assigns it.
    if (movieId in assignments) {
      const next = { ...assignments };
      delete next[movieId];
      setAssignments(next);
      return;
    }

    // If a year was picked up, drop this movie onto it.
    if (selectedYearIdx != null) {
      setAssignments((a) => ({ ...a, [movieId]: selectedYearIdx }));
      setSelectedMovieId(null);
      setSelectedYearIdx(null);
      return;
    }

    // Otherwise just pick the movie up.
    setSelectedMovieId(movieId === selectedMovieId ? null : movieId);
  }

  function handleYearClick(yearIdx) {
    if (submitted) return;
    setSelectedMovieId(null);

    // Replace an existing assignment on this year? No — a year maps to only
    // one movie, but we allow re-assignment elsewhere. If this year is taken,
    // ignore (the movie would collide).
    if (yearIdx in assignedMovieYears.byYear) return;

    // If a movie was picked up, assign it.
    if (selectedMovieId != null) {
      setAssignments((a) => ({ ...a, [selectedMovieId]: yearIdx }));
      setSelectedMovieId(null);
      setSelectedYearIdx(null);
      return;
    }

    setSelectedYearIdx(yearIdx === selectedYearIdx ? null : yearIdx);
  }

  function submit() {
    const total = round.movies.length;
    let correct = 0;
    for (const m of round.movies) {
      if (m.year === round.years[assignments[m.id]]) correct++;
    }
    setScore((s) => ({ correct: s.correct + correct, total: s.total + total }));
    setSubmitted(true);
  }

  function cardState(movie) {
    if (!submitted) return null;
    const chosen = assignments[movie.id] != null ? round.years[assignments[movie.id]] : null;
    if (chosen === null) return null;
    return chosen === movie.year ? 'correct' : 'wrong';
  }

  // ---- Render ------------------------------------------------------------
  return (
    <div className="app">
      <header>
        <h1>🎬 Years</h1>
        <p className="tagline">Match each movie to the year it was released.</p>
        {(score.total > 0 || submitted) && (
          <div className="score">
            Score: {score.correct}/{score.total}
          </div>
        )}
      </header>

      <div className="board">
        {/* Movies */}
        <div className="column movies">
          <h2>Movies</h2>
          <div className="cards">
            {round.movies.map((m) => {
              const isSelected = selectedMovieId === m.id;
              const assigned = assignments[m.id] != null ? round.years[assignments[m.id]] : null;
              const state = cardState(m);
              return (
                <button
                  key={m.id}
                  className={`card movie ${state ?? ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleMovieClick(m.id)}
                >
                  {m.poster && (
                    <img src={`${IMG_BASE}${m.poster}`} alt="" loading="lazy" />
                  )}
                  <div className="info">
                    <span className="title">{m.title}</span>
                    {submitted && assigned !== null && (
                      <span className={`result ${state}`}>
                        {state === 'correct' ? '✓' : `→ ${m.year}`}
                      </span>
                    )}
                  </div>
                  {assigned !== null && !submitted && (
                    <span className="chosen-year">{assigned}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Years */}
        <div className="column years">
          <h2>Years</h2>
          <div className="cards">
            {round.years.map((year, i) => {
              const isSelected = selectedYearIdx === i;
              return (
                <button
                  key={i}
                  className={`card year ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleYearClick(i)}
                >
                  <span className="year-text">{year}</span>
                  {submitted && assignments && Object.values(assignments).includes(i) && (
                    <span className="dot" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="hint">
            Pick a movie, then its year — or pick a year, then the movie.
            {assignmentCount > 0 && (
              <> &nbsp;({assignmentCount}/4 matched)</>
            )}
          </p>
        </div>
      </div>

      <footer>
        {submitted ? (
          <button className="primary" onClick={startRound}>
            Next round →
          </button>
        ) : (
          <button className="primary" onClick={submit} disabled={!allAssigned}>
            Submit
          </button>
        )}
      </footer>
    </div>
  );
}