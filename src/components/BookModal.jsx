import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReadora } from "../context/ReadoraContext";

function BookModal({ book, onClose }) {
  const { library, addToShelf, removeFromShelf, updateShelf, toggleFavorite, toggleUpNext, auth } =
    useReadora();
  const navigate = useNavigate();

  if (!book) return null;

  // Support array or object data
  const isArray = Array.isArray(book);
  const title = isArray ? book[0] : book.title;
  const author = isArray ? book[1] : book.author;
  const isbn = isArray ? book[2] : book.isbn;
  const genre = !isArray && book.genre ? book.genre : "Fiction";
  const rating = !isArray && book.rating ? book.rating : 4.4;
  const pages = !isArray && book.pages ? book.pages : 340;
  const blurb =
    !isArray && book.blurb
      ? book.blurb
      : "Every story opens a different door. Add this book to your reading journey, track your pace, and discover where its pages take you.";
  const country = !isArray && book.country ? book.country : "International";
  const pace = !isArray && book.pace ? book.pace : "Medium";
  const publicationYear = !isArray && book.publicationYear ? book.publicationYear : 2020;
  const moods = !isArray && book.moods ? book.moods : ["Comforting", "Thought-provoking"];

  const coverUrl =
    !isArray && book.cover
      ? book.cover
      : isbn
      ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
      : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600";

  const existingEntry = library.entries.find(
    (e) =>
      e.isbn === isbn ||
      e.bookId?.isbn === isbn ||
      (e.bookId?.title && e.bookId.title.toLowerCase() === title.toLowerCase())
  );

  const isAdded = !!existingEntry;
  const currentShelf = existingEntry?.shelf || "Want to Read";

  const handleShelfChange = (newShelf) => {
    if (!existingEntry) {
      addToShelf(
        {
          title,
          author,
          isbn,
          genre,
          rating,
          pages,
          cover: coverUrl,
          blurb,
          country,
          pace,
          publicationYear,
          moods,
        },
        newShelf
      );
    } else {
      updateShelf(existingEntry._id, newShelf);
    }
  };

  const handleToggleRemove = () => {
    if (existingEntry) {
      removeFromShelf(existingEntry._id || isbn);
    }
  };

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-readora-plum/75 p-4
        backdrop-blur-sm
        animate-fade-in
      "
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          relative w-full max-w-2xl
          overflow-hidden rounded-3xl
          border border-readora-gold/30
          bg-readora-cream shadow-2xl
          animate-scale-in max-h-[92vh] overflow-y-auto
        "
      >
        <button
          onClick={onClose}
          className="
            absolute right-4 top-4 z-20
            flex h-9 w-9 items-center justify-center
            rounded-full bg-readora-cream/90
            text-xl text-readora-brown shadow
            transition hover:bg-readora-gold hover:text-readora-purple
          "
        >
          ×
        </button>

        <div className="grid md:grid-cols-[220px_1fr]">
          {/* COVER & QUICK DETAILS */}
          <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-readora-purple via-readora-royal to-readora-plum p-6 text-center text-readora-cream">
            <img
              src={coverUrl}
              alt={title}
              className="aspect-[2/3] w-36 rounded-xl object-cover shadow-2xl transition hover:scale-105 duration-300"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-readora-gold">
                ★ {rating}
              </span>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-readora-cream">
                {pages} pages
              </span>
            </div>
            <p className="mt-2 text-[11px] text-readora-cream/70">
              {country} • {publicationYear}
            </p>
          </div>

          {/* MAIN INFO & ACTIONS */}
          <div className="flex flex-col p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-readora-lavenderLight px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-readora-purple">
                {genre}
              </span>
              <span className="rounded-full bg-readora-gold/20 px-2.5 py-0.5 text-[11px] font-semibold text-readora-brown">
                {pace} Pace
              </span>
            </div>

            <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-readora-purple sm:text-3xl">
              {title}
            </h2>

            <p className="mt-1 font-semibold text-sm text-readora-brown/80">by {author}</p>

            {/* MOOD TAGS */}
            {moods.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {moods.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-readora-purple/15 bg-white/50 px-2 py-0.5 text-[10px] font-bold text-readora-purple"
                  >
                    ✦ {m}
                  </span>
                ))}
              </div>
            )}

            <div className="my-4 h-px bg-readora-purple/10" />

            {/* BLURB / SYNOPSIS */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-readora-gold">
                About this story
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-readora-brown/85 max-h-36 overflow-y-auto">
                {blurb}
              </p>
            </div>

            {/* SHELF SELECTION BUTTONS */}
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-readora-purple">
                Reading Status
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { name: "Want to Read", icon: "📌" },
                  { name: "Currently Reading", icon: "📖" },
                  { name: "Read", icon: "✓" },
                  { name: "DNF", icon: "🛑" },
                ].map((s) => (
                  <button
                    key={s.name}
                    onClick={() => handleShelfChange(s.name)}
                    className={`
                      flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition
                      ${
                        isAdded && currentShelf === s.name
                          ? "border-readora-purple bg-readora-purple text-readora-cream shadow-sm"
                          : "border-readora-purple/20 bg-white/70 text-readora-brown hover:border-readora-gold hover:bg-readora-lavenderLight"
                      }
                    `}
                  >
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* SECONDARY ACTIONS: FAVORITE, QUEUE, JOURNAL */}
            {isAdded && (
              <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-readora-purple/10">
                <button
                  onClick={() => toggleFavorite(existingEntry._id)}
                  className={`
                    rounded-full border px-3 py-1 text-xs font-bold transition
                    ${
                      existingEntry.isFavorite
                        ? "border-red-300 bg-red-50 text-red-600"
                        : "border-readora-purple/20 bg-white/60 text-readora-brown hover:bg-white"
                    }
                  `}
                >
                  {existingEntry.isFavorite ? "❤️ Favorited" : "🤍 Add to Favorites"}
                </button>

                <button
                  onClick={() => toggleUpNext(existingEntry._id)}
                  className={`
                    rounded-full border px-3 py-1 text-xs font-bold transition
                    ${
                      existingEntry.isUpNext
                        ? "border-readora-gold bg-readora-gold text-readora-purple"
                        : "border-readora-purple/20 bg-white/60 text-readora-brown hover:bg-white"
                    }
                  `}
                >
                  {existingEntry.isUpNext ? "⚡ Up Next in Queue" : "+ Add to Up Next"}
                </button>

                <button
                  onClick={handleToggleRemove}
                  className="ml-auto text-xs font-semibold text-red-500 hover:underline"
                >
                  Remove from library
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookModal;