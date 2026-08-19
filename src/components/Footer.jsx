import { Link } from "react-router-dom"

function Footer() {
  return (
    <footer className="border-t border-border bg-cream">
      <div className="mx-auto max-w-7xl px-6 py-12">

        {/* Main Footer Content */}
        <div className="grid gap-10 md:grid-cols-4">

          {/* Brand */}
          <div>
            <Link
              to="/"
              className="text-2xl font-bold text-plum"
            >
              READORA
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-6 text-taupe">
              Your complete reading experience — track your books,
              discover new stories, and understand your reading journey.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-bold text-ink">
              Explore
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link
                to="/"
                className="text-taupe transition hover:text-plum"
              >
                Home
              </Link>

              <Link
                to="/discover"
                className="text-taupe transition hover:text-plum"
              >
                Discover
              </Link>

              <Link
                to="/library"
                className="text-taupe transition hover:text-plum"
              >
                My Library
              </Link>

              <Link
                to="/community"
                className="text-taupe transition hover:text-plum"
              >
                Community
              </Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-ink">
              READORA
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link
                to="/about"
                className="text-taupe transition hover:text-plum"
              >
                About
              </Link>

              <Link
                to="/contact"
                className="text-taupe transition hover:text-plum"
              >
                Contact
              </Link>

              <a
                href="#"
                className="text-taupe transition hover:text-plum"
              >
                Privacy Policy
              </a>

              <a
                href="#"
                className="text-taupe transition hover:text-plum"
              >
                Terms of Service
              </a>
            </div>
          </div>

          {/* CTA */}
          <div>
            <h3 className="font-bold text-ink">
              Start Reading
            </h3>

            <p className="mt-4 text-sm leading-6 text-taupe">
              Build your library, track your progress, and make
              every book part of your story.
            </p>

            <Link
              to="/register"
              className="mt-5 inline-block rounded-xl bg-plum px-5 py-2.5 text-sm font-bold text-white transition hover:bg-plum-dark"
            >
              Join READORA
            </Link>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-sm text-taupe sm:flex-row sm:items-center sm:justify-between">

          <p>
            © {new Date().getFullYear()} READORA. All rights reserved.
          </p>

          <p>
            Made for people who love stories.
          </p>

        </div>

      </div>
    </footer>
  )
}

export default Footer