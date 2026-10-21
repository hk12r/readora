import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useReadora } from "../context/ReadoraContext";

function Navbar({ onOpenSidebar }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const { auth, logout, notifications, socket, openAuthModal } = useReadora();

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

  return (
    <header className="sticky top-0 z-30 border-b border-readora-purple/10 bg-readora-cream/90 backdrop-blur-xl">
      <div className="page-container">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* BRAND LOGO */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 transition hover:scale-[1.02]">
              <img
                src={`${import.meta.env.BASE_URL}readora-logo.png`}
                alt="Readora"
                className="h-9 w-9 object-contain"
              />
              <div className="leading-tight">
                <span className="font-display text-xl font-bold tracking-wide text-readora-purple">
                  Readora
                </span>
                <span className="hidden sm:block text-[8px] font-bold uppercase tracking-[0.18em] text-readora-gold">
                  Literary Universe
                </span>
              </div>
            </Link>
          </div>

          {/* RIGHT: NOTIFICATIONS, PROFILE, AND RIGHT-SIDEBAR MENU TOGGLE */}
          <div className="flex items-center gap-2.5">
            {auth.user ? (
              <div className="flex items-center gap-2.5">
                {/* NOTIFICATIONS BELL */}
                <div id="navbar-notif-container" className="relative" ref={notifRef}>
                  <button
                    onClick={() => {
                      setNotifOpen(!notifOpen);
                      setProfileOpen(false);
                    }}
                    className="relative flex h-9 w-9 items-center justify-center rounded-full border border-readora-purple/15 bg-white/80 text-readora-purple shadow-2xs transition hover:border-readora-gold hover:bg-white"
                    title="Real-Time Notifications"
                  >
                    🔔
                    {notifications.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-xs">
                        {notifications.unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div
                      id="navbar-notif-dropdown"
                      className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-readora-gold/20 bg-readora-cream p-3 shadow-2xl animate-scale-in"
                    >
                      <div className="flex items-center justify-between border-b border-readora-purple/10 px-3 py-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-readora-purple">
                          Live Alerts & Updates
                        </span>
                        <span className="text-[11px] text-readora-brown/60">
                          {notifications.list.length} alerts
                        </span>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-readora-purple/5">
                        {notifications.list.length === 0 ? (
                          <p className="p-4 text-center text-xs text-readora-brown/60">
                            No unread notifications right now.
                          </p>
                        ) : (
                          notifications.list.map((n) => (
                            <div
                              key={n._id}
                              onClick={() => {
                                setNotifOpen(false);
                                if (n.link) {
                                  navigate(n.link);
                                }
                              }}
                              className="p-2.5 text-xs transition hover:bg-white/80 cursor-pointer rounded-xl group"
                            >
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-readora-purple group-hover:text-readora-plum">{n.title}</p>
                                <span className="text-[9px] text-readora-gold font-bold">Open →</span>
                              </div>
                              <p className="text-readora-brown/80 mt-0.5">{n.message}</p>
                              <p className="mt-1 text-[9px] text-readora-brown/50">
                                {(() => {
                                  const d = n.createdAt ? new Date(n.createdAt) : new Date();
                                  return isNaN(d.getTime()) ? "Recently" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                                })()}
                              </p>
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
                    className="flex items-center gap-2 rounded-full border border-readora-purple/20 bg-white/80 p-1 pr-2.5 shadow-2xs transition hover:border-readora-gold"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-readora-purple text-xs font-bold text-readora-cream">
                      {auth.user.name?.charAt(0).toUpperCase() || "R"}
                    </div>
                    <span className="hidden sm:inline text-xs font-bold text-readora-purple truncate max-w-[110px]">
                      {auth.user.name}
                    </span>
                    <span className="text-[10px] text-readora-brown">▾</span>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-readora-gold/20 bg-readora-cream p-2 shadow-2xl animate-scale-in">
                      <div className="border-b border-readora-purple/10 p-3">
                        <p className="font-display font-bold text-readora-purple">
                          {auth.user.name}
                        </p>
                        <p className="text-xs text-readora-brown/70 truncate">{auth.user.email}</p>
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-readora-lavenderLight/40 px-2 py-0.5 text-[10px] font-bold text-readora-purple">
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal({ message: "Sign in with OTP or Google to access all features." })}
                  className="rounded-full bg-readora-purple px-3.5 py-1.5 text-xs font-bold text-readora-cream shadow hover:bg-readora-plum transition"
                >
                  Sign In (OTP) ✦
                </button>
              </div>
            )}

            {/* RIGHT SIDEBAR OPEN/CLOSE TOGGLE BUTTON */}
            <button
              onClick={onOpenSidebar}
              className="flex items-center gap-1.5 rounded-full border border-readora-purple/20 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-readora-purple shadow-2xs hover:border-readora-gold hover:bg-white transition"
              title="Open Navigation Menu"
            >
              <span className="text-sm">☰</span>
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
