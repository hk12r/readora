import React, { useState, useEffect } from "react";
import { useReadora } from "../context/ReadoraContext";
import api from "../services/api";

function ReadingJournal() {
  const { library, auth, openAuthModal, showToast } = useReadora();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Active Stopwatch Timer State
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // New Session Form State
  const [selectedBookId, setSelectedBookId] = useState("");
  const [pagesRead, setPagesRead] = useState(15);
  const [startPage, setStartPage] = useState(0);
  const [endPage, setEndPage] = useState(15);
  const [sessionMood, setSessionMood] = useState("Thoughtful");
  const [thoughts, setThoughts] = useState("");
  const [favoriteQuote, setFavoriteQuote] = useState("");
  const [whyIReadThis, setWhyIReadThis] = useState("");

  const moods = [
    "Thoughtful",
    "Comforting",
    "Enchanted",
    "Emotional",
    "Tense",
    "Excited",
    "Inspired",
    "Melancholy",
    "Suspenseful",
  ];

  const whyOptions = [
    "Friend Recommendation",
    "Author Interest",
    "BookTok / Social Media",
    "Movie / TV Adaptation",
    "Reading Challenge",
    "Random Discovery",
    "Cover Caught My Eye",
    "Gift",
  ];

  // Fetch past sessions
  const fetchSessions = async () => {
    if (!auth.user) return;
    setLoading(true);
    try {
      const data = await api.getSessions();
      if (data) setSessions(data);
    } catch (err) {
      console.warn("Could not fetch sessions:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [auth.user]);

  // Stopwatch timer ticker
  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((sec) => sec + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Format timer MM:SS
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStopTimer = () => {
    setTimerRunning(false);
    // Suggest duration based on timer
    const minutes = Math.max(1, Math.round(timerSeconds / 60));
    showToast(`Timer stopped at ${minutes} minute${minutes > 1 ? "s" : ""}. Log your pages below!`);
  };

  // Submit Session
  const handleSubmitSession = async (e) => {
    e.preventDefault();
    if (!auth.user) {
      openAuthModal({ message: "Sign in to save your reading session to your journal." });
      return;
    }

    if (!selectedBookId && library.entries.length > 0) {
      setSelectedBookId(library.entries[0].bookId?._id || library.entries[0]._id);
    }

    const durationMinutes = Math.max(1, Math.round(timerSeconds / 60) || 20);

    try {
      await api.createSession({
        bookId: selectedBookId || library.entries[0]?.bookId?._id || library.entries[0]?._id,
        durationMinutes,
        pagesRead: parseInt(pagesRead) || (parseInt(endPage) - parseInt(startPage)) || 10,
        startPage: parseInt(startPage) || 0,
        endPage: parseInt(endPage) || 15,
        mood: sessionMood,
        thoughts,
        favoriteQuote,
      });

      showToast("Reading session logged in your journal! +30 XP ✦");
      setThoughts("");
      setFavoriteQuote("");
      setTimerSeconds(0);
      setTimerRunning(false);
      await fetchSessions();
    } catch (err) {
      showToast("Could not log session: " + err.message, "error");
    }
  };

  return (
    <main className="min-h-screen bg-readora-cream py-10">
      <div className="page-container">
        {/* HEADER */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-readora-gold/30 bg-readora-gold/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-readora-purple">
            <span>✍️</span> Reading Journal & Tracking
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold text-readora-purple sm:text-5xl">
            My Reading Journal
          </h1>
          <p className="mt-2 text-sm text-readora-brown/75 max-w-xl">
            Record every reading session, track your pace, capture memorable quotes, and reflect on
            how each chapter made you feel.
          </p>
        </div>

        {/* TOP GRID: ACTIVE READING TIMER + SESSION LOGGER */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          {/* LIVE TIMER CARD */}
          <div className="flex flex-col justify-between rounded-3xl border border-readora-gold/30 bg-gradient-to-br from-readora-purple via-readora-royal to-readora-plum p-7 text-readora-cream shadow-magical">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-readora-gold">
                Active Session Timer
              </span>
              <h2 className="mt-2 font-display text-2xl font-bold text-readora-cream">
                Dive into the Pages
              </h2>
              <p className="mt-1 text-xs text-readora-cream/75">
                Start the clock when you open your book. We'll track your reading speed and pace.
              </p>
            </div>

            {/* DIGIT CLOCK */}
            <div className="my-8 text-center">
              <div className="font-mono text-6xl font-bold tracking-widest text-readora-gold sm:text-7xl drop-shadow">
                {formatTime(timerSeconds)}
              </div>
              <p className="mt-2 text-xs font-semibold text-readora-cream/70 uppercase tracking-widest">
                {timerRunning ? "Reading in progress..." : "Timer Paused"}
              </p>
            </div>

            {/* TIMER BUTTONS */}
            <div className="flex gap-3">
              {!timerRunning ? (
                <button
                  type="button"
                  onClick={() => setTimerRunning(true)}
                  className="flex-1 rounded-full bg-readora-gold py-3 text-xs font-bold text-readora-purple shadow-gold hover:bg-readora-goldLight transition"
                >
                  ▶ Start Reading
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopTimer}
                  className="flex-1 rounded-full bg-red-500 py-3 text-xs font-bold text-white shadow hover:bg-red-600 transition"
                >
                  ⏸ Pause & Log
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSeconds(0);
                }}
                className="rounded-full border border-white/20 px-4 py-3 text-xs font-bold text-readora-cream hover:bg-white/10"
              >
                Reset
              </button>
            </div>
          </div>

          {/* SESSION LOGGING FORM */}
          <form
            onSubmit={handleSubmitSession}
            className="rounded-3xl border border-readora-purple/10 bg-white/80 p-7 shadow-sm"
          >
            <h2 className="font-display text-2xl font-bold text-readora-purple">
              Log a Reading Session
            </h2>
            <p className="mt-1 text-xs text-readora-brown/70">
              Add your pages, capture quotes, and record your thoughts.
            </p>

            <div className="mt-5 space-y-4">
              {/* SELECT BOOK */}
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Which book did you read?
                </label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full rounded-xl border border-readora-purple/20 bg-white p-2.5 text-xs font-semibold text-readora-brown outline-none"
                >
                  <option value="">-- Choose from your library --</option>
                  {library.entries.map((entry) => {
                    const b = entry.bookId || entry;
                    return (
                      <option key={entry._id || b.isbn} value={b._id || entry._id}>
                        {b.title} by {b.author} ({entry.shelf})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* PAGES READ & RANGE */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-readora-purple block mb-1">
                    Start Page
                  </label>
                  <input
                    type="number"
                    value={startPage}
                    onChange={(e) => {
                      setStartPage(e.target.value);
                      if (endPage > e.target.value) {
                        setPagesRead(endPage - e.target.value);
                      }
                    }}
                    className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-readora-purple block mb-1">
                    End Page
                  </label>
                  <input
                    type="number"
                    value={endPage}
                    onChange={(e) => {
                      setEndPage(e.target.value);
                      if (e.target.value >= startPage) {
                        setPagesRead(e.target.value - startPage);
                      }
                    }}
                    className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-readora-purple block mb-1">
                    Pages Read
                  </label>
                  <input
                    type="number"
                    value={pagesRead}
                    onChange={(e) => setPagesRead(e.target.value)}
                    className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none"
                  />
                </div>
              </div>

              {/* MOOD WHILE READING */}
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  How did this reading session feel?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {moods.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSessionMood(m)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        sessionMood === m
                          ? "bg-readora-purple text-readora-cream shadow-sm"
                          : "border border-readora-purple/15 bg-white text-readora-brown hover:bg-readora-lavenderLight"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* WHY I READ THIS */}
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Why I Read This? (Provenance)
                </label>
                <select
                  value={whyIReadThis}
                  onChange={(e) => setWhyIReadThis(e.target.value)}
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs font-semibold text-readora-brown outline-none"
                >
                  <option value="">-- Select reason --</option>
                  {whyOptions.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              {/* MEMORABLE QUOTE */}
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Favorite Quote / Line
                </label>
                <input
                  type="text"
                  value={favoriteQuote}
                  onChange={(e) => setFavoriteQuote(e.target.value)}
                  placeholder="Paste an excerpt or line that moved you..."
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none"
                />
              </div>

              {/* THOUGHTS & REFLECTIONS */}
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Thoughts & Reactions
                </label>
                <textarea
                  rows="3"
                  value={thoughts}
                  onChange={(e) => setThoughts(e.target.value)}
                  placeholder="What happened in this chapter? Any predictions or feelings?"
                  className="w-full rounded-2xl border border-readora-purple/15 bg-white p-3 text-xs text-readora-brown outline-none resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-readora-gold py-3 text-xs font-bold text-readora-purple shadow-gold hover:bg-readora-goldLight transition"
            >
              Save Journal Entry ✦
            </button>
          </form>
        </div>

        {/* TIMELINE OF PAST JOURNAL ENTRIES */}
        <section className="mt-14">
          <div className="flex items-center gap-2">
            <span className="text-xl text-readora-gold">✦</span>
            <h2 className="font-display text-2xl font-bold text-readora-purple">
              Journal Timeline ({sessions.length})
            </h2>
          </div>
          <p className="mt-1 text-xs text-readora-brown/70">
            A chronological memory of your sessions, pace, and reflections.
          </p>

          {sessions.length > 0 ? (
            <div className="mt-6 space-y-4">
              {sessions.map((ses) => (
                <div
                  key={ses._id}
                  className="relative rounded-3xl border border-readora-purple/10 bg-white/80 p-6 shadow-sm transition hover:border-readora-gold/30 hover:shadow-magical"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-readora-lavenderLight/40 text-lg">
                        📖
                      </span>
                      <div>
                        <h3 className="font-display text-base font-bold text-readora-purple">
                          {ses.bookId?.title || "Reading Session"}
                        </h3>
                        <p className="text-xs text-readora-brown/70">
                          {new Date(ses.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-readora-gold/20 px-3 py-1 text-xs font-bold text-readora-purple">
                        {ses.pagesRead} pages read
                      </span>
                      <span className="rounded-full bg-readora-purple/10 px-3 py-1 text-xs font-semibold text-readora-brown">
                        {ses.durationMinutes} mins
                      </span>
                      <span className="rounded-full border border-readora-purple/20 px-3 py-1 text-xs font-bold text-readora-purple">
                        ✦ {ses.mood}
                      </span>
                    </div>
                  </div>

                  {ses.favoriteQuote && (
                    <blockquote className="mt-4 border-l-2 border-readora-gold pl-3 text-xs italic text-readora-purple">
                      "{ses.favoriteQuote}"
                    </blockquote>
                  )}

                  {ses.thoughts && (
                    <p className="mt-3 text-xs leading-relaxed text-readora-brown/85">
                      {ses.thoughts}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-dashed border-readora-purple/20 bg-white/60 p-10 text-center">
              <span className="text-4xl text-readora-gold">✍️</span>
              <h3 className="mt-3 font-display text-xl font-bold text-readora-purple">
                No journal entries yet
              </h3>
              <p className="mt-1 text-xs text-readora-brown/70">
                Start your first reading session above to track your pace and log reflections.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default ReadingJournal;
