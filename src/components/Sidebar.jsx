import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useReadora } from "../context/ReadoraContext";

function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { auth, logout, socket, openAuthModal, googleLogin, showToast } = useReadora();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const navClass = ({ isActive }) => `
    flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200
    ${
      isActive
        ? "bg-readora-purple text-readora-cream shadow-sm"
        : "text-readora-brown/80 hover:bg-readora-lavenderLight/50 hover:text-readora-purple"
    }
  `;

  const handleGoogleSignIn = async () => {
    try {
      const mockEmail = `reader_${Math.floor(Math.random() * 9000 + 1000)}@gmail.com`;
      await googleLogin({
        email: mockEmail,
        name: "Google Reader",
        avatar: "https://lh3.googleusercontent.com/a/default-user",
        googleId: `g_${Date.now()}`,
      });
      onClose();
    } catch (err) {
      showToast("Google sign in failed: " + err.message, "error");
    }
  };

  const navLinks = [
    { to: "/", label: "Home", icon: "🏠" },
    { to: "/library", label: "My Library", icon: "📖", protected: true },
    { to: "/journal", label: "Reading Journal", icon: "📜", protected: true },
    { to: "/analytics", label: "Analytics & Wrapped", icon: "📊", protected: true },
    { to: "/community", label: "Community & Buddy Reads", icon: "👥", protected: true },
    { to: "/challenges", label: "Challenges & Milestones", icon: "🎯", protected: true },
    { to: "/discover", label: "Discover Books", icon: "🔍" },
    { to: "/profile", label: "My Profile", icon: "👤", protected: true },
  ];

  if (auth.user?.role === "admin") {
    navLinks.push({ to: "/admin", label: "Admin Console", icon: "⚙️", protected: true });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* BACKDROP OVERLAY */}
      <div
        className="fixed inset-0 bg-readora-plum/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* RIGHT SLIDE-OUT DRAWER */}
      <aside
        className="
          fixed inset-y-0 right-0 z-50
          w-80 max-w-[85vw]
          bg-readora-cream shadow-2xl
          border-l border-readora-purple/15
          flex flex-col justify-between p-5
          animate-slide-left
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP: BRAND & CLOSE BUTTON */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-readora-purple/10">
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center gap-2.5 transition hover:scale-[1.02]"
            >
              <img
                src={`${import.meta.env.BASE_URL}readora-logo.png`}
                alt="Readora"
                className="h-9 w-9 object-contain"
              />
              <div>
                <p className="font-display text-lg font-bold tracking-wide text-readora-purple">
                  Readora
                </p>
                <p className="text-[7.5px] font-bold uppercase tracking-[0.16em] text-readora-gold">
                  Literary Universe
                </p>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-readora-purple/10 text-readora-purple hover:bg-readora-purple/20 transition text-sm font-bold"
              title="Close Menu"
            >
              ✕
            </button>
          </div>

          {/* USER CARD OR SIGN-IN CTA */}
          {auth.user ? (
            <div className="mt-3 rounded-2xl bg-gradient-to-br from-readora-purple/5 to-readora-gold/10 p-3 border border-readora-gold/20">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-readora-purple text-xs font-bold text-readora-cream shadow">
                  {auth.user.name?.charAt(0).toUpperCase() || "R"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-readora-purple truncate">
                    {auth.user.name}
                  </p>
                  <p className="text-[10px] text-readora-brown/70 truncate">
                    {auth.user.email}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-readora-brown/80 border-t border-readora-purple/10 pt-1.5">
                <span>Level {auth.user.level || 1} ({auth.user.xp || 0} XP)</span>
                <span className="text-amber-700">🔥 {auth.user.streak?.current || 1}d Streak</span>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl bg-readora-purple/5 p-3 border border-readora-purple/10 text-center">
              <p className="text-xs font-bold text-readora-purple">Welcome Reader ✦</p>
              <p className="mt-0.5 text-[10px] text-readora-brown/70">
                Sign in with OTP or Google for full access
              </p>
              <button
                onClick={() => {
                  onClose();
                  openAuthModal({ message: "Sign in with Email OTP or Google to explore Readora." });
                }}
                className="mt-2 w-full rounded-full bg-readora-purple py-1.5 text-[11px] font-bold text-readora-cream shadow hover:bg-readora-plum transition"
              >
                Sign In (OTP / Google)
              </button>
            </div>
          )}

          {/* NAVIGATION LINKS */}
          <nav className="mt-4 space-y-1 overflow-y-auto max-h-[calc(100vh-370px)] scrollbar-none">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={navClass}
              >
                <span className="text-base">{link.icon}</span>
                <span className="flex-1">{link.label}</span>
                {link.protected && !auth.user && (
                  <span className="text-[10px] text-readora-brown/40">🔒</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* BOTTOM AUTH CONTROLS */}
        <div className="pt-3 border-t border-readora-purple/10">
          {auth.user ? (
            <div className="space-y-2">
              <div className="rounded-xl bg-white/70 px-3 py-1.5 text-[10px] text-readora-brown/75 flex items-center justify-between border border-readora-purple/10">
                <span className="truncate">📧 {auth.user.email}</span>
                <span className="text-emerald-700 font-bold shrink-0">✓ Registered</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  logout();
                  navigate("/");
                }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50/80 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition"
              >
                <span>🚪</span> Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-readora-purple/15 bg-white py-2 text-xs font-bold text-readora-purple shadow-2xs hover:bg-readora-lavenderLight transition"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="rounded-2xl border border-readora-purple/20 bg-white py-1.5 text-center text-xs font-bold text-readora-purple hover:bg-readora-lavenderLight transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="rounded-2xl bg-readora-purple py-1.5 text-center text-xs font-bold text-readora-cream shadow hover:bg-readora-plum transition"
                >
                  Join Free
                </Link>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default Sidebar;
