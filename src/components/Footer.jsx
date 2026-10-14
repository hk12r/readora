import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="border-t border-readora-purple/10 bg-readora-cream/90">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link
              to="/"
              className="font-display text-2xl font-bold text-readora-purple"
            >
              READORA ✦
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-6 text-readora-brown/75">
              Your complete reading universe — track your books,
              discover new stories by mood, and understand your reading journey.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-bold text-readora-purple">
              Explore
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link
                to="/"
                className="text-readora-brown/75 transition hover:text-readora-purple"
              >
                Home
              </Link>

              <Link
                to="/discover"
                className="text-readora-brown/75 transition hover:text-readora-purple"
              >
                Discover & Surprise Me
              </Link>

              <Link
                to="/library"
                className="text-readora-brown/75 transition hover:text-readora-purple"
              >
                My Library & Shelves
              </Link>

              <Link
                to="/journal"
                className="text-readora-brown/75 transition hover:text-readora-purple"
              >
                Reading Journal
              </Link>

              <Link
                to="/analytics"
                className="text-readora-brown/75 transition hover:text-readora-purple"
              >
                Analytics & Wrapped
              </Link>
            </div>
          </div>

          {/* Community & Notes */}
          <div>
            <h3 className="font-bold text-readora-purple">
              Features
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link
                to="/challenges"
                className="text-readora-brown/75 transition hover:text-readora-purple"
              >
                Challenges & Goals
              </Link>

              <Link
                to="/community"
                className="text-readora-brown/75 transition hover:text-readora-purple"
              >
                Buddy Reads & Book Clubs
              </Link>

              <Link
                to="/notes"
                className="text-readora-brown/75 transition hover:text-readora-purple"
              >
                Smart Study Notes
              </Link>

              <Link
                to="/about"
                className="text-readora-brown/75 transition hover:text-readora-purple"
              >
                About Readora
              </Link>

              <Link
                to="/contact"
                className="text-readora-brown/75 transition hover:text-readora-purple"
              >
                Contact & Feedback
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div>
            <h3 className="font-bold text-readora-purple">
              Start Reading
            </h3>

            <p className="mt-4 text-sm leading-6 text-readora-brown/75">
              Build your library, track your progress, and make
              every book part of your story.
            </p>

            <Link
              to="/register"
              className="mt-5 inline-block rounded-full bg-readora-purple px-5 py-2.5 text-xs font-bold text-readora-cream transition hover:bg-readora-plum shadow-magical"
            >
              Join READORA ✦
            </Link>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 flex flex-col gap-3 border-t border-readora-purple/10 pt-6 text-xs text-readora-brown/65 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} READORA. Complete Reading Universe.
          </p>

          <p className="text-readora-gold font-semibold">
            ✦ Crafted for people who love stories.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;