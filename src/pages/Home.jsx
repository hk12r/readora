import React, { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import ReadingList from "../components/ReadingList";
import BookCard from "../components/BookCard";
import BookModal from "../components/BookModal";
import { useReadora } from "../context/ReadoraContext";
import { moodCategories, moodBooksMap } from "../data/curatedCatalog";

function Home() {
  const [selectedMood, setSelectedMood] = useState("Comforting");
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedBook, setSelectedBook] = useState(null);
  const [search, setSearch] = useState("");
  const [isMoodOpen, setIsMoodOpen] = useState(false);

  // Books for the currently selected mood from our extensive curated catalog
  const books = moodBooksMap[selectedMood] || [];

  /* Reset visible books whenever mood changes */
  useEffect(() => {
    setVisibleCount(10);
    setSearch("");
  }, [selectedMood]);

  /* =====================================================
     INFINITE SCROLL
  ===================================================== */
  useEffect(() => {
    const handleScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 500;

      if (nearBottom) {
        setVisibleCount((current) => Math.min(current + 4, books.length));
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [books.length]);

  /* =====================================================
     SEARCH
  ===================================================== */
  const filteredBooks = useMemo(() => {
    if (!search.trim()) {
      return books;
    }

    const query = search.toLowerCase();

    return books.filter((b) => {
      const title = b.title || "";
      const author = b.author || "";
      return `${title} ${author}`.toLowerCase().includes(query);
    });
  }, [books, search]);

  const visibleBooks = filteredBooks.slice(0, visibleCount);

  return (
    <main className="overflow-hidden bg-readora-cream">
      {/* =================================================
          HERO
      ================================================= */}
      <section
        className="
          relative
          overflow-hidden
          bg-gradient-to-br
          from-readora-cream
          via-readora-cream
          to-readora-lavenderLight
        "
      >
        <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-readora-lavender/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-readora-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[15%] top-24 text-2xl text-readora-gold animate-twinkle">
          ✦
        </div>
        <div className="pointer-events-none absolute left-[10%] top-40 text-lg text-readora-purple/60 animate-twinkle">
          ✧
        </div>

        <div className="page-container">
          <div
            className="
              grid
              min-h-[calc(100vh-76px)]
              items-center
              gap-10
              py-14
              lg:grid-cols-[1.05fr_0.95fr]
              lg:py-20
            "
          >
            {/* HERO TEXT */}
            <div className="max-w-2xl">
              <div
                className="
                  mb-5
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border border-readora-gold/30
                  bg-readora-cream/70
                  px-4 py-2
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-readora-purple
                  shadow-sm
                "
              >
                <span className="text-readora-gold">✦</span>
                Your reading universe
              </div>

              <h1
                className="
                  font-display
                  text-5xl
                  font-bold
                  leading-[1.05]
                  text-readora-purple
                  sm:text-6xl
                  lg:text-7xl
                "
              >
                Find the story
                <span className="block italic text-readora-gold">
                  that feels like you.
                </span>
              </h1>

              <p
                className="
                  mt-6
                  max-w-xl
                  text-base
                  leading-8
                  text-readora-brown/70
                  sm:text-lg
                "
              >
                READORA is your personal reading universe — a place to
                discover books, follow your reading journey, and find
                stories that match your mood.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() =>
                    document
                      .getElementById("shelf-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Discover a Book ✦
                </Button>

                <Button
                  variant="secondary"
                  onClick={() =>
                    document
                      .getElementById("mood-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Explore by Mood
                </Button>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-5 text-sm text-readora-brown/60">
                <span className="flex items-center gap-2">
                  <span className="text-readora-gold">✦</span>
                  Mood-based discovery
                </span>

                <span className="flex items-center gap-2">
                  <span className="text-readora-gold">✦</span>
                  Personal library
                </span>

                <span className="flex items-center gap-2">
                  <span className="text-readora-gold">✦</span>
                  Reading journey
                </span>
              </div>
            </div>

            {/* HERO LOGO */}
            <div className="relative flex items-center justify-center">
              <div
                className="
                  absolute
                  h-[270px] w-[270px]
                  rounded-full
                  bg-readora-lavender/30
                  blur-3xl
                  sm:h-[380px] sm:w-[380px]
                "
              />

              <div
                className="
                  absolute
                  h-[250px] w-[250px]
                  rounded-full
                  border border-readora-gold/20
                  sm:h-[350px] sm:w-[350px]
                "
              />

              <div
                className="
                  absolute
                  h-[210px] w-[210px]
                  rounded-full
                  border border-readora-purple/10
                  sm:h-[300px] sm:w-[300px]
                "
              />

              <img
                src={`${import.meta.env.BASE_URL}readora-logo.png`}
                alt="Readora"
                className="
                  relative z-10
                  h-auto
                  w-full
                  max-w-[240px]
                  object-contain
                  drop-shadow-2xl
                  animate-float
                  sm:max-w-[280px]
                "
              />
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          MOOD DISCOVERY
      ================================================= */}
      <section
        id="mood-section"
        className="
          relative
          border-y
          border-readora-purple/10
          bg-readora-night
        "
      >
        <div className="page-container py-12 sm:py-16">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-readora-gold">
              Open a new chapter
            </span>

            <h2 className="mt-3 font-display text-3xl font-bold text-readora-cocoa sm:text-4xl">
              What are you in the mood to read?
            </h2>

            <p className="mt-3 text-sm leading-7 text-readora-cocoa/60">
              Tell READORA how you're feeling and we'll open a shelf
              of stories waiting for you.
            </p>
          </div>

          {/* DESKTOP MOOD BUTTONS */}
          <div className="mt-8 hidden flex-wrap gap-3 md:flex">
            {moodCategories.map((mood) => (
              <button
                key={mood}
                onClick={() => setSelectedMood(mood)}
                className={`
                  rounded-full
                  border
                  px-5 py-2.5
                  text-sm
                  font-semibold
                  transition-all duration-300
                  ${
                    selectedMood === mood
                      ? "border-readora-gold bg-readora-gold text-readora-purple shadow-gold"
                      : "border-readora-cream/15 bg-readora-cream/5 text-readora-cocoa/75 hover:border-readora-gold/50 hover:bg-readora-purple/50 hover:text-readora-cocoa"
                  }
                `}
              >
                {mood}
              </button>
            ))}
          </div>

          {/* MOBILE DROPDOWN */}
          <div className="relative mt-8 md:hidden">
            <button
              onClick={() => setIsMoodOpen(!isMoodOpen)}
              className="
                flex w-full
                items-center justify-between
                rounded-2xl
                border border-readora-gold/30
                bg-readora-cream/10
                px-5 py-4
                text-left
                font-semibold
                text-readora-cream
              "
            >
              <span>{selectedMood}</span>
              <span>{isMoodOpen ? "⌃" : "⌄"}</span>
            </button>

            {isMoodOpen && (
              <div
                className="
                  absolute left-0 right-0 top-full z-30 mt-2
                  overflow-hidden
                  rounded-2xl
                  border border-readora-purple/10
                  bg-readora-cream
                  p-2
                  shadow-2xl
                "
              >
                {moodCategories.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => {
                      setSelectedMood(mood);
                      setIsMoodOpen(false);
                    }}
                    className="
                      w-full
                      rounded-xl
                      px-4 py-3
                      text-left
                      text-sm
                      font-semibold
                      text-readora-brown
                      transition
                      hover:bg-readora-lavenderLight
                      hover:text-readora-purple
                    "
                  >
                    {mood}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =================================================
          BOOK DISCOVERY / SHELF
      ================================================= */}
      <section id="shelf-section" className="bg-readora-cream">
        <div className="page-container py-14 sm:py-18">
          {/* SECTION HEADER */}
          <div
            className="
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-end
              lg:justify-between
            "
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-readora-gold">
                Your current shelf
              </span>

              <h2 className="mt-2 font-display text-3xl font-bold text-readora-purple sm:text-4xl">
                {selectedMood} reads
              </h2>

              <p className="mt-2 text-sm text-readora-brown/60">
                Stories chosen for your current mood with full blurbs and details.
              </p>
            </div>

            {/* SEARCH */}
            <div className="relative w-full lg:max-w-xs">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search this shelf..."
                className="
                  w-full
                  rounded-full
                  border border-readora-purple/15
                  bg-white/70
                  px-5 py-3
                  text-sm
                  text-readora-brown
                  outline-none
                  placeholder:text-readora-brown/40
                  transition
                  focus:border-readora-gold
                  focus:ring-2
                  focus:ring-readora-gold/20
                "
              />
            </div>
          </div>

          {/* BOOK GRID */}
          {visibleBooks.length > 0 ? (
            <div
              className="
                mt-9
                grid
                grid-cols-2
                gap-4
                sm:grid-cols-3
                md:grid-cols-4
                lg:grid-cols-5
                xl:grid-cols-6
              "
            >
              {visibleBooks.map((book) => (
                <BookCard
                  key={`${selectedMood}-${book.title}`}
                  book={book}
                  onSelect={setSelectedBook}
                />
              ))}
            </div>
          ) : (
            <div
              className="
                mt-10
                rounded-3xl
                border border-readora-purple/10
                bg-white/50
                px-6 py-16
                text-center
              "
            >
              <span className="text-4xl text-readora-gold">✦</span>
              <h3 className="mt-4 font-display text-2xl font-bold text-readora-purple">
                No stories found
              </h3>
              <p className="mt-2 text-sm text-readora-brown/60">
                Try another title or author.
              </p>
            </div>
          )}

          {/* INFINITE SCROLL STATUS */}
          <div className="mt-12 text-center">
            {visibleCount < filteredBooks.length ? (
              <div className="inline-flex items-center gap-3 text-sm text-readora-brown/50">
                <span className="h-2 w-2 animate-pulse rounded-full bg-readora-gold" />
                Keep scrolling to discover more...
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 text-sm text-readora-brown/50">
                <span className="text-readora-gold">✦</span>
                You've reached the end of this shelf.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =================================================
          GLOBAL STATE OUTPUT — READING LIST PREVIEW
      ================================================= */}
      <section className="bg-readora-lavenderLight/30">
        <div className="page-container py-14 sm:py-18">
          <ReadingList />
        </div>
      </section>

      {/* =================================================
          READING PHILOSOPHY
      ================================================= */}
      <section className="relative overflow-hidden bg-readora-royal">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-10 top-10 text-2xl text-readora-gold">✦</div>
          <div className="absolute right-20 top-24 text-xl text-readora-gold">✧</div>
          <div className="absolute bottom-20 left-1/4 text-lg text-readora-gold">✦</div>
        </div>

        <div className="page-container py-16 text-center sm:py-20">
          <span className="text-4xl text-readora-gold">☾</span>

          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-bold text-readora-cream sm:text-4xl">
            Every reader has a story of their own.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-readora-cream/60">
            READORA is designed to make reading feel personal again —
            from the first page you discover to the last chapter you
            remember.
          </p>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={() =>
                document
                  .getElementById("shelf-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Begin Your Reading Journey ✦
            </Button>
          </div>
        </div>
      </section>

      {/* =================================================
          BOOK MODAL
      ================================================= */}
      {selectedBook && (
        <BookModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </main>
  );
}

export default Home;
