import React, { useState, useEffect } from "react";
import BookCard from "../components/BookCard";
import BookModal from "../components/BookModal";
import Button from "../components/Button";
import { useReadora } from "../context/ReadoraContext";
import api from "../services/api";
import curatedBooks, { allMoodsList } from "../data/curatedCatalog";

function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState("All");
  const [selectedPace, setSelectedPace] = useState("All");
  const [selectedLength, setSelectedLength] = useState("All");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [fictionFilter, setFictionFilter] = useState("All");

  const [books, setBooks] = useState(curatedBooks);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(false);

  // "Pick My Next Book" (Surprise Me) modal state
  const [surpriseModalOpen, setSurpriseModalOpen] = useState(false);
  const [surpriseConfig, setSurpriseConfig] = useState({
    mood: "Any",
    pace: "Any",
    length: "any",
    source: "all",
  });
  const [surpriseResult, setSurpriseResult] = useState(null);
  const [shuffling, setShuffling] = useState(false);

  const { auth } = useReadora();

  // Load recommendations if user is authenticated
  useEffect(() => {
    if (auth.user) {
      api
        .getRecommendations()
        .then((recs) => {
          if (recs && recs.length > 0) setRecommendations(recs);
        })
        .catch(() => {});
    }
  }, [auth.user]);

  // Handle Search & Filter
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setBooks(curatedBooks);
      return;
    }

    setLoading(true);
    try {
      const data = await api.searchBooks(searchQuery.trim(), true);
      if (data && data.books && data.books.length > 0) {
        setBooks(data.books);
      } else {
        // Local search fallback
        const q = searchQuery.toLowerCase();
        const matches = curatedBooks.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            (b.genre && b.genre.toLowerCase().includes(q))
        );
        setBooks(matches);
      }
    } catch (err) {
      const q = searchQuery.toLowerCase();
      const matches = curatedBooks.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.genre && b.genre.toLowerCase().includes(q))
      );
      setBooks(matches);
    } finally {
      setLoading(false);
    }
  };

  // Filter books locally
  const filteredBooks = books.filter((book) => {
    if (selectedMood !== "All" && (!book.moods || !book.moods.includes(selectedMood))) {
      return false;
    }
    if (selectedPace !== "All" && book.pace !== selectedPace) {
      return false;
    }
    if (selectedGenre !== "All" && book.genre !== selectedGenre) {
      return false;
    }
    if (fictionFilter === "Fiction" && book.isFiction === false) {
      return false;
    }
    if (fictionFilter === "Nonfiction" && book.isFiction !== false) {
      return false;
    }
    if (selectedLength === "<200" && (book.pages || 300) >= 200) return false;
    if (selectedLength === "200-400" && ((book.pages || 300) < 200 || (book.pages || 300) > 400))
      return false;
    if (selectedLength === "400-600" && ((book.pages || 300) < 400 || (book.pages || 300) > 600))
      return false;
    if (selectedLength === "600+" && (book.pages || 300) <= 600) return false;

    return true;
  });

  // Unique genres
  const genres = [
    "All",
    "Fantasy",
    "Mystery",
    "Thriller",
    "Romance",
    "Classic",
    "Science Fiction",
    "Literary Fiction",
    "Historical Fiction",
    "Young Adult",
    "Memoir",
    "Philosophy / Wellness",
  ];

  // Surprise Me Handler
  const handleSurpriseMe = async () => {
    setShuffling(true);
    setSurpriseResult(null);

    setTimeout(async () => {
      try {
        if (auth.user) {
          const res = await api.pickNextBook(surpriseConfig);
          if (res?.book) {
            setSurpriseResult(res);
            setShuffling(false);
            return;
          }
        }
      } catch (err) {
        // fallback
      }

      // Local selection
      let candidates = curatedBooks;
      if (surpriseConfig.mood !== "Any") {
        candidates = candidates.filter((b) => (b.moods || []).includes(surpriseConfig.mood));
      }
      if (surpriseConfig.pace !== "Any") {
        candidates = candidates.filter((b) => b.pace === surpriseConfig.pace);
      }
      if (surpriseConfig.length === "short") {
        candidates = candidates.filter((b) => (b.pages || 300) < 250);
      } else if (surpriseConfig.length === "epic") {
        candidates = candidates.filter((b) => (b.pages || 300) > 450);
      }

      const match = candidates[Math.floor(Math.random() * candidates.length)] || curatedBooks[0];
      setSurpriseResult({
        book: match,
        matchReason: `Selected for your current reading mood (${surpriseConfig.mood}) and pacing preference!`,
      });
      setShuffling(false);
    }, 700);
  };

  return (
    <main className="min-h-screen bg-readora-cream py-10">
      <div className="page-container">
        {/* HEADER & SURPRISE ME BANNER */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-readora-gold/30 bg-readora-gold/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-readora-purple">
              <span>✦</span> Extensive Catalog & Discovery
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold text-readora-purple sm:text-5xl">
              Explore Every Story
            </h1>
            <p className="mt-2 text-sm text-readora-brown/75 max-w-xl">
              Search millions of books through Google Books & Open Library, filter by mood, pace,
              and length, or let Readora surprise you with your next literary adventure.
            </p>
          </div>

          {/* SURPRISE ME TRIGGER BUTTON */}
          <button
            onClick={() => {
              setSurpriseModalOpen(true);
              setSurpriseResult(null);
            }}
            className="group flex items-center gap-3 rounded-3xl border border-readora-gold/40 bg-gradient-to-r from-readora-purple via-readora-royal to-readora-plum p-5 text-readora-cream shadow-magical transition hover:-translate-y-1 hover:shadow-gold"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-readora-gold text-2xl text-readora-purple shadow">
              🎲
            </div>
            <div className="text-left">
              <p className="font-display text-lg font-bold text-readora-gold">Pick My Next Book</p>
              <p className="text-xs text-readora-cream/80">"Surprise Me" smart selector</p>
            </div>
            <span className="text-xl text-readora-gold transition group-hover:translate-x-1">→</span>
          </button>
        </div>

        {/* SEARCH BAR */}
        <form onSubmit={handleSearch} className="mt-8 flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, author, genre, or ISBN across extensive library..."
              className="w-full rounded-full border border-readora-purple/20 bg-white/80 px-6 py-4 text-sm text-readora-brown outline-none transition focus:border-readora-gold focus:ring-2 focus:ring-readora-gold/20 shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setBooks(curatedBooks);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-readora-brown/50 hover:text-readora-purple"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="rounded-full bg-readora-gold px-8 py-4 text-sm font-bold text-readora-purple shadow-gold transition hover:bg-readora-goldLight"
          >
            {loading ? "Searching..." : "Search ✦"}
          </button>
        </form>

        {/* MULTI-FACET FILTER CONTROLS */}
        <div className="mt-8 rounded-3xl border border-readora-purple/10 bg-white/60 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-readora-purple/10 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-readora-purple">
              Discovery Filters
            </span>
            <button
              onClick={() => {
                setSelectedMood("All");
                setSelectedPace("All");
                setSelectedLength("All");
                setSelectedGenre("All");
                setFictionFilter("All");
              }}
              className="text-xs font-semibold text-readora-gold hover:underline"
            >
              Reset Filters
            </button>
          </div>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {/* MOOD FILTER */}
            <div>
              <label className="text-xs font-bold text-readora-brown/70 block mb-1.5">Mood</label>
              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs font-semibold text-readora-purple outline-none"
              >
                <option value="All">All Moods</option>
                {allMoodsList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* PACE FILTER */}
            <div>
              <label className="text-xs font-bold text-readora-brown/70 block mb-1.5">Pacing</label>
              <select
                value={selectedPace}
                onChange={(e) => setSelectedPace(e.target.value)}
                className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs font-semibold text-readora-purple outline-none"
              >
                <option value="All">All Paces</option>
                <option value="Fast">Fast-paced</option>
                <option value="Medium">Medium Pace</option>
                <option value="Slow">Atmospheric & Slow</option>
              </select>
            </div>

            {/* LENGTH FILTER */}
            <div>
              <label className="text-xs font-bold text-readora-brown/70 block mb-1.5">Page Count</label>
              <select
                value={selectedLength}
                onChange={(e) => setSelectedLength(e.target.value)}
                className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs font-semibold text-readora-purple outline-none"
              >
                <option value="All">Any Length</option>
                <option value="<200">&lt; 200 pages (Novella)</option>
                <option value="200-400">200 - 400 pages (Standard)</option>
                <option value="400-600">400 - 600 pages (Substantial)</option>
                <option value="600+">600+ pages (Epic Tome)</option>
              </select>
            </div>

            {/* GENRE FILTER */}
            <div>
              <label className="text-xs font-bold text-readora-brown/70 block mb-1.5">Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs font-semibold text-readora-purple outline-none"
              >
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* FICTION / NONFICTION */}
            <div>
              <label className="text-xs font-bold text-readora-brown/70 block mb-1.5">Category</label>
              <select
                value={fictionFilter}
                onChange={(e) => setFictionFilter(e.target.value)}
                className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs font-semibold text-readora-purple outline-none"
              >
                <option value="All">Fiction & Nonfiction</option>
                <option value="Fiction">Fiction Only</option>
                <option value="Nonfiction">Nonfiction Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* PERSONALIZED RECOMMENDATIONS (IF AUTHENTICATED) */}
        {recommendations.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center gap-2">
              <span className="text-xl text-readora-gold">✦</span>
              <h2 className="font-display text-2xl font-bold text-readora-purple">
                Recommended For You
              </h2>
            </div>
            <p className="mt-1 text-xs text-readora-brown/70">
              Personalized suggestions derived from your reading history, ratings, and favorite
              genres.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recommendations.slice(0, 4).map(({ book, reason, matchPercentage }) => (
                <div
                  key={book._id || book.isbn}
                  onClick={() => setSelectedBook(book)}
                  className="flex cursor-pointer gap-3 rounded-2xl border border-readora-gold/30 bg-white/80 p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-magical"
                >
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="h-24 w-16 rounded-lg object-cover shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="rounded-full bg-readora-gold/20 px-2 py-0.5 text-[10px] font-bold text-readora-purple">
                      {matchPercentage}% Match
                    </span>
                    <h3 className="mt-1 truncate font-display text-sm font-bold text-readora-purple">
                      {book.title}
                    </h3>
                    <p className="truncate text-xs text-readora-brown/70">{book.author}</p>
                    <p className="mt-2 text-[11px] italic text-readora-gold leading-tight line-clamp-2">
                      "{reason}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CATALOG RESULTS GRID */}
        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-readora-purple">
              Catalog Books ({filteredBooks.length})
            </h2>
          </div>

          {filteredBooks.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book._id || book.isbn || book.title}
                  book={book}
                  onSelect={setSelectedBook}
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-3xl border border-readora-purple/10 bg-white/60 p-12 text-center">
              <span className="text-4xl text-readora-gold">✦</span>
              <h3 className="mt-3 font-display text-2xl font-bold text-readora-purple">
                No matching books found
              </h3>
              <p className="mt-2 text-sm text-readora-brown/70">
                Try widening your filters or searching for another author or subject.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* "PICK MY NEXT BOOK" MODAL */}
      {surpriseModalOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-readora-plum/70 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setSurpriseModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-readora-gold/30 bg-readora-cream p-7 shadow-2xl animate-scale-in"
          >
            <button
              onClick={() => setSurpriseModalOpen(false)}
              className="absolute right-4 top-4 text-xl text-readora-brown hover:text-readora-purple"
            >
              ✕
            </button>

            <div className="text-center">
              <span className="text-4xl text-readora-gold">🎲</span>
              <h2 className="mt-2 font-display text-3xl font-bold text-readora-purple">
                Pick My Next Book
              </h2>
              <p className="mt-1 text-xs text-readora-brown/70">
                Tell us your reading vibe and let READORA decide your next journey!
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  What mood are you craving?
                </label>
                <select
                  value={surpriseConfig.mood}
                  onChange={(e) =>
                    setSurpriseConfig((prev) => ({ ...prev, mood: e.target.value }))
                  }
                  className="w-full rounded-xl border border-readora-purple/20 bg-white p-2.5 text-xs font-semibold text-readora-brown outline-none"
                >
                  <option value="Any">Any Mood (Surprise Me completely)</option>
                  {allMoodsList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Preferred Pacing
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Any", "Fast", "Medium", "Slow"].slice(0, 3).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSurpriseConfig((prev) => ({ ...prev, pace: p }))}
                      className={`rounded-xl border py-2 text-xs font-bold transition ${
                        surpriseConfig.pace === p
                          ? "border-readora-purple bg-readora-purple text-readora-cream"
                          : "border-readora-purple/20 bg-white text-readora-brown"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Available Reading Time / Length
                </label>
                <select
                  value={surpriseConfig.length}
                  onChange={(e) =>
                    setSurpriseConfig((prev) => ({ ...prev, length: e.target.value }))
                  }
                  className="w-full rounded-xl border border-readora-purple/20 bg-white p-2.5 text-xs font-semibold text-readora-brown outline-none"
                >
                  <option value="any">Any Length</option>
                  <option value="short">Short (&lt; 250 pages)</option>
                  <option value="medium">Medium (250 - 450 pages)</option>
                  <option value="epic">Epic Tome (450+ pages)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Source from
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSurpriseConfig((prev) => ({ ...prev, source: "all" }))}
                    className={`rounded-xl border py-2 text-xs font-bold transition ${
                      surpriseConfig.source === "all"
                        ? "border-readora-purple bg-readora-purple text-readora-cream"
                        : "border-readora-purple/20 bg-white text-readora-brown"
                    }`}
                  >
                    Entire Readora Catalog
                  </button>
                  <button
                    type="button"
                    onClick={() => setSurpriseConfig((prev) => ({ ...prev, source: "tbr" }))}
                    className={`rounded-xl border py-2 text-xs font-bold transition ${
                      surpriseConfig.source === "tbr"
                        ? "border-readora-purple bg-readora-purple text-readora-cream"
                        : "border-readora-purple/20 bg-white text-readora-brown"
                    }`}
                  >
                    My TBR / Want to Read
                  </button>
                </div>
              </div>
            </div>

            <Button
              className="mt-6 w-full"
              onClick={handleSurpriseMe}
              disabled={shuffling}
            >
              {shuffling ? "Rolling the Literary Dice..." : "Pick My Book ✦"}
            </Button>

            {/* RESULT CARD */}
            {surpriseResult && surpriseResult.book && (
              <div className="mt-5 rounded-2xl border border-readora-gold/40 bg-white p-4 shadow-md animate-scale-in flex gap-4 items-center">
                <img
                  src={surpriseResult.book.cover}
                  alt={surpriseResult.book.title}
                  className="h-28 w-20 rounded-lg object-cover shadow"
                />
                <div className="min-w-0 flex-1">
                  <span className="rounded-full bg-readora-gold/20 px-2 py-0.5 text-[10px] font-bold text-readora-purple">
                    Chosen For You ✦
                  </span>
                  <h3 className="mt-1 font-display text-base font-bold text-readora-purple leading-tight">
                    {surpriseResult.book.title}
                  </h3>
                  <p className="text-xs text-readora-brown/70">{surpriseResult.book.author}</p>
                  <p className="mt-2 text-xs text-readora-brown/85 italic leading-tight">
                    {surpriseResult.matchReason}
                  </p>
                  <button
                    onClick={() => {
                      setSurpriseModalOpen(false);
                      setSelectedBook(surpriseResult.book);
                    }}
                    className="mt-3 text-xs font-bold text-readora-gold underline hover:text-readora-purple"
                  >
                    View Book & Add to Library →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedBook && <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </main>
  );
}

export default Discover;
