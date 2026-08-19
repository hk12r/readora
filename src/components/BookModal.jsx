import React from "react";
import Button from "./Button";

function BookModal({ book, onClose }) {
  if (!book) return null;

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-readora-plum/70 px-4
        backdrop-blur-sm
      "
      onClick={onClose}
    >
      <div
        className="
          relative w-full max-w-2xl
          overflow-hidden rounded-[2rem]
          border border-readora-gold/30
          bg-readora-cream
          shadow-2xl
          animate-fadeUp
        "
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="
            absolute right-4 top-4 z-10
            flex h-10 w-10 items-center
            justify-center rounded-full
            bg-readora-plum
            text-xl text-readora-cream
            transition hover:bg-readora-purple
          "
        >
          ×
        </button>

        <div className="grid md:grid-cols-[220px_1fr]">
          <div
            className="
              flex min-h-[300px] items-center
              justify-center bg-readora-purple p-6
            "
          >
            <div
              className="
                flex aspect-[2/3] w-40
                flex-col items-center
                justify-center rounded-xl
                bg-gradient-to-br
                from-readora-gold
                to-readora-purple
                p-5 text-center
                text-readora-cream
                shadow-xl
              "
            >
              <span className="mb-4 text-4xl">✦</span>

              <p className="font-display text-xl font-bold">
                {book.title}
              </p>

              <p className="mt-3 text-sm">
                {book.author}
              </p>
            </div>
          </div>

          <div className="p-7 sm:p-9">
            <span
              className="
                rounded-full bg-readora-lavenderLight
                px-3 py-1 text-xs font-bold
                uppercase tracking-wider
                text-readora-purple
              "
            >
              {book.genre}
            </span>

            <h2
              className="
                mt-5 font-display text-3xl
                font-bold text-readora-purple
              "
            >
              {book.title}
            </h2>

            <p className="mt-2 text-readora-brown">
              by {book.author}
            </p>

            <div className="my-6 h-px bg-readora-purple/10" />

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/70 p-4">
                <p className="text-xs text-readora-brown/60">
                  Rating
                </p>

                <p className="mt-1 font-bold text-readora-purple">
                  ★ {book.rating}
                </p>
              </div>

              <div className="rounded-2xl bg-white/70 p-4">
                <p className="text-xs text-readora-brown/60">
                  Pages
                </p>

                <p className="mt-1 font-bold text-readora-purple">
                  {book.pages}
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm leading-7 text-readora-brown/80">
              A carefully selected title from your READORA
              discovery collection. Add it to your future
              reading list or explore more books based on your
              current mood.
            </p>

            <Button
              className="mt-6 w-full"
              onClick={onClose}
            >
              Add to My Library
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookModal;