import React, { useState } from "react";
import { useReadora } from "../context/ReadoraContext";

// Master Badge Catalog with criteria, icons, and descriptions
const MASTER_BADGES = [
  {
    id: "first_steps",
    name: "First Steps",
    icon: "🌟",
    category: "Milestone",
    description: "Added your first book or reading session to your Readora library.",
    requirement: "Add 1 book or session",
  },
  {
    id: "bookworm",
    name: "Bookworm",
    icon: "📚",
    category: "Reading",
    description: "Finished 5 or more books across any genre in your personal library.",
    requirement: "Read 5 books",
  },
  {
    id: "streak_master",
    name: "Week of Pages",
    icon: "🔥",
    category: "Consistency",
    description: "Kept your reading flame burning with a 7-day consecutive streak.",
    requirement: "7-day reading streak",
  },
  {
    id: "fellowship",
    name: "Fellowship Reader",
    icon: "👥",
    category: "Social",
    description: "Started or joined a synchronous Buddy Read with a reading partner.",
    requirement: "Participate in 1 Buddy Read",
  },
  {
    id: "critic",
    name: "Literary Critic",
    icon: "✍️",
    category: "Community",
    description: "Shared 3 or more thoughtful book reviews in the Community feed.",
    requirement: "Publish 3 reviews",
  },
  {
    id: "night_owl",
    name: "Midnight Reader",
    icon: "🦉",
    category: "Pacing",
    description: "Logged an immersive late-night reading session between 11 PM and 4 AM.",
    requirement: "Read after 11 PM",
  },
  {
    id: "genre_voyager",
    name: "Genre Voyager",
    icon: "🧭",
    category: "Exploration",
    description: "Explored and logged books across at least 3 distinct literary genres.",
    requirement: "Read across 3 genres",
  },
  {
    id: "challenge_summit",
    name: "Summit Champion",
    icon: "🏆",
    category: "Quest",
    description: "Reached 100% completion on an official seasonal reading challenge.",
    requirement: "Complete 1 challenge",
  },
];

