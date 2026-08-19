import React, { useState } from "react";

function BookCard({ book, onView }) {
  const [imageError, setImageError] = useState(false);

  const coverUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`;

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
      <div
        className="
          relative aspect-[2/3] overflow-hidden
          rounded-2xl bg-gradient-to-br
          from-readora-purple
          via-readora-royal
          to-readora-plum
        "
      >
        {!imageError ? (
          <img
            src={coverUrl}
            alt={`${book.title} cover`}
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
              from-readora-purple
              to-readora-plum
              p-5 text-center text-readora-cream
            "
          >
            <div className="mb-4 text-4xl">✦</div>

            <p className="font-display text-xl font-bold">
              {book.title}
            </p>

            <p className="mt-2 text-sm text-readora-lavender">
              {book.author}
            </p>
          </div>
        )}

        <div
          className="
            absolute left-3 top-3 rounded-full
            bg-readora-cream/95 px-3 py-1
            text-xs font-bold text-readora-purple
            shadow
          "
        >
          ★ {book.rating}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
        <span
          className="
            mb-2 w-fit rounded-full
            bg-readora-lavenderLight px-3 py-1
            text-[11px] font-bold uppercase
            tracking-wider text-readora-purple
          "
        >
          {book.genre}
        </span>

        <h3
          className="
            font-display text-lg font-bold
            leading-tight text-readora-purple
          "
        >
          {book.title}
        </h3>

        <p className="mt-1 text-sm text-readora-brown/80">
          {book.author}
        </p>

        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-xs text-readora-brown/60">
            {book.pages} pages
          </span>

          <button
            onClick={() => onView(book)}
            className="
              rounded-full border border-readora-purple/15
              px-3 py-2 text-xs font-bold
              text-readora-purple
              transition hover:border-readora-gold
              hover:bg-readora-gold
            "
          >
            View
          </button>
        </div>
      </div>
    </article>
  );
}

export default BookCard;