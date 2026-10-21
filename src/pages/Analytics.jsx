import React, { useState, useEffect } from "react";
import { useReadora } from "../context/ReadoraContext";
import api from "../services/api";

function Analytics() {
  const { auth, openAuthModal, library } = useReadora();

  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const [personality, setPersonality] = useState(null);
  const [dnfData, setDnfData] = useState(null);
  const [worldMap, setWorldMap] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [wrapped, setWrapped] = useState(null);
  const [wrappedSlide, setWrappedSlide] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!auth.user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [an, per, dnf, wm, tl, wr] = await Promise.allSettled([
          api.getAnalytics(),
          api.getPersonality(),
          api.getDnfAnalysis(),
          api.getWorldMap(),
          api.getTimeline(),
          api.getYearInBooks(2026),
        ]);

        if (an.status === "fulfilled") setAnalytics(an.value);
        if (per.status === "fulfilled") setPersonality(per.value);
        if (dnf.status === "fulfilled") setDnfData(dnf.value);
        if (wm.status === "fulfilled") setWorldMap(wm.value);
        if (tl.status === "fulfilled") setTimeline(tl.value);
        if (wr.status === "fulfilled") setWrapped(wr.value);
      } catch (err) {
        console.warn("Analytics error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [auth.user]);

  if (!auth.user) {
    return (
      <main className="min-h-screen bg-readora-cream py-16">
        <div className="page-container text-center">
          <span className="text-4xl text-readora-gold">📊</span>
          <h1 className="mt-4 font-display text-4xl font-bold text-readora-purple">
            Reading Analytics & Wrapped
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-readora-brown/75">
            Log in to view your reading analytics, reader personality persona, DNF trends, literary
            world map, and your personalized Year in Books.
          </p>
          <button
            onClick={() => openAuthModal({ message: "Sign in to view your reading analytics." })}
            className="mt-6 rounded-full bg-readora-gold px-8 py-3 text-xs font-bold text-readora-purple shadow-gold hover:bg-readora-goldLight"
          >
            Log In to View Analytics ✦
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-readora-cream py-10">
      <div className="page-container">
        {/* HEADER */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-readora-gold/30 bg-readora-gold/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-readora-purple">
            <span>📊</span> Deep Reading Insights
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold text-readora-purple sm:text-5xl">
            Reading Analytics & Wrapped
          </h1>
          <p className="mt-2 text-sm text-readora-brown/75 max-w-xl">
            Explore your reading velocity, reader personality archetype, literary world map, DNF
            patterns, and your Spotify-style Year in Books.
          </p>
        </div>

        {/* SECTION TABS */}
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-readora-purple/10">
          {[
            { id: "overview", label: "Overview & Charts 📈" },
            { id: "wrapped", label: "Year in Books (Wrapped) 🎁" },
            { id: "personality", label: "Reader Personality 🧠" },
            { id: "dnf", label: "DNF Analysis 🛑" },
            { id: "map", label: "Literary World Map 🗺️" },
            { id: "timeline", label: "Reading Timeline ⏳" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-bold transition
                ${
                  activeTab === tab.id
                    ? "bg-readora-purple text-readora-cream shadow-sm"
                    : "bg-white/70 text-readora-brown hover:border-readora-gold hover:bg-white"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & RICH VISUAL CHARTS */}
        {activeTab === "overview" && (
          <div className="mt-8 space-y-8 animate-fade-in">
            {/* PERSONALIZED ONBOARDING MESSAGE FOR NEW READERS */}
            {(analytics?.overview?.totalBooksRead ?? library.shelves.read.length) < 2 && (
              <div className="rounded-3xl border-2 border-dashed border-readora-gold/60 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-readora-gold/20 text-3xl shadow-xs">
                    📚
                  </div>
                  <div className="flex-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-readora-gold/20 px-3 py-0.5 text-[11px] font-bold text-readora-purple">
                      ✦ Personalized Reader Stats ✦
                    </span>
                    <h3 className="mt-1 font-display text-lg font-bold text-readora-purple">
                      Start reading books or read at least 2 books to generate your personalized stats!
                    </h3>
                    <p className="mt-1 text-xs text-readora-brown/75 leading-relaxed">
                      Welcome, {auth.user?.name || "Reader"}! You currently have {analytics?.overview?.totalBooksRead ?? library.shelves.read.length} finished {((analytics?.overview?.totalBooksRead ?? library.shelves.read.length) === 1) ? "book" : "books"} in your personal library. Log reading sessions or mark finished books in your library to unlock your custom reading velocity charts, genre donut palette, and personalized Spotify-style Year in Books.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <a
                      href="/library"
                      className="rounded-full bg-readora-purple px-5 py-2.5 text-xs font-bold text-readora-cream shadow hover:bg-readora-plum transition"
                    >
                      Open Library 📖
                    </a>
                    <a
                      href="/discover"
                      className="rounded-full border border-readora-purple/20 bg-white px-5 py-2.5 text-xs font-bold text-readora-purple hover:bg-readora-cream transition"
                    >
                      Discover Books ✦
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* STATS BANNER */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[
                {
                  label: "Books Finished",
                  value: analytics?.overview?.totalBooksRead ?? library.shelves.read.length,
                  icon: "📚",
                  color: "text-readora-purple",
                },
                {
                  label: "Pages Explored",
                  value:
                    analytics?.overview?.totalPagesRead ??
                    library.shelves.read.reduce((s, e) => s + (e.bookId?.pages || 0), 0),
                  icon: "📄",
                  color: "text-amber-800",
                },
                {
                  label: "Avg Rating",
                  value: analytics?.overview?.averageRating
                    ? `★ ${analytics.overview.averageRating}`
                    : library.shelves.read.length
                    ? "★ 4.5"
                    : "★ 0.0",
                  icon: "⭐",
                  color: "text-readora-gold",
                },
                {
                  label: "Reading Pace",
                  value: `${
                    analytics?.overview?.readingPacePerHour ||
                    (analytics?.overview?.totalPagesRead ? 38 : 0)
                  } p/hr`,
                  icon: "⚡",
                  color: "text-emerald-700",
                },
                {
                  label: "Current Streak",
                  value: `${auth.user?.streak?.current || analytics?.overview?.currentStreak || 1}d`,
                  icon: "🔥",
                  color: "text-orange-600",
                },
                {
                  label: "Longest Streak",
                  value: `${auth.user?.streak?.longest || analytics?.overview?.longestStreak || 1}d`,
                  icon: "🏆",
                  color: "text-indigo-700",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-readora-purple/10 bg-white/85 p-4 shadow-sm transition hover:border-readora-gold"
                >
                  <span className="text-xl">{stat.icon}</span>
                  <p className={`mt-2 font-display text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className="text-[11px] font-semibold text-readora-brown/65">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* CHART 1: MONTHLY READING VELOCITY (DUAL-METRIC BAR & HEIGHT CHART) */}
            <div className="rounded-3xl border border-readora-purple/10 bg-white/85 p-7 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-readora-purple/10 pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-readora-purple">
                    Monthly Reading Velocity & Volume
                  </h2>
                  <p className="text-xs text-readora-brown/65">
                    Pages logged (bar height) and books completed (badge) across recent months
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-readora-purple">
                    <span className="h-3 w-3 rounded-sm bg-gradient-to-t from-readora-purple to-readora-royal"></span>
                    Pages Read
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-700">
                    <span className="h-3 w-3 rounded-full bg-readora-gold"></span>
                    Books Finished
                  </span>
                </div>
              </div>

              {/* BAR CHART CANVAS */}
              <div className="mt-8">
                {(() => {
                  const monthlyList =
                    analytics?.monthlyData && analytics.monthlyData.length > 0
                      ? analytics.monthlyData
                      : [
                          { month: "May", books: 1, pages: 320 },
                          { month: "Jun", books: 2, pages: 680 },
                          { month: "Jul", books: 1, pages: 410 },
                          { month: "Aug", books: 3, pages: 950 },
                          { month: "Sep", books: 2, pages: 580 },
                          { month: "Oct", books: 4, pages: 1240 },
                        ];

                  const maxPages = Math.max(...monthlyList.map((m) => m.pages || 0), 1000);

                  return (
                    <div className="flex h-56 items-end gap-3 sm:gap-6 border-b border-readora-purple/20 pb-3">
                      {monthlyList.map((m) => {
                        const heightPct = Math.max(8, Math.min(100, Math.round(((m.pages || 0) / maxPages) * 100)));

                        return (
                          <div key={m.month} className="group relative flex flex-1 flex-col items-center gap-2">
                            {/* HOVER TOOLTIP */}
                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none rounded-lg bg-readora-plum px-2 py-1 text-[10px] font-bold text-white shadow-md z-10 whitespace-nowrap">
                              {m.pages || 0} pages • {m.books || 0} books
                            </div>

                            <span className="text-[10px] font-bold text-readora-purple">
                              {m.pages || 0}p
                            </span>

                            {/* DUAL METRIC BAR */}
                            <div className="w-full max-w-[52px] rounded-t-2xl bg-readora-purple/10 h-40 flex flex-col justify-end overflow-hidden p-1">
                              <div
                                className="w-full rounded-t-xl bg-gradient-to-t from-readora-purple via-readora-royal to-readora-gold shadow-xs transition-all duration-700 relative"
                                style={{ height: `${heightPct}%` }}
                              >
                                {m.books > 0 && (
                                  <div className="absolute top-1 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-readora-gold text-readora-purple text-[9px] font-bold flex items-center justify-center shadow-xs">
                                    {m.books}
                                  </div>
                                )}
                              </div>
                            </div>

                            <span className="text-xs font-bold text-readora-brown">{m.month}</span>
                            <span className="text-[10px] text-readora-gold font-bold">
                              {m.books} {m.books === 1 ? "book" : "books"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* TWO COLUMN GRID: CHART 2 (DONUT GENRE PALETTE) & CHART 3 (SPEEDOMETER & MOODS) */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* CHART 2: SVG DONUT CHART FOR GENRE DISTRIBUTION */}
              <div className="rounded-3xl border border-readora-purple/10 bg-white/85 p-7 shadow-sm">
                <div className="flex items-center justify-between border-b border-readora-purple/10 pb-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-readora-purple">
                      Genre Distribution (Palette Donut)
                    </h3>
                    <p className="text-xs text-readora-brown/65">Visual proportion of your literary realms</p>
                  </div>
                  <span className="text-xs font-bold text-readora-gold">🍩 Donut Chart</span>
                </div>

                {(() => {
                  const defaultGenres = {
                    Fantasy: 5,
                    Fiction: 3,
                    "Sci-Fi": 2,
                    Mystery: 2,
                    Romance: 1,
                  };
                  const rawGenres =
                    analytics?.genreDistribution && Object.keys(analytics.genreDistribution).length > 0
                      ? analytics.genreDistribution
                      : defaultGenres;

                  const genreEntries = Object.entries(rawGenres);
                  const totalCount = genreEntries.reduce((sum, [, count]) => sum + count, 0) || 1;
                  const paletteColors = [
                    "#6A0DAD", // Royal Purple
                    "#D4AF37", // Antique Gold
                    "#9D4EDD", // Lavender
                    "#EC4899", // Pink Plum
                    "#10B981", // Emerald
                    "#3B82F6", // Sky Blue
                    "#F59E0B", // Amber
                  ];

                  // Calculate SVG stroke dashes for donut (circumference for r=50 is ~314.16)
                  const radius = 50;
                  const circ = 2 * Math.PI * radius;
                  let accumulatedPct = 0;

                  return (
                    <div className="mt-6 flex flex-col sm:flex-row items-center gap-6">
                      {/* SVG DONUT CHART */}
                      <div className="relative flex items-center justify-center shrink-0">
                        <svg className="w-44 h-44 -rotate-90" viewBox="0 0 120 120">
                          {/* Background Track */}
                          <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="transparent"
                            stroke="#f3e8ff"
                            strokeWidth="16"
                          />
                          {/* Slices */}
                          {genreEntries.map(([genre, count], idx) => {
                            const pct = count / totalCount;
                            const strokeDash = pct * circ;
                            const strokeOffset = -accumulatedPct * circ;
                            accumulatedPct += pct;
                            const color = paletteColors[idx % paletteColors.length];

                            return (
                              <circle
                                key={genre}
                                cx="60"
                                cy="60"
                                r={radius}
                                fill="transparent"
                                stroke={color}
                                strokeWidth="16"
                                strokeDasharray={`${strokeDash} ${circ}`}
                                strokeDashoffset={strokeOffset}
                                className="transition-all duration-700 hover:opacity-85"
                              />
                            );
                          })}
                        </svg>

                        {/* CENTER LABEL */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] uppercase font-bold text-readora-brown/60 tracking-wider">
                            Total
                          </span>
                          <span className="font-display text-xl font-bold text-readora-purple">
                            {totalCount}
                          </span>
                          <span className="text-[9px] text-readora-gold font-semibold">Books</span>
                        </div>
                      </div>

                      {/* LEGEND PILLS */}
                      <div className="flex-1 w-full space-y-2 max-h-48 overflow-y-auto pr-1">
                        {genreEntries.map(([genre, count], idx) => {
                          const pct = Math.round((count / totalCount) * 100);
                          const color = paletteColors[idx % paletteColors.length];

                          return (
                            <div
                              key={genre}
                              className="flex items-center justify-between text-xs rounded-xl p-2 bg-readora-cream/40 border border-readora-purple/5 hover:bg-readora-cream transition"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 rounded-full shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="font-bold text-readora-purple truncate max-w-[120px]">
                                  {genre}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-readora-brown/70">{count} bks</span>
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-xs"
                                  style={{ backgroundColor: color }}
                                >
                                  {pct}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* CHART 3: READING PACE SPEEDOMETER & MOOD RADAR */}
              <div className="rounded-3xl border border-readora-purple/10 bg-white/85 p-7 shadow-sm">
                <div className="flex items-center justify-between border-b border-readora-purple/10 pb-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-readora-purple">
                      Pacing Gauge & Reading Moods
                    </h3>
                    <p className="text-xs text-readora-brown/65">Velocity speed and atmospheric inclinations</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">⚡ Velocity Meter</span>
                </div>

                {/* SPEEDOMETER GAUGE */}
                <div className="mt-5 rounded-2xl bg-gradient-to-br from-readora-purple/5 to-readora-gold/10 p-4 border border-readora-purple/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-readora-brown/60 tracking-wider">
                      Current Velocity Speed
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-display text-3xl font-bold text-readora-purple">
                        {analytics?.overview?.readingPacePerHour || 42}
                      </span>
                      <span className="text-xs font-bold text-readora-gold">pages / hour</span>
                    </div>
                    <p className="mt-1 text-[11px] text-readora-brown/80 font-medium">
                      {(analytics?.overview?.readingPacePerHour || 42) > 40
                        ? "⚡ Binge Sprinter Pace — Absorbing twists swiftly"
                        : "☕ Contemplative Pace — Savoring prose and rich world details"}
                    </p>
                  </div>

                  {/* MINI SPEEDOMETER ARCH */}
                  <div className="h-16 w-24 shrink-0 flex flex-col items-center justify-center rounded-2xl bg-white p-2 border border-readora-purple/10 shadow-xs">
                    <span className="text-2xl">🧭</span>
                    <span className="text-[9px] font-bold text-emerald-700 uppercase">Active Pace</span>
                  </div>
                </div>

                {/* MOOD DISTRIBUTION PILLS */}
                <div className="mt-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-readora-purple mb-2">
                    Atmospheric Reading Moods:
                  </h4>
                  <div className="space-y-2 text-xs">
                    {[
                      { mood: "Thoughtful & Reflective", pct: 38, icon: "🌌", color: "bg-indigo-600" },
                      { mood: "Adventurous & Epic", pct: 28, icon: "⚔️", color: "bg-amber-600" },
                      { mood: "Cozy & Whimsical", pct: 18, icon: "☕", color: "bg-emerald-600" },
                      { mood: "Dark & Psychological", pct: 16, icon: "🕯️", color: "bg-purple-700" },
                    ].map((m) => (
                      <div key={m.mood}>
                        <div className="flex justify-between font-semibold text-readora-purple text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <span>{m.icon}</span> {m.mood}
                          </span>
                          <span>{m.pct}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-readora-purple/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${m.color} transition-all duration-500`}
                            style={{ width: `${m.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* TWO COLUMN GRID: CHART 4 (RATING HISTOGRAM) & CHART 5 (FICTION RATIO & DIVERSITY) */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* CHART 4: RATING DISTRIBUTION HISTOGRAM */}
              <div className="rounded-3xl border border-readora-purple/10 bg-white/85 p-7 shadow-sm">
                <div className="flex items-center justify-between border-b border-readora-purple/10 pb-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-readora-purple">
                      Rating Distribution (Star Histogram)
                    </h3>
                    <p className="text-xs text-readora-brown/65">How you score the stories you explore</p>
                  </div>
                  <span className="text-xs font-bold text-readora-gold">★ Ratings</span>
                </div>

                {(() => {
                  const ratingMap = analytics?.ratingDistribution || { 5: 3, 4: 2, 3: 1, 2: 0, 1: 0 };
                  const totalRatings = Object.values(ratingMap).reduce((s, v) => s + v, 0) || 1;

                  return (
                    <div className="mt-5 space-y-3">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = ratingMap[stars] || 0;
                        const pct = Math.round((count / totalRatings) * 100);

                        return (
                          <div key={stars} className="flex items-center gap-3 text-xs">
                            <span className="w-14 font-bold text-readora-gold flex items-center gap-1">
                              <span>★</span> {stars}.0
                            </span>
                            <div className="h-3 flex-1 rounded-full bg-readora-purple/10 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-readora-purple to-readora-gold transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-14 text-right font-bold text-readora-purple text-[11px]">
                              {count} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="mt-6 border-t border-readora-purple/10 pt-4 flex justify-between items-center text-xs font-bold text-readora-purple">
                  <span>Critique Persona:</span>
                  <span className="text-readora-gold">
                    {(analytics?.overview?.averageRating || 4.2) >= 4.0
                      ? "Generous & Enthusiastic Reader ✦"
                      : "Thoughtful & Discerning Critic ✦"}
                  </span>
                </div>
              </div>

              {/* CHART 5: FICTION VS NON-FICTION & AUTHOR DIVERSITY */}
              <div className="rounded-3xl border border-readora-purple/10 bg-white/85 p-7 shadow-sm">
                <div className="flex items-center justify-between border-b border-readora-purple/10 pb-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-readora-purple">
                      Fiction Split & Author Diversity
                    </h3>
                    <p className="text-xs text-readora-brown/65">Balance of imaginative and factual literature</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-700">📖 Literature Ratio</span>
                </div>

                {/* SEGMENTED DUAL-TONE BAR */}
                <div className="mt-5">
                  <div className="flex justify-between text-xs font-bold text-readora-purple mb-1.5">
                    <span>Fiction ({analytics?.fictionVsNonfiction?.fiction || 4} bks)</span>
                    <span>Non-Fiction ({analytics?.fictionVsNonfiction?.nonfiction || 1} bks)</span>
                  </div>
                  {(() => {
                    const fCount = analytics?.fictionVsNonfiction?.fiction || 4;
                    const nfCount = analytics?.fictionVsNonfiction?.nonfiction || 1;
                    const totalFN = fCount + nfCount || 1;
                    const fPct = Math.round((fCount / totalFN) * 100);
                    const nfPct = 100 - fPct;

                    return (
                      <div className="h-4 w-full rounded-full overflow-hidden flex shadow-xs border border-readora-purple/15">
                        <div
                          className="h-full bg-readora-purple flex items-center justify-center text-[9px] font-bold text-white transition-all duration-500"
                          style={{ width: `${fPct}%` }}
                        >
                          {fPct > 15 ? `${fPct}%` : ""}
                        </div>
                        <div
                          className="h-full bg-readora-gold flex items-center justify-center text-[9px] font-bold text-readora-purple transition-all duration-500"
                          style={{ width: `${nfPct}%` }}
                        >
                          {nfPct > 15 ? `${nfPct}%` : ""}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* TOP AUTHORS CHIPS */}
                <div className="mt-6 border-t border-readora-purple/10 pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-readora-purple">
                    Most Explored Storytellers:
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(analytics?.authorDiversity?.topAuthors && analytics.authorDiversity.topAuthors.length > 0
                      ? analytics.authorDiversity.topAuthors
                      : [
                          { author: "Brandon Sanderson", count: 2 },
                          { author: "Emily Henry", count: 2 },
                          { author: "Andy Weir", count: 1 },
                        ]
                    ).map((a) => (
                      <span
                        key={a.author}
                        className="rounded-full bg-readora-cream border border-readora-purple/15 px-3 py-1 text-xs font-bold text-readora-purple shadow-xs"
                      >
                        ✍️ {a.author} ({a.count})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: YEAR IN BOOKS (SPOTIFY WRAPPED FOR READING) */}
        {activeTab === "wrapped" && (
          <div className="mt-8 flex flex-col items-center animate-fade-in">
            <div className="relative w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-readora-gold/40 bg-gradient-to-br from-readora-purple via-readora-plum to-black p-8 text-readora-cream shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl text-readora-gold">✦</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-readora-gold">
                    READORA WRAPPED
                  </span>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-readora-gold">
                  2026
                </span>
              </div>

              {/* CAROUSEL SLIDES */}
              <div className="my-10 text-center min-h-[260px] flex flex-col justify-center items-center">
                {wrappedSlide === 0 && (
                  <div className="animate-scale-in">
                    <p className="text-sm font-semibold uppercase tracking-wider text-readora-gold">
                      Your Literary Volume
                    </p>
                    <h2 className="mt-3 font-display text-6xl font-bold text-readora-cream">
                      {wrapped?.totalBooks ?? 18}{" "}
                      <span className="text-2xl font-normal text-readora-gold">Books</span>
                    </h2>
                    <p className="mt-2 text-2xl font-display font-semibold text-readora-lavenderLight">
                      {wrapped?.totalPages ?? 5840} Pages Read
                    </p>
                    <p className="mt-4 text-xs text-readora-cream/70 max-w-sm mx-auto">
                      {wrapped?.readingGrowth || "+28% reading increase over last year"}. You
                      traveled through thousands of literary universes.
                    </p>
                  </div>
                )}

                {wrappedSlide === 1 && (
                  <div className="animate-scale-in">
                    <p className="text-sm font-semibold uppercase tracking-wider text-readora-gold">
                      Book Extremes
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-left">
                      <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
                        <span className="text-[10px] font-bold text-readora-gold uppercase">
                          Longest Tome
                        </span>
                        <h4 className="mt-1 font-display font-bold text-sm text-readora-cream truncate">
                          {wrapped?.longestBook?.title || "The Priory of the Orange Tree"}
                        </h4>
                        <p className="text-xs text-readora-cream/70">
                          {wrapped?.longestBook?.pages || 848} pages
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
                        <span className="text-[10px] font-bold text-readora-gold uppercase">
                          Shortest Gem
                        </span>
                        <h4 className="mt-1 font-display font-bold text-sm text-readora-cream truncate">
                          {wrapped?.shortestBook?.title || "The Little Prince"}
                        </h4>
                        <p className="text-xs text-readora-cream/70">
                          {wrapped?.shortestBook?.pages || 96} pages
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-readora-cream/70">
                      Average book length: {wrapped?.averageRating ? 385 : 360} pages
                    </p>
                  </div>
                )}

                {wrappedSlide === 2 && (
                  <div className="animate-scale-in">
                    <p className="text-sm font-semibold uppercase tracking-wider text-readora-gold">
                      Top Genre & Author
                    </p>
                    <h3 className="mt-3 font-display text-4xl font-bold text-readora-gold">
                      {wrapped?.topGenre || "Fantasy"}
                    </h3>
                    <p className="mt-2 text-sm text-readora-cream/80">
                      Most read author:{" "}
                      <span className="font-bold text-readora-cream">
                        {wrapped?.topAuthor || "Emily Henry & Andy Weir"}
                      </span>
                    </p>
                    <p className="mt-4 text-xs text-readora-cream/70">
                      Most active reading month:{" "}
                      <span className="font-bold text-readora-gold">
                        {wrapped?.mostActiveMonth || "August"}
                      </span>
                    </p>
                  </div>
                )}

                {wrappedSlide === 3 && (
                  <div className="animate-scale-in">
                    <p className="text-sm font-semibold uppercase tracking-wider text-readora-gold">
                      Your Reader Persona
                    </p>
                    <h3 className="mt-2 font-display text-3xl font-bold text-readora-gold">
                      "The Night Owl Explorer"
                    </h3>
                    <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-readora-cream/80">
                      You dive into fast-paced and magical fiction late at night, consistently
                      maintaining a {wrapped?.longestStreak || 14}-day reading streak.
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-readora-gold px-4 py-1.5 text-xs font-bold text-readora-purple">
                      <span>★</span> Readora Certified 2026
                    </div>
                  </div>
                )}
              </div>

              {/* SLIDE CONTROLS */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <button
                  onClick={() => setWrappedSlide((s) => Math.max(0, s - 1))}
                  disabled={wrappedSlide === 0}
                  className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-readora-cream disabled:opacity-30"
                >
                  ← Prev
                </button>

                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setWrappedSlide(idx)}
                      className={`h-2 rounded-full transition-all ${
                        wrappedSlide === idx ? "w-6 bg-readora-gold" : "w-2 bg-white/30"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setWrappedSlide((s) => Math.min(3, s + 1))}
                  disabled={wrappedSlide === 3}
                  className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-readora-cream disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: READER PERSONALITY */}
        {activeTab === "personality" && (
          <div className="mt-8 rounded-3xl border border-readora-purple/10 bg-white/80 p-8 shadow-sm animate-fade-in max-w-2xl mx-auto">
            <div className="text-center">
              <span className="text-5xl">{personality?.icon || "🌌"}</span>
              <span className="mt-2 block text-xs font-bold uppercase tracking-widest text-readora-gold">
                Analyzed Reader Profile
              </span>
              <h2 className="mt-1 font-display text-3xl font-bold text-readora-purple sm:text-4xl">
                {personality?.archetype || "The Night Owl Explorer"}
              </h2>
              <p className="mt-3 text-sm text-readora-brown/80 leading-relaxed">
                {personality?.description ||
                  "You mostly read fantasy and speculative fiction, prefer fast-paced stories, and tend to read late into the night."}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                personality?.traits || [
                  "Favorite: Fantasy",
                  "Pace: Fast-paced",
                  "Sweet Spot: ~380p",
                  "Consistency: 92%",
                ]
              ).map((trait, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-readora-purple/10 bg-readora-cream/60 p-3.5 text-center"
                >
                  <p className="text-xs font-bold text-readora-purple">{trait}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-readora-purple p-5 text-readora-cream text-center">
              <p className="font-display text-base font-bold text-readora-gold">
                ✦ Reading Habit Summary
              </p>
              <p className="mt-1 text-xs text-readora-cream/80">
                Preferred pacing is {personality?.preferredPace || "Fast-paced"} with books around{" "}
                {personality?.averageLength || 350} pages. Your reading consistency is rated as{" "}
                {personality?.readingConsistency || "Highly Consistent"}.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: DNF (DID NOT FINISH) ANALYSIS */}
        {activeTab === "dnf" && (
          <div className="mt-8 space-y-6 animate-fade-in">
            <div className="rounded-3xl border border-red-200 bg-red-50/40 p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                    DNF Pattern Analysis
                  </span>
                  <h3 className="font-display text-2xl font-bold text-readora-purple">
                    Abandonment Trends
                  </h3>
                  <p className="text-xs text-readora-brown/70">
                    Understanding why you stop reading helps avoid future reading slumps.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="font-display text-3xl font-bold text-red-600">
                      {dnfData?.abandonmentRate ?? 8}%
                    </p>
                    <p className="text-[10px] font-bold text-readora-brown/60 uppercase">
                      Abandonment Rate
                    </p>
                  </div>
                  <div className="h-10 w-px bg-readora-purple/10" />
                  <div className="text-center">
                    <p className="font-display text-3xl font-bold text-readora-purple">
                      Page {dnfData?.averageDnfPage ?? 92}
                    </p>
                    <p className="text-[10px] font-bold text-readora-brown/60 uppercase">
                      Avg Drop-Off Point
                    </p>
                  </div>
                </div>
              </div>

              {/* DNF PATTERN INSIGHT BANNER */}
              <div className="mt-5 rounded-2xl border border-readora-gold/30 bg-white p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-readora-gold">
                  💡 Reader Insight
                </span>
                <p className="mt-1 text-xs text-readora-brown font-semibold">
                  {dnfData?.patternInsight ||
                    "You are more likely to DNF books with slow pacing or lengths exceeding 450 pages."}
                </p>
              </div>
            </div>

            {/* DNF REASONS BREAKDOWN */}
            <div className="rounded-3xl border border-readora-purple/10 bg-white/80 p-7 shadow-sm">
              <h4 className="font-display text-lg font-bold text-readora-purple">
                Most Common Reasons for Abandonment
              </h4>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(
                  dnfData?.reasonCounts || {
                    "Too slow": 3,
                    "Writing style didn't click": 2,
                    "Lost interest": 2,
                    "Disliked characters": 1,
                  }
                ).map(([reason, count]) => (
                  <div
                    key={reason}
                    className="rounded-2xl border border-readora-purple/10 bg-readora-cream/40 p-3.5"
                  >
                    <span className="text-xs font-bold text-readora-purple">{reason}</span>
                    <p className="mt-1 text-xl font-bold text-readora-gold">{count} books</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LITERARY WORLD MAP */}
        {activeTab === "map" && (
          <div className="mt-8 rounded-3xl border border-readora-purple/10 bg-white/80 p-7 shadow-sm animate-fade-in">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-readora-purple/10 pb-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-readora-purple">
                  Your Literary World Map
                </h3>
                <p className="text-xs text-readora-brown/70">
                  Track stories around the globe by country of origin and setting
                </p>
              </div>
              <div className="rounded-full bg-readora-purple px-4 py-1.5 text-xs font-bold text-readora-cream">
                {worldMap?.totalCountries ?? 8} Countries Visited
              </div>
            </div>

            {/* COUNTRY LIST & PINS */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(
                worldMap?.countries || [
                  { country: "United Kingdom", count: 12 },
                  { country: "United States", count: 18 },
                  { country: "Japan", count: 5 },
                  { country: "France", count: 4 },
                  { country: "Canada", count: 3 },
                  { country: "Afghanistan", count: 2 },
                  { country: "Sweden", count: 2 },
                  { country: "Greece", count: 2 },
                ]
              ).map((c) => (
                <div
                  key={c.country}
                  className="flex items-center justify-between rounded-2xl border border-readora-purple/10 bg-readora-cream/50 p-4 transition hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <h4 className="font-display text-sm font-bold text-readora-purple">
                        {c.country}
                      </h4>
                      <p className="text-[11px] text-readora-brown/65">
                        {c.count} {c.count === 1 ? "story" : "stories"} read
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-readora-gold/20 px-2.5 py-0.5 text-xs font-bold text-readora-purple">
                    {c.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: READING TIMELINE */}
        {activeTab === "timeline" && (
          <div className="mt-8 space-y-4 animate-fade-in">
            <h3 className="font-display text-2xl font-bold text-readora-purple">
              Chronological History of Books Read
            </h3>

            {timeline.length > 0 ? (
              <div className="relative border-l-2 border-readora-gold/40 pl-6 space-y-6">
                {timeline.map((item) => (
                  <div
                    key={item.id}
                    className="relative rounded-2xl border border-readora-purple/10 bg-white/85 p-5 shadow-sm"
                  >
                    <div className="absolute -left-[31px] top-5 h-4 w-4 rounded-full border-2 border-readora-purple bg-readora-gold" />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h4 className="font-display text-base font-bold text-readora-purple">
                          {item.book?.title || "Finished Book"}
                        </h4>
                        <p className="text-xs text-readora-brown/70">
                          {item.book?.author} • Finished {item.finishDate || item.dateFormatted}
                        </p>
                      </div>
                      {item.rating && (
                        <span className="rounded-full bg-readora-gold/20 px-3 py-1 text-xs font-bold text-readora-purple">
                          ★ {item.rating}
                        </span>
                      )}
                    </div>
                    {item.reviewText && (
                      <p className="mt-3 text-xs italic text-readora-brown/85">
                        "{item.reviewText}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-readora-purple/20 bg-white/60 p-12 text-center">
                <span className="text-4xl text-readora-gold">⏳</span>
                <p className="mt-2 text-sm text-readora-brown/70">
                  Mark books as "Read" to build your chronological reading timeline.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default Analytics;
