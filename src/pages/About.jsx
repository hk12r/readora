import React from "react";

function About() {
  return (
    <main className="magical-background min-h-screen">
      <section className="page-container py-16 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <span
            className="
              text-xs font-bold uppercase
              tracking-[0.2em]
              text-readora-gold
            "
          >
            About READORA
          </span>

          <h1
            className="
              mt-4 font-display text-5xl
              font-bold text-readora-purple
              sm:text-6xl
            "
          >
            More than a book tracker.
          </h1>

          <p
            className="
              mx-auto mt-6 max-w-2xl
              text-lg leading-8
              text-readora-brown/80
            "
          >
            READORA is designed around the complete
            reading experience — from discovering your
            next book to tracking your progress and
            remembering the stories that stayed with you.
          </p>
        </div>

        <div
          className="
            mt-14 grid gap-6
            md:grid-cols-3
          "
        >
          {[
            {
              icon: "☾",
              title: "Discover",
              text: "Find stories according to your mood, interests and reading personality.",
            },
            {
              icon: "⌛",
              title: "Track",
              text: "Build your personal library and keep track of what you are reading.",
            },
            {
              icon: "✦",
              title: "Reflect",
              text: "Turn your reading history into meaningful insights and memories.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="
                glass-card p-7
                transition hover:-translate-y-2
              "
            >
              <div className="text-4xl text-readora-gold">
                {item.icon}
              </div>

              <h2
                className="
                  mt-5 font-display text-2xl
                  font-bold text-readora-purple
                "
              >
                {item.title}
              </h2>

              <p
                className="
                  mt-3 leading-7
                  text-readora-brown/75
                "
              >
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default About;