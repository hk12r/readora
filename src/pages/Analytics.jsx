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

        {/* TAB 1: OVERVIEW & CHARTS */}
        {activeTab === "overview" && (
          <div className="mt-8 space-y-8 animate-fade-in">
            {/* STATS BANNER */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {[
                { label: "Books Finished", value: analytics?.overview?.totalBooksRead ?? library.shelves.read.length, icon: "📚" },
                { label: "Pages Explored", value: analytics?.overview?.totalPagesRead ?? 2450, icon: "📄" },
                { label: "Avg Rating", value: `★ ${analytics?.overview?.averageRating ?? 4.4}`, icon: "⭐" },
                { label: "Reading Pace", value: `${analytics?.overview?.readingPacePerHour ?? 42} p/hr`, icon: "⚡" },
                { label: "Current Streak", value: `${analytics?.overview?.currentStreak ?? 5} days`, icon: "🔥" },
                { label: "Longest Streak", value: `${analytics?.overview?.longestStreak ?? 14} days`, icon: "🏆" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-readora-purple/10 bg-white/80 p-4 shadow-sm"
                >
                  <span className="text-xl">{stat.icon}</span>
                  <p className="mt-2 font-display text-2xl font-bold text-readora-purple">
                    {stat.value}
                  </p>
                  <p className="text-[11px] font-semibold text-readora-brown/65">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* MONTHLY ACTIVITY BAR CHART */}
            <div className="rounded-3xl border border-readora-purple/10 bg-white/80 p-7 shadow-sm">
              <h2 className="font-display text-xl font-bold text-readora-purple">
                Monthly Reading Velocity
              </h2>
              <p className="text-xs text-readora-brown/65">
                Books and pages logged over the last 6 months
              </p>

              <div className="mt-8 flex h-48 items-end gap-3 sm:gap-6 border-b border-readora-purple/15 pb-2">
                {(analytics?.monthlyData || [
                  { month: "May", books: 2, pages: 640 },
                  { month: "Jun", books: 3, pages: 980 },
                  { month: "Jul", books: 1, pages: 350 },
                  { month: "Aug", books: 4, pages: 1250 },
                  { month: "Sep", books: 3, pages: 890 },
                  { month: "Oct", books: 5, pages: 1540 },
                ]).map((m) => {
                  const maxPages = 1800;
                  const heightPercent = Math.min(100, Math.round((m.pages / maxPages) * 100));

                  return (
                    <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-readora-purple">{m.pages}p</span>
                      <div className="w-full max-w-[48px] rounded-t-xl bg-readora-purple/15 h-36 flex items-end overflow-hidden">
                        <div
                          className="w-full rounded-t-xl bg-gradient-to-t from-readora-purple to-readora-royal transition-all duration-500"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-readora-brown">{m.month}</span>
                      <span className="text-[10px] text-readora-gold font-semibold">
                        {m.books} {m.books === 1 ? "book" : "books"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TWO COLUMN GRID: GENRES & RATINGS */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* GENRE DISTRIBUTION */}
              <div className="rounded-3xl border border-readora-purple/10 bg-white/80 p-7 shadow-sm">
                <h3 className="font-display text-lg font-bold text-readora-purple">
                  Genre Distribution
                </h3>
                <p className="text-xs text-readora-brown/65">Your literary palette</p>

                <div className="mt-5 space-y-3">
                  {Object.entries(
                    analytics?.genreDistribution || {
                      Fantasy: 6,
                      "Literary Fiction": 4,
                      Mystery: 3,
                      Romance: 2,
                      "Science Fiction": 2,
                    }
                  ).map(([genre, count]) => (
                    <div key={genre}>
                      <div className="flex justify-between text-xs font-semibold text-readora-purple">
                        <span>{genre}</span>
                        <span>{count} books</span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-readora-purple/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-readora-gold"
                          style={{ width: `${Math.min(100, count * 15)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RATING BREAKDOWN & FICTION RATIO */}
              <div className="rounded-3xl border border-readora-purple/10 bg-white/80 p-7 shadow-sm">
                <h3 className="font-display text-lg font-bold text-readora-purple">
                  Rating Distribution
                </h3>
                <p className="text-xs text-readora-brown/65">How critically you rate stories</p>

                <div className="mt-5 space-y-2.5">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = analytics?.ratingDistribution?.[stars] ?? (stars >= 4 ? 4 : 1);
                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs">
                        <span className="w-12 font-bold text-readora-gold">★ {stars}</span>
                        <div className="h-2 flex-1 rounded-full bg-readora-purple/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-readora-purple"
                            style={{ width: `${Math.min(100, count * 20)}%` }}
                          />
                        </div>
                        <span className="w-6 text-right font-semibold text-readora-brown">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 border-t border-readora-purple/10 pt-4 flex justify-between items-center text-xs font-bold text-readora-purple">
                  <span>Fiction vs Nonfiction:</span>
                  <span className="text-readora-gold">
                    {analytics?.fictionVsNonfiction?.fiction ?? 85}% Fiction •{" "}
                    {analytics?.fictionVsNonfiction?.nonfiction ?? 15}% Nonfiction
                  </span>
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
