import React, { useState } from "react";
import Button from "../components/Button";

function Contact() {
  const [submitted, setSubmitted] =
    useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="magical-background min-h-screen">
      <section className="page-container py-14 sm:py-20">
        <div
          className="
            grid gap-10
            lg:grid-cols-2
          "
        >
          <div>
            <span
              className="
                text-xs font-bold uppercase
                tracking-[0.2em]
                text-readora-gold
              "
            >
              Contact
            </span>

            <h1
              className="
                mt-4 font-display text-5xl
                font-bold text-readora-purple
              "
            >
              Let's talk books.
            </h1>

            <p
              className="
                mt-6 max-w-lg
                leading-8
                text-readora-brown/80
              "
            >
              Have feedback, an idea for READORA or a
              recommendation for our future shelves?
              Send us a message.
            </p>

            <div
              className="
                mt-8 rounded-3xl
                bg-readora-purple
                p-7 text-readora-cream
              "
            >
              <p className="font-display text-2xl font-bold">
                ✦ A little note
              </p>

              <p
                className="
                  mt-3 text-sm leading-7
                  text-readora-lavender
                "
              >
                READORA is being designed as a complete
                reading ecosystem — not just another
                place to record books.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="
              glass-card p-6
              sm:p-8
            "
          >
            <label
              className="
                mb-2 block text-sm
                font-semibold text-readora-purple
              "
            >
              Your name
            </label>

            <input
              required
              className="input-field"
              placeholder="Enter your name"
            />

            <label
              className="
                mb-2 mt-5 block text-sm
                font-semibold text-readora-purple
              "
            >
              Email
            </label>

            <input
              required
              type="email"
              className="input-field"
              placeholder="you@example.com"
            />

            <label
              className="
                mb-2 mt-5 block text-sm
                font-semibold text-readora-purple
              "
            >
              Message
            </label>

            <textarea
              required
              rows="6"
              className="input-field resize-none"
              placeholder="Tell us what's on your mind..."
            />

            <Button type="submit" className="mt-6 w-full">
              Send Message ✦
            </Button>

            {submitted && (
              <div
                className="
                  mt-4 rounded-2xl
                  bg-readora-lavenderLight
                  p-4 text-center
                  text-sm font-semibold
                  text-readora-purple
                "
              >
                Your message has been received!
              </div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}

export default Contact;