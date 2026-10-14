import React, { useState } from "react";
import { useReadora } from "../context/ReadoraContext";

function Profile() {
  const { auth, updateProfile, openAuthModal, logout, showToast } = useReadora();

  const [formData, setFormData] = useState({
    name: auth.user?.name || "",
    bio: auth.user?.bio || "",
    favoriteQuote: auth.user?.favoriteQuote || "",
    favoriteGenres: (auth.user?.favoriteGenres || ["Fantasy", "Mystery"]).join(", "),
  });

  const [saving, setSaving] = useState(false);

  if (!auth.user) {
    return (
      <main className="min-h-screen bg-readora-cream py-16">
        <div className="page-container text-center">
          <span className="text-4xl text-readora-gold">👤</span>
          <h1 className="mt-4 font-display text-4xl font-bold text-readora-purple">
            Reader Profile
          </h1>
          <p className="mt-2 text-sm text-readora-brown/75">
            Sign in to customize your reading universe and track your accomplishments.
          </p>
          <button
            onClick={() => openAuthModal({ message: "Sign in to manage your profile." })}
            className="mt-6 rounded-full bg-readora-gold px-8 py-3 text-xs font-bold text-readora-purple shadow-gold hover:bg-readora-goldLight"
          >
            Log In ✦
          </button>
        </div>
      </main>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const genresArray = formData.favoriteGenres
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

      await updateProfile({
        name: formData.name,
        bio: formData.bio,
        favoriteQuote: formData.favoriteQuote,
        favoriteGenres: genresArray,
      });
    } catch (err) {
      showToast("Could not update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-readora-cream py-10">
      <div className="page-container max-w-4xl">
        {/* PROFILE BANNER */}
        <div className="rounded-3xl border border-readora-gold/30 bg-gradient-to-r from-readora-purple via-readora-royal to-readora-plum p-8 text-readora-cream shadow-magical">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-readora-gold text-3xl font-bold text-readora-purple shadow-gold">
              {auth.user.name?.charAt(0).toUpperCase() || "R"}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-3xl font-bold text-readora-cream">
                  {auth.user.name}
                </h1>
                <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold text-readora-gold">
                  Level {auth.user.level || 1}
                </span>
                {auth.user.role === "admin" && (
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-black uppercase">
                    Admin
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-readora-cream/70">{auth.user.email}</p>
              <p className="mt-2 text-xs italic text-readora-gold">"{auth.user.favoriteQuote}"</p>
            </div>

            {/* STREAK & XP PILLS */}
            <div className="flex gap-3 sm:flex-col">
              <div className="rounded-2xl bg-white/10 p-3 text-center border border-white/10">
                <p className="text-xs text-readora-gold font-bold">🔥 {auth.user.streak?.current || 1} Days</p>
                <p className="text-[10px] text-readora-cream/60">Current Streak</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-center border border-white/10">
                <p className="text-xs text-readora-gold font-bold">✦ {auth.user.xp || 0} XP</p>
                <p className="text-[10px] text-readora-cream/60">Earned XP</p>
              </div>
            </div>
          </div>
        </div>

        {/* EDIT FORM & BADGES */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <form
            onSubmit={handleSave}
            className="rounded-3xl border border-readora-purple/10 bg-white/80 p-8 shadow-sm space-y-4"
          >
            <h2 className="font-display text-xl font-bold text-readora-purple">
              Profile Settings
            </h2>

            <div>
              <label className="text-xs font-bold text-readora-purple block mb-1">Your Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-readora-purple block mb-1">Bio</label>
              <textarea
                rows="3"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full rounded-2xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-readora-purple block mb-1">
                Favorite Quote
              </label>
              <input
                type="text"
                value={formData.favoriteQuote}
                onChange={(e) => setFormData({ ...formData, favoriteQuote: e.target.value })}
                className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-readora-purple block mb-1">
                Favorite Genres (comma-separated)
              </label>
              <input
                type="text"
                value={formData.favoriteGenres}
                onChange={(e) => setFormData({ ...formData, favoriteGenres: e.target.value })}
                className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none"
              />
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-readora-gold px-8 py-3 text-xs font-bold text-readora-purple shadow-gold hover:bg-readora-goldLight"
              >
                {saving ? "Saving..." : "Save Profile ✦"}
              </button>

              <button
                type="button"
                onClick={logout}
                className="text-xs font-bold text-red-500 hover:underline"
              >
                Sign Out
              </button>
            </div>
          </form>

          {/* BADGES & TROPHIES */}
          <div className="rounded-3xl border border-readora-purple/10 bg-white/80 p-8 shadow-sm">
            <h3 className="font-display text-lg font-bold text-readora-purple">
              My Badges ({auth.user.badges?.length || 0})
            </h3>
            <div className="mt-4 space-y-3">
              {(auth.user.badges || []).map((b) => (
                <div
                  key={b.id || b.name}
                  className="flex items-center gap-3 rounded-2xl border border-readora-gold/20 bg-readora-cream/40 p-3"
                >
                  <span className="text-2xl">{b.icon || "🏆"}</span>
                  <div>
                    <h4 className="font-display text-xs font-bold text-readora-purple">{b.name}</h4>
                    <p className="text-[10px] text-readora-brown/70">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Profile;