// Reader Levels definitions
const READER_RANKS = [
  { level: 1, title: "Apprentice Reader", minXp: 0, maxXp: 199, icon: "🌱", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { level: 2, title: "Page Turner", minXp: 200, maxXp: 499, icon: "📖", color: "text-sky-700 bg-sky-50 border-sky-200" },
  { level: 3, title: "Literary Scholar", minXp: 500, maxXp: 999, icon: "📜", color: "text-purple-700 bg-purple-50 border-purple-200" },
  { level: 4, title: "Master of Tomes", minXp: 1000, maxXp: 1999, icon: "🔮", color: "text-amber-800 bg-amber-50 border-amber-200" },
  { level: 5, title: "Grand Bibliophile", minXp: 2000, maxXp: 99999, icon: "👑", color: "text-readora-purple bg-readora-gold/20 border-readora-gold/40" },
];

function Profile() {
  const { auth, updateProfile, openAuthModal, logout, showToast, library } = useReadora();

  const [formData, setFormData] = useState({
    name: auth.user?.name || "",
    bio: auth.user?.bio || "",
    favoriteQuote: auth.user?.favoriteQuote || "",
    favoriteGenres: (auth.user?.favoriteGenres || ["Fantasy", "Mystery"]).join(", "),
  });

  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("all_badges"); // "all_badges" | "level_guide"

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

  const currentXp = auth.user.xp || 0;
  const currentLevel = auth.user.level || Math.max(1, Math.floor(currentXp / 200) + 1);
  const currentRank = READER_RANKS.find((r) => r.level === currentLevel) || READER_RANKS[0];
  const nextRank = READER_RANKS.find((r) => r.level === currentLevel + 1) || null;

  const xpInCurrentLevel = currentXp - currentRank.minXp;
  const levelSpan = nextRank ? nextRank.minXp - currentRank.minXp : 1000;
  const levelProgressPct = Math.min(100, Math.max(5, Math.round((xpInCurrentLevel / levelSpan) * 100)));

  // Normalize user badges into an array of badge names/IDs
  const userBadgeNames = new Set(
    (auth.user.badges || []).map((b) => (typeof b === "string" ? b.toLowerCase() : (b.name || b.id || "").toLowerCase()))
  );
  // Guarantee first badge if user has at least 1 book
  if (library?.entries?.length > 0) {
    userBadgeNames.add("first steps");
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
      showToast("Profile changes saved to database! ✦");
    } catch (err) {
      showToast("Could not update profile: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-readora-cream py-10">
      <div className="page-container max-w-5xl">
        {/* PROFILE BANNER */}
        <div className="rounded-3xl border border-readora-gold/30 bg-gradient-to-r from-readora-purple via-readora-royal to-readora-plum p-8 text-readora-cream shadow-magical">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-readora-gold text-3xl font-bold text-readora-purple shadow-gold shrink-0">
              {auth.user.name?.charAt(0).toUpperCase() || "R"}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-bold text-readora-cream">
                  {auth.user.name}
                </h1>
                <span className="rounded-full bg-readora-gold px-3 py-0.5 text-xs font-bold text-readora-purple shadow-xs flex items-center gap-1">
                  <span>{currentRank.icon}</span> Level {currentLevel} • {currentRank.title}
                </span>
                {auth.user.role === "admin" && (
                  <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold text-black uppercase shadow-xs">
                    Admin
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-readora-cream/70">{auth.user.email}</p>
              {auth.user.favoriteQuote ? (
                <p className="mt-2 text-xs italic text-readora-gold">"{auth.user.favoriteQuote}"</p>
              ) : (
                <p className="mt-2 text-xs text-readora-cream/60 italic">"A reader lives a thousand lives before he dies."</p>
              )}
            </div>

            {/* STREAK & XP STATS */}
            <div className="flex gap-3 sm:flex-col shrink-0">
              <div className="rounded-2xl bg-white/10 p-3 text-center border border-white/10 backdrop-blur-xs">
                <p className="text-xs text-readora-gold font-bold">🔥 {auth.user.streak?.current || 1} Days</p>
                <p className="text-[10px] text-readora-cream/60">Reading Streak</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-center border border-white/10 backdrop-blur-xs">
                <p className="text-xs text-readora-gold font-bold">✦ {currentXp} XP</p>
                <p className="text-[10px] text-readora-cream/60">Lifetime XP</p>
              </div>
            </div>
          </div>

          {/* LEVEL PROGRESSION BAR */}
          <div className="mt-6 border-t border-white/15 pt-4">
            <div className="flex items-center justify-between text-xs font-bold text-readora-cream mb-1.5">
              <span>Current Rank: {currentRank.title}</span>
              <span>{nextRank ? `${currentXp} / ${nextRank.minXp} XP (${nextRank.minXp - currentXp} XP to Level ${currentLevel + 1})` : "Max Rank Achieved! 🏆"}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-readora-gold via-amber-300 to-readora-gold transition-all duration-700"
                style={{ width: `${levelProgressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* MAIN 2-COLUMN SECTION: SETTINGS FORM & BADGES/LEVEL GUIDE */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1.8fr]">
          {/* PROFILE SETTINGS FORM */}
          <form
            onSubmit={handleSave}
            className="rounded-3xl border border-readora-purple/10 bg-white/85 p-7 shadow-sm space-y-4 h-fit"
          >
            <div>
              <span className="text-[10px] uppercase font-bold text-readora-purple tracking-wider">Settings</span>
              <h2 className="font-display text-xl font-bold text-readora-purple">
                Edit Profile
              </h2>
            </div>

            <div>
              <label className="text-xs font-bold text-readora-purple block mb-1">Your Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none focus:border-readora-purple"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-readora-purple block mb-1">Bio / Reading Interests</label>
              <textarea
                rows="3"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Share your favorite authors, reading moods, or goals..."
                className="w-full rounded-2xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none resize-none focus:border-readora-purple"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-readora-purple block mb-1">
                Favorite Literary Quote
              </label>
              <input
                type="text"
                value={formData.favoriteQuote}
                onChange={(e) => setFormData({ ...formData, favoriteQuote: e.target.value })}
                placeholder="e.g. 'Not all those who wander are lost.'"
                className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none focus:border-readora-purple"
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
                className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none focus:border-readora-purple"
              />
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-readora-purple/10">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-readora-gold px-7 py-2.5 text-xs font-bold text-readora-purple shadow-gold hover:bg-readora-goldLight transition disabled:opacity-50"
              >
                {saving ? "Saving to Database..." : "Save Profile ✦"}
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

          {/* BADGES & LEVEL SYSTEM SHOWCASE */}
          <div className="rounded-3xl border border-readora-purple/10 bg-white/85 p-7 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-readora-purple/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-readora-purple tracking-wider">Achievements</span>
                <h3 className="font-display text-xl font-bold text-readora-purple">
                  Reader Badges & Rank Guide
                </h3>
              </div>

              {/* TOGGLE SUB-TABS */}
              <div className="flex items-center gap-1 rounded-full bg-readora-purple/5 p-1 border border-readora-purple/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveSubTab("all_badges")}
                  className={`rounded-full px-3 py-1 transition ${
                    activeSubTab === "all_badges"
                      ? "bg-readora-purple text-readora-cream shadow-xs"
                      : "text-readora-brown hover:text-readora-purple"
                  }`}
                >
                  Badges Roster ({MASTER_BADGES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("level_guide")}
                  className={`rounded-full px-3 py-1 transition ${
                    activeSubTab === "level_guide"
                      ? "bg-readora-purple text-readora-cream shadow-xs"
                      : "text-readora-brown hover:text-readora-purple"
                  }`}
                >
                  XP & Levels
                </button>
              </div>
            </div>

            {/* TAB 1: ALL BADGES ROSTER (UNLOCKED VS. ACHIEVABLE) */}
            {activeSubTab === "all_badges" && (
              <div className="space-y-4 animate-fade-in">
                <p className="text-xs text-readora-brown/75 leading-relaxed">
                  Earn badges by reading books, maintaining consistency, reviewing titles, and participating in buddy reads.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MASTER_BADGES.map((b) => {
                    const isUnlocked =
                      userBadgeNames.has(b.id) ||
                      userBadgeNames.has(b.name.toLowerCase()) ||
                      (b.id === "first_steps" && (library?.entries?.length > 0 || currentXp > 0));

                    return (
                      <div
                        key={b.id}
                        className={`rounded-2xl p-3.5 border transition ${
                          isUnlocked
                            ? "bg-gradient-to-br from-amber-50 to-white border-readora-gold shadow-xs"
                            : "bg-white/50 border-readora-purple/10 opacity-70 hover:opacity-90"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-xs ${
                              isUnlocked ? "bg-readora-gold/20 border border-readora-gold/40" : "bg-gray-100 grayscale"
                            }`}
                          >
                            {b.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="font-display text-xs font-bold text-readora-purple truncate">
                                {b.name}
                              </h4>
                              {isUnlocked ? (
                                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-bold shrink-0">
                                  ✓ Unlocked
                                </span>
                              ) : (
                                <span className="rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-[9px] font-bold shrink-0">
                                  🔒 Locked
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-readora-brown/80 mt-0.5 leading-snug">
                              {b.description}
                            </p>
                            <p className="text-[10px] font-semibold text-readora-gold mt-1.5 flex items-center gap-1">
                              <span>🎯 Goal:</span> {b.requirement}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: LEVEL PROGRESSION & HOW TO EARN XP */}
            {activeSubTab === "level_guide" && (
              <div className="space-y-6 animate-fade-in">
                {/* LEVEL RANKS TABLE */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-readora-purple mb-3">
                    Reader Rank Hierarchy
                  </h4>
                  <div className="space-y-2">
                    {READER_RANKS.map((rank) => {
                      const isCurrent = rank.level === currentLevel;
                      const isAchieved = currentLevel >= rank.level;

                      return (
                        <div
                          key={rank.level}
                          className={`flex items-center justify-between p-3 rounded-2xl border text-xs transition ${
                            isCurrent
                              ? "border-readora-gold bg-amber-50 shadow-xs"
                              : isAchieved
                              ? "border-emerald-200 bg-emerald-50/50"
                              : "border-readora-purple/10 bg-white/60 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{rank.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display font-bold text-readora-purple">
                                  Level {rank.level}: {rank.title}
                                </span>
                                {isCurrent && (
                                  <span className="rounded-full bg-readora-purple text-readora-cream text-[9px] font-bold px-2 py-0.5">
                                    Current Rank
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-readora-brown/70">
                                Required: {rank.minXp} - {rank.maxXp > 9000 ? "∞" : rank.maxXp} XP
                              </p>
                            </div>
                          </div>

                          <span className="font-bold text-readora-purple">
                            {isAchieved ? "✓ Completed" : `${rank.minXp - currentXp} XP Needed`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* HOW TO EARN XP BREAKDOWN */}
                <div className="rounded-2xl border border-readora-purple/10 bg-readora-cream/40 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-readora-purple mb-2 flex items-center gap-1.5">
                    <span>⚡</span> How to Earn XP & Level Up:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-readora-purple/5">
                      <span className="text-readora-brown">📖 Finish a Book in Library</span>
                      <span className="font-bold text-readora-purple bg-readora-purple/10 px-2 py-0.5 rounded-md">+100 XP</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-readora-purple/5">
                      <span className="text-readora-brown">⏱️ Log a Reading Session (30+ min)</span>
                      <span className="font-bold text-readora-purple bg-readora-purple/10 px-2 py-0.5 rounded-md">+25 XP</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-readora-purple/5">
                      <span className="text-readora-brown">✍️ Publish a Community Review</span>
                      <span className="font-bold text-readora-purple bg-readora-purple/10 px-2 py-0.5 rounded-md">+50 XP</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-readora-purple/5">
                      <span className="text-readora-brown">👥 Synchronous Buddy Read</span>
                      <span className="font-bold text-readora-purple bg-readora-purple/10 px-2 py-0.5 rounded-md">+75 XP</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-readora-purple/5 sm:col-span-2">
                      <span className="text-readora-brown">🏆 Reach a 100% Challenge Checkpoint</span>
                      <span className="font-bold text-readora-purple bg-readora-purple/10 px-2 py-0.5 rounded-md">+150 XP</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default Profile;
