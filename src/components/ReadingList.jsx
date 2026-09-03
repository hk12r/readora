import React from "react";
import { useReadora } from "../context/ReadoraContext";

function ReadingList() {
  const { library, removeFromShelf } = useReadora();

  const books = library.entries;

  return (
    <section className="mt-12 rounded-3xl border border-readora-purple/10 bg-readora-cream/80 p-6 shadow-magical">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6 flex items-center justify-between gap-4">

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-readora-gold">
            Global State
          </p>

          <h2 className="mt-1 font-display text-2xl font-bold text-readora-purple">
            My Reading List
          </h2>
        </div>

        {/* LIVE COUNT */}
        <div className="rounded-full bg-readora-purple px-4 py-2 text-sm font-bold text-readora-cream">
          {books.length} {books.length === 1 ? "Book" : "Books"}
        </div>

      </div>

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {books.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-readora-purple/20 bg-white/50 px-6 py-10 text-center">

          <div className="text-4xl">📚</div>

          <h3 className="mt-3 font-display text-xl font-bold text-readora-purple">
            Your reading list is empty
          </h3>

          <p className="mt-2 text-sm text-readora-brown/70">
            Add a book above to see the global state change.
          </p>

        </div>
      ) : (

        /* ===================================================
           BOOK LIST
        =================================================== */

        <div className="grid gap-4">

          {books.map((book) => (

            <div
              key={book.isbn}
              className="
                flex items-center gap-4
                rounded-2xl border
                border-readora-purple/10
                bg-white/75 p-4
                shadow-sm
              "
            >

              {/* BOOK COVER */}

              <img
                src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-S.jpg`}
                alt={`${book.title} cover`}
                className="h-20 w-14 rounded-lg object-cover"
              />

              {/* BOOK DETAILS */}

              <div className="min-w-0 flex-1">

                <h3 className="font-display font-bold text-readora-purple">
                  {book.title}
                </h3>

                <p className="mt-1 text-sm text-readora-brown/70">
                  {book.author}
                </p>

                <span className="mt-2 inline-block rounded-full bg-readora-lavenderLight px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-readora-purple">
                  {book.shelf === "wantToRead"
                    ? "Want to Read"
                    : book.shelf}
                </span>

              </div>

              {/* REMOVE BUTTON */}

              <button
                onClick={() => removeFromShelf(book.isbn)}
                className="
                  rounded-full
                  border border-red-200
                  px-4 py-2
                  text-xs font-bold
                  text-red-600
                  transition
                  hover:bg-red-50
                "
              >
                Remove
              </button>

            </div>

          ))}

        </div>

      )}

    </section>
  );
}

export default ReadingList;
