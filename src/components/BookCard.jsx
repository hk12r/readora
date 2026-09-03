import React, { useState } from "react";
import { useReadora } from "../context/ReadoraContext";

function BookCard({ book, onView }) {
  const [imageError, setImageError] = useState(false);
  const { library, addToShelf, removeFromShelf } = useReadora();

  /* =========================================================
     SUPPORT BOTH OLD ARRAY DATA AND NEW OBJECT DATA
  ========================================================= */

  const isArrayBook = Array.isArray(book);

  const title = isArrayBook ? book[0] : book.title;
  const author = isArrayBook ? book[1] : book.author;
  const isbn = isArrayBook ? book[2] : book.isbn;

  const genre = isArrayBook ? "Book" : book.genre;
  const rating = isArrayBook ? null : book.rating;
  const pages = isArrayBook ? null : book.pages;

  const isAdded = library.entries.some(
    (entry) => entry.isbn === isbn
  );

  const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;

  /* =========================================================
     ADD / REMOVE GLOBAL STATE
  ========================================================= */

  const handleLibraryAction = () => {
    if (isAdded) {
      removeFromShelf(isbn);
    } else {
      addToShelf({
        title,
        author,
        isbn,
        genre,
        rating,
        pages,
      });
    }
  };

  return (
    <article
      className="
        book-card group flex h-full flex-col overflow-hidden
        rounded-3xl border border-readora-purple/10
        bg-white/75 p-3 shadow-magical
        transition-all duration-300
        hover:-translate-y-2
        hover:border-readora-gold/50
        hover:shadow-gold
      "
    >
      {/* =====================================================
          BOOK COVER
      ===================================================== */}

      <div
        className="
          relative aspect-[2/3] overflow-hidden rounded-2xl
          bg-gradient-to-br from-readora-purple
          via-readora-royal to-readora-plum
        "
      >
        {!imageError ? (
          <img
            src={coverUrl}
            alt={`${title} cover`}
            className="
              book-cover h-full w-full object-cover
              transition duration-500
              group-hover:scale-105
            "
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className="
              flex h-full w-full flex-col
              items-center justify-center
              bg-gradient-to-br
              from-readora-purple to-readora-plum
              p-5 text-center text-readora-cream
            "
          >
            <div className="mb-4 text-4xl">✦</div>

            <p className="font-display text-xl font-bold">
              {title}
            </p>

            <p className="mt-2 text-sm text-readora-lavender">
              {author}
            </p>
          </div>
        )}

        {/* Rating — only if available */}
        {rating && (
          <div
            className="
              absolute left-3 top-3
              rounded-full bg-readora-cream/95
              px-3 py-1 text-xs font-bold
              text-readora-purple shadow
            "
          >
            ★ {rating}
          </div>
        )}
      </div>

      {/* =====================================================
          BOOK INFORMATION
      ===================================================== */}

      <div className="flex flex-1 flex-col px-1 pb-1 pt-4">

        <span
          className="
            mb-2 w-fit rounded-full
            bg-readora-lavenderLight
            px-3 py-1 text-[11px]
            font-bold uppercase tracking-wider
            text-readora-purple
          "
        >
          {genre}
        </span>

        <h3
          className="
            font-display text-lg font-bold
            leading-tight text-readora-purple
          "
        >
          {title}
        </h3>

        <p className="mt-1 text-sm text-readora-brown/80">
          {author}
        </p>

        {/* ===================================================
            BOTTOM ACTIONS
        =================================================== */}

        <div className="mt-auto flex flex-col gap-2 pt-4">

          <div className="flex items-center justify-between">

            {pages ? (
              <span className="text-xs text-readora-brown/60">
                {pages} pages
              </span>
            ) : (
              <span className="text-xs text-readora-brown/60">
                ISBN: {isbn}
              </span>
            )}

            <button
              onClick={() => onView(book)}
              className="
                rounded-full
                border border-readora-purple/15
                px-3 py-2 text-xs font-bold
                text-readora-purple
                transition
                hover:border-readora-gold
                hover:bg-readora-gold
              "
            >
              View
            </button>

          </div>

          {/* =================================================
              GLOBAL STATE BUTTON
          ================================================= */}

          <button
            onClick={handleLibraryAction}
            className={`
              w-full rounded-full px-4 py-2.5
              text-sm font-bold transition-all duration-200
              ${
                isAdded
                  ? "border border-readora-purple bg-readora-purple text-readora-cream"
                  : "bg-readora-gold text-readora-purple hover:scale-[1.02] hover:shadow-gold"
              }
            `}
          >
            {isAdded
              ? "✓ Added to Reading List"
              : "+ Add to Reading List"}
          </button>

        </div>
      </div>
    </article>
  );
}

export default BookCard;
