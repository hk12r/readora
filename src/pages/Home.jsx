import React, { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";

/* =========================================================
   READORA MOODS
========================================================= */

const moods = [
  "Comforting",
  "Mysterious",
  "Emotional",
  "Fast-paced",
  "Romantic",
  "Thought-provoking",
  "Magical",
  "Something new",
];

/* =========================================================
   BOOK DATA
   Every mood has 10+ books.
========================================================= */

const moodBooks = {
  Comforting: [
    ["The House in the Cerulean Sea", "TJ Klune", "9781250217288"],
    ["Anne of Green Gables", "L. M. Montgomery", "9780553213133"],
    ["Little Women", "Louisa May Alcott", "9780147514011"],
    ["The Secret Garden", "Frances Hodgson Burnett", "9780064401883"],
    ["A Man Called Ove", "Fredrik Backman", "9781476738017"],
    ["The Guernsey Literary and Potato Peel Pie Society", "Mary Ann Shaffer", "9780385341004"],
    ["The Very Secret Society of Irregular Witches", "Sangu Mandanna", "9781250244437"],
    ["Legends & Lattes", "Travis Baldree", "9781250886088"],
    ["The Little Prince", "Antoine de Saint-Exupéry", "9780156012195"],
    ["The Wind in the Willows", "Kenneth Grahame", "9780143039099"],
    ["The Bookshop on the Corner", "Jenny Colgan", "9780062663009"],
    ["Howl's Moving Castle", "Diana Wynne Jones", "9780061478789"],
  ],

  Mysterious: [
    ["The Silent Patient", "Alex Michaelides", "9781250301697"],
    ["Gone Girl", "Gillian Flynn", "9780553418361"],
    ["The Guest List", "Lucy Foley", "9780062868930"],
    ["And Then There Were None", "Agatha Christie", "9780062073484"],
    ["The Woman in the Window", "A. J. Finn", "9780062678416"],
    ["The Maid", "Nita Prose", "9780593396560"],
    ["The Paris Apartment", "Lucy Foley", "9780063003057"],
    ["Big Little Lies", "Liane Moriarty", "9780425274866"],
    ["Rebecca", "Daphne du Maurier", "9780380730407"],
    ["The Girl on the Train", "Paula Hawkins", "9781594634024"],
    ["The 7½ Deaths of Evelyn Hardcastle", "Stuart Turton", "9781492657965"],
    ["The Hunting Party", "Lucy Foley", "9780062868916"],
  ],

  Emotional: [
    ["The Kite Runner", "Khaled Hosseini", "9781594631931"],
    ["A Thousand Splendid Suns", "Khaled Hosseini", "9781594489501"],
    ["Me Before You", "Jojo Moyes", "9780143124542"],
    ["The Fault in Our Stars", "John Green", "9780525428028"],
    ["The Book Thief", "Markus Zusak", "9780375842207"],
    ["It Ends with Us", "Colleen Hoover", "9781501110368"],
    ["The Song of Achilles", "Madeline Miller", "9780062060624"],
    ["Normal People", "Sally Rooney", "9781984822178"],
    ["A Little Life", "Hanya Yanagihara", "9780804172707"],
    ["The Midnight Library", "Matt Haig", "9780525559474"],
    ["The Great Alone", "Kristin Hannah", "9781501171345"],
    ["Before the Coffee Gets Cold", "Toshikazu Kawaguchi", "9781335005586"],
  ],

  "Fast-paced": [
    ["The Hunger Games", "Suzanne Collins", "9780439023481"],
    ["Divergent", "Veronica Roth", "9780062024039"],
    ["Six of Crows", "Leigh Bardugo", "9781250076960"],
    ["The Maze Runner", "James Dashner", "9780385737944"],
    ["Red Rising", "Pierce Brown", "9780345539786"],
    ["The Martian", "Andy Weir", "9780804139021"],
    ["Dark Matter", "Blake Crouch", "9781101904220"],
    ["Project Hail Mary", "Andy Weir", "9780593135204"],
    ["Ready Player One", "Ernest Cline", "9780307887443"],
    ["Jurassic Park", "Michael Crichton", "9780345538987"],
    ["The Da Vinci Code", "Dan Brown", "9780307474278"],
    ["The Running Man", "Stephen King", "9781501143519"],
  ],

  Romantic: [
    ["Pride and Prejudice", "Jane Austen", "9780141439518"],
    ["The Love Hypothesis", "Ali Hazelwood", "9780593336823"],
    ["Book Lovers", "Emily Henry", "9780593334836"],
    ["Beach Read", "Emily Henry", "9781984806734"],
    ["People We Meet on Vacation", "Emily Henry", "9781984806758"],
    ["Red, White & Royal Blue", "Casey McQuiston", "9781250316776"],
    ["The Spanish Love Deception", "Elena Armas", "9781668002522"],
    ["The Kiss Quotient", "Helen Hoang", "9780451490803"],
    ["The Flatshare", "Beth O'Leary", "9781250295637"],
    ["One Day", "David Nicholls", "9780340896983"],
    ["Love and Other Words", "Christina Lauren", "9781501128035"],
    ["Every Summer After", "Carley Fortune", "9780593396561"],
  ],

  "Thought-provoking": [
    ["1984", "George Orwell", "9780451524935"],
    ["Brave New World", "Aldous Huxley", "9780060850524"],
    ["Sapiens", "Yuval Noah Harari", "9780062316097"],
    ["The Alchemist", "Paulo Coelho", "9780062315007"],
    ["The Midnight Library", "Matt Haig", "9780525559474"],
    ["Man's Search for Meaning", "Viktor E. Frankl", "9780807014295"],
    ["The Little Prince", "Antoine de Saint-Exupéry", "9780156012195"],
    ["The Stranger", "Albert Camus", "9780679720201"],
    ["Educated", "Tara Westover", "9780399590504"],
    ["Atomic Habits", "James Clear", "9780735211292"],
    ["The Four Agreements", "Don Miguel Ruiz", "9781878424310"],
    ["Ikigai", "Héctor García", "9780143130727"],
  ],

  Magical: [
    ["Harry Potter and the Sorcerer's Stone", "J. K. Rowling", "9780590353427"],
    ["The Night Circus", "Erin Morgenstern", "9780307744432"],
    ["The Starless Sea", "Erin Morgenstern", "9781101972120"],
    ["Circe", "Madeline Miller", "9780316556347"],
    ["The Priory of the Orange Tree", "Samantha Shannon", "9781635570298"],
    ["A Court of Thorns and Roses", "Sarah J. Maas", "9781635575569"],
    ["The Name of the Wind", "Patrick Rothfuss", "9780756404741"],
    ["Stardust", "Neil Gaiman", "9780061689246"],
    ["The Once and Future Witches", "Alix E. Harrow", "9780316422048"],
    ["The Invisible Life of Addie LaRue", "V. E. Schwab", "9780765387561"],
    ["The Hobbit", "J. R. R. Tolkien", "9780547928227"],
    ["A Wizard of Earthsea", "Ursula K. Le Guin", "9780547773742"],
  ],

  "Something new": [
    ["Tomorrow, and Tomorrow, and Tomorrow", "Gabrielle Zevin", "9780593321201"],
    ["Yellowface", "R. F. Kuang", "9780063250833"],
    ["The Seven Husbands of Evelyn Hugo", "Taylor Jenkins Reid", "9781501161933"],
    ["Daisy Jones & The Six", "Taylor Jenkins Reid", "9781524798642"],
    ["Lessons in Chemistry", "Bonnie Garmus", "9780385547345"],
    ["Remarkably Bright Creatures", "Shelby Van Pelt", "9780063204157"],
    ["The Housemaid", "Freida McFadden", "9781538742570"],
    ["Fourth Wing", "Rebecca Yarros", "9781649374042"],
    ["Yellowface", "R. F. Kuang", "9780063250833"],
    ["The Measure", "Nikki Erlick", "9780593192054"],
    ["The Wishing Game", "Meg Shaffer", "9780593598191"],
    ["The Authenticity Project", "Clare Pooley", "9780593083889"],
  ],
};

/* =========================================================
   REUSABLE BOOK CARD
========================================================= */

function BookCard({ book, onSelect }) {
  const [imageError, setImageError] = useState(false);

  const [title, author, isbn] = book;

  const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;

  return (
    <article
      onClick={() => onSelect(book)}
      className="
        group cursor-pointer
        overflow-hidden
        rounded-2xl
        border border-readora-purple/10
        bg-readora-cream
        shadow-card
        transition-all duration-300
        hover:-translate-y-2
        hover:border-readora-gold/40
        hover:shadow-magical
      "
    >
      <div
        className="
          relative aspect-[2/3]
          overflow-hidden
          bg-gradient-to-br
          from-readora-lavenderLight
          via-readora-cream
          to-readora-gold/10
        "
      >
        {!imageError ? (
          <img
            src={coverUrl}
            alt={`${title} book cover`}
            className="
              h-full w-full
              object-cover
              transition-transform duration-500
              group-hover:scale-105
            "
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className="
              flex h-full w-full
              flex-col items-center justify-center
              p-5 text-center
              bg-gradient-to-br
              from-readora-purple
              to-readora-plum
            "
          >
            <span className="mb-4 text-3xl text-readora-gold">
              ✦
            </span>

            <h3 className="font-display text-lg font-bold text-readora-cream">
              {title}
            </h3>

            <p className="mt-2 text-xs text-readora-cream/70">
              {author}
            </p>
          </div>
        )}

        <div
          className="
            absolute inset-x-0 bottom-0
            h-20
            bg-gradient-to-t
            from-black/40
            to-transparent
            opacity-0
            transition-opacity duration-300
            group-hover:opacity-100
          "
        />
      </div>

      <div className="p-4">
        <h3
          className="
            line-clamp-2
            font-display
            text-base
            font-bold
            leading-tight
            text-readora-brown
            transition-colors
            group-hover:text-readora-purple
          "
        >
          {title}
        </h3>

        <p className="mt-2 line-clamp-1 text-sm text-readora-brown/60">
          {author}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-readora-gold">
            Discover
          </span>

          <span
            className="
              text-readora-purple
              transition-transform duration-300
              group-hover:translate-x-1
            "
          >
            →
          </span>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   BOOK MODAL
========================================================= */

function BookModal({ book, onClose }) {
  if (!book) return null;

  const [title, author, isbn] = book;

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-readora-brown/50
        p-4
        backdrop-blur-sm
        animate-fade-in
      "
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="
          relative
          w-full max-w-lg
          overflow-hidden
          rounded-3xl
          border border-readora-gold/20
          bg-readora-cream
          shadow-2xl
          animate-scale-in
        "
      >
        <button
          onClick={onClose}
          className="
            absolute right-4 top-4 z-10
            flex h-9 w-9
            items-center justify-center
            rounded-full
            bg-readora-cream/90
            text-xl
            text-readora-brown
            shadow
            transition
            hover:bg-readora-gold
            hover:text-readora-purple
          "
          aria-label="Close book details"
        >
          ×
        </button>

        <div className="grid sm:grid-cols-[170px_1fr]">
          <div className="aspect-[2/3] sm:aspect-auto">
            <img
              src={`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`}
              alt={title}
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </div>

          <div className="flex flex-col justify-center p-7">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-readora-gold">
              A READORA discovery
            </span>

            <h2 className="mt-3 font-display text-3xl font-bold text-readora-purple">
              {title}
            </h2>

            <p className="mt-3 text-readora-brown/70">
              by {author}
            </p>

            <div className="my-6 h-px bg-readora-purple/10" />

            <p className="text-sm leading-7 text-readora-brown/70">
              Every story opens a different door. Add this book to your
              reading journey and discover where its pages take you.
            </p>

            <Button className="mt-6 w-full">
              Add to My Library ✦
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   HOME PAGE
========================================================= */

function Home() {
  const [selectedMood, setSelectedMood] = useState("Comforting");
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedBook, setSelectedBook] = useState(null);
  const [search, setSearch] = useState("");
  const [isMoodOpen, setIsMoodOpen] = useState(false);

  const books = moodBooks[selectedMood];

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
        setVisibleCount((current) =>
          Math.min(current + 4, books.length)
        );
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

    return books.filter(([title, author]) =>
      `${title} ${author}`.toLowerCase().includes(query)
    );
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
        {/* Decorative celestial elements */}

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
                <Button>
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
                src="/readora-logo.png"
                alt="READORA magical hourglass logo"
                className="
                  relative z-10
                  h-auto
                  w-full
                  max-w-[300px]
                  object-contain
                  drop-shadow-2xl
                  animate-float
                  sm:max-w-[340px]
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
            {moods.map((mood) => (
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
                {moods.map((mood) => (
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
          BOOK DISCOVERY
      ================================================= */}

      <section className="bg-readora-cream">
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
                Stories chosen for your current mood.
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
              {visibleBooks.map((book, index) => (
                <BookCard
                  key={`${selectedMood}-${book[0]}-${index}`}
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
          READING PHILOSOPHY
      ================================================= */}

      <section className="relative overflow-hidden bg-readora-royal">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-10 top-10 text-2xl text-readora-gold">
            ✦
          </div>
          <div className="absolute right-20 top-24 text-xl text-readora-gold">
            ✧
          </div>
          <div className="absolute bottom-20 left-1/4 text-lg text-readora-gold">
            ✦
          </div>
        </div>

        <div className="page-container py-16 text-center sm:py-20">
          <span className="text-4xl text-readora-gold">
            ☾
          </span>

          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-bold text-readora-cream sm:text-4xl">
            Every reader has a story of their own.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-readora-cream/60">
            READORA is designed to make reading feel personal again —
            from the first page you discover to the last chapter you
            remember.
          </p>

          <div className="mt-8 flex justify-center">
            <Button>
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