import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navClass = ({ isActive }) =>
    `
      transition-colors duration-200
      ${
        isActive
          ? "font-semibold text-readora-purple"
          : "text-readora-brown hover:text-readora-purple"
      }
    `;

  return (
    <header
      className="
        sticky top-0 z-50
        border-b border-readora-purple/10
        bg-readora-cream/95
        backdrop-blur-xl
      "
    >
      <div className="page-container">
        <div className="flex h-[76px] items-center justify-between">

          {/* LOGO + BRAND */}
          <Link
            to="/"
            className="
              flex items-center gap-3
              transition-transform duration-300
              hover:scale-[1.02]
            "
            onClick={() => setMobileOpen(false)}
          >
            <img
              src={`${import.meta.env.BASE_URL}readora-logo.png`}
              alt="Readora"
              width="56"
              height="56"
              style={{
                width: "56px",
                height: "56px",
                maxWidth: "56px",
                maxHeight: "56px",
                minWidth: "56px",
                minHeight: "56px",
                objectFit: "contain",
                display: "block",
              }}
            />

            <div className="leading-none">
              <p
                className="
                  font-display text-2xl
                  font-bold
                  tracking-wide
                  text-readora-purple
                "
              >
                Readora
              </p>

              <p
                className="
                  mt-1
                  text-[8px]
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-readora-gold
                  sm:text-[9px]
                "
              >
                Complete Reading Experience
              </p>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden items-center gap-7 md:flex">

            <NavLink to="/" className={navClass}>
              Home
            </NavLink>

            <NavLink to="/about" className={navClass}>
              About
            </NavLink>

            <NavLink to="/contact" className={navClass}>
              Contact
            </NavLink>

            <NavLink
              to="/login"
              className="
                rounded-full
                border border-readora-purple/20
                px-5 py-2.5
                font-semibold
                text-readora-purple
                transition-all duration-300
                hover:border-readora-gold
                hover:bg-readora-lavenderLight
              "
            >
              Login
            </NavLink>

            <NavLink
              to="/register"
              className="
                rounded-full
                bg-readora-purple
                px-5 py-2.5
                font-semibold
                text-readora-cream
                shadow-magical
                transition-all duration-300
                hover:-translate-y-0.5
                hover:bg-readora-plum
                hover:shadow-gold
              "
            >
              Join READORA
            </NavLink>
          </nav>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-xl
              border border-readora-purple/15
              bg-white/60
              text-xl
              text-readora-purple
              transition
              hover:border-readora-gold
              md:hidden
            "
          >
            {mobileOpen ? "×" : "☰"}
          </button>
        </div>

        {/* MOBILE NAVIGATION */}
        {mobileOpen && (
          <nav
            className="
              border-t border-readora-purple/10
              py-5
              md:hidden
            "
          >
            <div className="flex flex-col gap-4">

              <NavLink
                to="/"
                className={navClass}
                onClick={() => setMobileOpen(false)}
              >
                Home
              </NavLink>

              <NavLink
                to="/about"
                className={navClass}
                onClick={() => setMobileOpen(false)}
              >
                About
              </NavLink>

              <NavLink
                to="/contact"
                className={navClass}
                onClick={() => setMobileOpen(false)}
              >
                Contact
              </NavLink>

              <NavLink
                to="/login"
                className={navClass}
                onClick={() => setMobileOpen(false)}
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                className="
                  font-semibold
                  text-readora-gold
                "
                onClick={() => setMobileOpen(false)}
              >
                Join READORA ✦
              </NavLink>

            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Navbar;