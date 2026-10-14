import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useReadora } from "../context/ReadoraContext";

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const { auth, logout, demoLogin, notifications } = useReadora();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navClass = ({ isActive }) =>
    `
      text-sm font-semibold transition-colors duration-200
      ${
        isActive
          ? "text-readora-purple border-b-2 border-readora-gold pb-0.5"
          : "text-readora-brown/80 hover:text-readora-purple"
      }
    `;

  return (
    <header className="sticky top-0 z-50 border-b border-readora-purple/10 bg-readora-cream/95 backdrop-blur-xl">
      <div className="page-container">
        <div className="flex h-[76px] items-center justify-between gap-4">
          {/* BRAND */}
          <Link
            to="/"
            className="flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
            onClick={() => setMobileOpen(false)}
          >
            <img
              src={`${import.meta.env.BASE_URL}readora-logo.png`}
              alt="Readora"
              width="50"
              height="50"
              style={{
                width: "50px",
                height: "50px",
                maxWidth: "50px",
                maxHeight: "50px",
                minWidth: "50px",
                minHeight: "50px",
                objectFit: "contain",
                display: "block",
              }}
            />
            <div className="leading-none">
              <p className="font-display text-2xl font-bold tracking-wide text-readora-purple">
                Readora
              </p>
              <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-readora-gold sm:text-[9px]">
                Complete Reading Universe
              </p>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden items-center gap-5 xl:gap-6 lg:flex">
            <NavLink to="/" className={navClass}>
              Home
            </NavLink>
            <NavLink to="/discover" className={navClass}>
              Discover
            </NavLink>
            <NavLink to="/library" className={navClass}>
              My Library
            </NavLink>
            <NavLink to="/journal" className={navClass}>
              Journal
            </NavLink>
            <NavLink to="/analytics" className={navClass}>
              Analytics & Wrapped
            </NavLink>
            <NavLink to="/challenges" className={navClass}>
              Challenges
            </NavLink>
            <NavLink to="/community" className={navClass}>
              Community
            </NavLink>
            <NavLink to="/notes" className={navClass}>
              Smart Notes
            </NavLink>
            {auth.user?.role === "admin" && (
              <NavLink
                to="/admin"
                className="rounded-full bg-readora-plum/10 px-3 py-1 text-xs font-bold text-readora-purple border border-readora-purple/20 hover:bg-readora-gold hover:text-readora-purple"
              >
                Admin ⚙
              </NavLink>
            )}
          </nav>

          {/* RIGHT CONTROLS */}
          <div className="flex items-center gap-3">
            {auth.user ? (
              <div className="flex items-center gap-3">
                {/* NOTIFICATIONS DROPDOWN */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => {
                      setNotifOpen(!notifOpen);
                      setProfileOpen(false);
                    }}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-readora-purple/15 bg-white/70 text-readora-purple transition hover:border-readora-gold hover:bg-white"
                    title="Notifications"
                  >
                    🔔
                    {notifications.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {notifications.unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-readora-gold/20 bg-readora-cream p-3 shadow-2xl animate-scale-in">
                      <div className="flex items-center justify-between border-b border-readora-purple/10 px-3 py-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-readora-purple">
                          Notifications
                        </span>
                        <span className="text-[11px] text-readora-brown/60">
                          {notifications.list.length} alerts
                        </span>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-readora-purple/5">
                        {notifications.list.length === 0 ? (
                          <p className="p-4 text-center text-xs text-readora-brown/60">
                            No new notifications right now.
                          </p>
                        ) : (
                          notifications.list.map((n) => (
                            <div key={n._id} className="p-2.5 text-xs transition hover:bg-white/60">
                              <p className="font-bold text-readora-purple">{n.title}</p>
                              <p className="text-readora-brown/80">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* USER PROFILE DROPDOWN */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => {
                      setProfileOpen(!profileOpen);
                      setNotifOpen(false);
                    }}
                    className="flex items-center gap-2.5 rounded-full border border-readora-purple/20 bg-white/70 px-3 py-1.5 shadow-sm transition hover:border-readora-gold"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-readora-purple text-xs font-bold text-readora-cream">
                      {auth.user.name?.charAt(0).toUpperCase() || "R"}
                    </div>
                    <div className="hidden text-left sm:block">
                      <p className="text-xs font-bold leading-tight text-readora-purple">
                        {auth.user.name}
                      </p>
                      <p className="text-[10px] text-readora-gold font-semibold">
                        Lvl {auth.user.level || 1} • {auth.user.xp || 0} XP
                      </p>
                    </div>
                    <span className="text-xs text-readora-brown">▾</span>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-readora-gold/20 bg-readora-cream p-2 shadow-2xl animate-scale-in">
                      <div className="border-b border-readora-purple/10 p-3">
                        <p className="font-display font-bold text-readora-purple">
                          {auth.user.name}
                        </p>
                        <p className="text-xs text-readora-brown/70 truncate">{auth.user.email}</p>
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-readora-lavenderLight/40 px-2.5 py-0.5 text-[10px] font-bold text-readora-purple">
                          <span>🔥</span> {auth.user.streak?.current || 1}-day reading streak
                        </div>
                      </div>

                      <div className="flex flex-col py-1 text-xs font-semibold text-readora-purple">
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/profile");
                          }}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-readora-lavenderLight/50"
                        >
                          👤 My Profile & Reading Goals
                        </button>
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/analytics");
                          }}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-readora-lavenderLight/50"
                        >
                          📊 Year in Books (Wrapped)
                        </button>
                        {auth.user.role === "admin" && (
                          <button
                            onClick={() => {
                              setProfileOpen(false);
                              navigate("/admin");
                            }}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-readora-lavenderLight/50"
                          >
                            ⚙ Admin Dashboard
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            logout();
                          }}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-red-600 hover:bg-red-50"
                        >
                          🚪 Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={demoLogin}
                  className="hidden sm:inline-flex rounded-full border border-readora-gold/40 bg-readora-gold/15 px-3 py-1.5 text-xs font-bold text-readora-purple transition hover:bg-readora-gold hover:text-readora-purple"
                  title="Test all features instantly"
                >
                  Demo Sign-In ✦
                </button>
                <NavLink
                  to="/login"
                  className="rounded-full border border-readora-purple/20 px-4 py-2 text-xs font-bold text-readora-purple transition hover:border-readora-gold hover:bg-readora-lavenderLight"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-full bg-readora-purple px-4 py-2 text-xs font-bold text-readora-cream shadow-magical transition hover:bg-readora-plum hover:shadow-gold"
                >
                  Join READORA
                </NavLink>
              </div>
            )}

            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-readora-purple/15 bg-white/60 text-xl text-readora-purple transition lg:hidden"
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* MOBILE NAVIGATION */}
        {mobileOpen && (
          <nav className="border-t border-readora-purple/10 py-5 lg:hidden animate-fade-in">
            <div className="flex flex-col gap-3 font-semibold text-sm">
              <NavLink to="/" className={navClass} onClick={() => setMobileOpen(false)}>
                Home
              </NavLink>
              <NavLink to="/discover" className={navClass} onClick={() => setMobileOpen(false)}>
                Discover Catalog & Surprise Me
              </NavLink>
              <NavLink to="/library" className={navClass} onClick={() => setMobileOpen(false)}>
                My Library & Shelves
              </NavLink>
              <NavLink to="/journal" className={navClass} onClick={() => setMobileOpen(false)}>
                Reading Journal & Sessions
              </NavLink>
              <NavLink to="/analytics" className={navClass} onClick={() => setMobileOpen(false)}>
                Analytics, Personality & Wrapped
              </NavLink>
              <NavLink to="/challenges" className={navClass} onClick={() => setMobileOpen(false)}>
                Challenges & Goals
              </NavLink>
              <NavLink to="/community" className={navClass} onClick={() => setMobileOpen(false)}>
                Community & Buddy Reads
              </NavLink>
              <NavLink to="/notes" className={navClass} onClick={() => setMobileOpen(false)}>
                Smart Study Notes
              </NavLink>
              {auth.user?.role === "admin" && (
                <NavLink to="/admin" className={navClass} onClick={() => setMobileOpen(false)}>
                  Admin Dashboard ⚙
                </NavLink>
              )}
              {!auth.user && (
                <div className="mt-3 pt-3 border-t border-readora-purple/10 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      demoLogin();
                    }}
                    className="rounded-full bg-readora-gold py-2.5 text-center text-xs font-bold text-readora-purple"
                  >
                    Quick Demo Sign-In ✦
                  </button>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Navbar;