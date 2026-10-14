import React, { useState } from "react";
import { useReadora } from "../context/ReadoraContext";

function BookCard({ book, onSelect, onView }) {
  const [imageError, setImageError] = useState(false);
  const [shelfDropdownOpen, setShelfDropdownOpen] = useState(false);
  const { library, addToShelf, removeFromShelf, updateShelf, auth } = useReadora();

  // Normalize book whether it's an array [title, author, isbn] or an object
  const isArray = Array.isArray(book);
  const title = isArray ? book[0] : book.title;
  const author = isArray ? book[1] : book.author;
  const isbn = isArray ? book[2] : book.isbn;
  const genre = isArray ? (book[3] || "Fiction") : (book.genre || "Fiction");
  const rating = isArray ? 4.3 : (book.rating || 4.2);
  const pages = isArray ? null : book.pages;
  const coverUrl =
    (!isArray && book.cover)
      ? book.cover
      : isbn
      ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
      : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600";

  // Check if book is already in library
  const existingEntry = library.entries.find(
    (entry) =>
      entry.isbn === isbn ||
      entry.bookId?.isbn === isbn ||
      (entry.bookId?.title && entry.bookId.title.toLowerCase() === title.toLowerCase())
  );

  const isAdded = !!existingEntry;
  const currentShelf = existingEntry?.shelf || "Want to Read";

  const handleCardClick = () => {
    if (onSelect) onSelect(book);
    else if (onView) onView(book);
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (isAdded) {
      removeFromShelf(existingEntry._id || isbn);
    } else {
      addToShelf({
        title,
        author,
        isbn,
        genre,
        rating,
        pages: pages || 320,
        cover: coverUrl,
        blurb: !isArray ? book.blurb : undefined,
      });
    }
  };

  const handleShelfChange = (e, newShelf) => {
    e.stopPropagation();
    setShelfDropdownOpen(false);
    if (!existingEntry) {
      addToShelf(
        {
          title,
          author,
          isbn,
          genre,
          rating,
          pages: pages || 320,
          cover: coverUrl,
          blurb: !isArray ? book.blurb : undefined,
        },
        newShelf
      );
    } else {
      updateShelf(existingEntry._id, newShelf);
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className="
        group relative cursor-pointer
        overflow-hidden
        rounded-2xl
        border border-readora-purple/10
        bg-readora-cream
        shadow-card
        transition-all duration-300
        hover:-translate-y-2
        hover:border-readora-gold/40
        hover:shadow-magical
        flex flex-col justify-between
      "
    >
      <div>
        {/* COVER IMAGE CONTAINER */}
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
              <span className="mb-4 text-3xl text-readora-gold">✦</span>
              <h3 className="font-display text-base font-bold text-readora-cream leading-tight">
                {title}
              </h3>
              <p className="mt-2 text-xs text-readora-cream/70 line-clamp-1">{author}</p>
            </div>
          )}

          {/* Rating Badge */}
          {rating && (
            <div className="absolute top-2.5 left-2.5 rounded-full bg-readora-cream/95 px-2.5 py-0.5 text-[11px] font-bold text-readora-purple shadow backdrop-blur-sm">
              ★ {rating}
            </div>
          )}

          {/* Hover Overlay */}
          <div
            className="
              absolute inset-x-0 bottom-0
              h-20
              bg-gradient-to-t
              from-black/50
              to-transparent
              opacity-0
              transition-opacity duration-300
              group-hover:opacity-100
            "
          />
        </div>

        {/* BOOK METADATA */}
        <div className="p-3.5 pb-2">
          <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-readora-gold">
            <span className="truncate">{genre}</span>
            {pages && <span className="text-readora-brown/50">{pages}p</span>}
          </div>

          <h3
            className="
              mt-1
              line-clamp-2
              font-display
              text-sm
              font-bold
              leading-snug
              text-readora-brown
              transition-colors
              group-hover:text-readora-purple
            "
          >
            {title}
          </h3>

          <p className="mt-1 line-clamp-1 text-xs text-readora-brown/65">{author}</p>
        </div>
      </div>

      {/* CARD ACTION BUTTONS */}
      <div className="p-3.5 pt-0">
        <div className="relative">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleQuickAdd}
              className={`
                flex-1
                rounded-full
                px-3 py-2
                text-xs
                font-bold
                transition-all duration-200
                ${
                  isAdded
                    ? "border border-readora-purple bg-readora-purple text-readora-cream"
                    : "bg-readora-gold text-readora-purple hover:shadow-gold hover:bg-readora-goldLight"
                }
              `}
            >
              {isAdded ? `✓ ${currentShelf}` : "+ Add to Shelf"}
            </button>

            {/* Shelf Select Dropdown Trigger */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShelfDropdownOpen(!shelfDropdownOpen);
              }}
              title="Change reading shelf"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-readora-purple/15 bg-white/70 text-xs font-bold text-readora-purple hover:border-readora-gold hover:bg-readora-gold"
            >
              ▾
            </button>
          </div>

          {/* Shelf Options Menu */}
          {shelfDropdownOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-2xl border border-readora-gold/30 bg-readora-cream p-1.5 shadow-2xl animate-scale-in"
            >
              {["Want to Read", "Currently Reading", "Read", "DNF"].map((shelfName) => (
                <button
                  key={shelfName}
                  onClick={(e) => handleShelfChange(e, shelfName)}
                  className={`
                    w-full rounded-xl px-3 py-1.5 text-left text-xs font-semibold transition
                    ${
                      currentShelf === shelfName && isAdded
                        ? "bg-readora-purple text-readora-cream"
                        : "text-readora-brown hover:bg-readora-lavenderLight hover:text-readora-purple"
                    }
                  `}
                >
                  {shelfName}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default BookCard;
