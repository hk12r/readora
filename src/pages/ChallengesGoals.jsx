import React, { useState, useEffect } from "react";
import { useReadora } from "../context/ReadoraContext";
import api from "../services/api";
import confetti from "canvas-confetti";

function ChallengesGoals() {
  const { auth, openAuthModal, showToast } = useReadora();

  const [goals, setGoals] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInputs, setGoalInputs] = useState({
    annualTarget: 25,
    monthlyTarget: 2,
    pagesTarget: 7500,
    minutesTarget: 600,
  });

  // Create Challenge Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    type: "count",
    targetCount: 10,
    category: "Custom",
  });

  // Load goals & challenges
  const loadData = async () => {
    if (!auth.user) return;
    try {
      const [gData, cData] = await Promise.allSettled([
        api.getGoals(),
        api.getChallenges(),
      ]);

      if (gData.status === "fulfilled" && gData.value) {
        setGoals(gData.value.goals);
        setGoalInputs({
          annualTarget: gData.value.goals.annual?.target || 25,
          monthlyTarget: gData.value.goals.monthly?.target || 2,
          pagesTarget: gData.value.goals.pages?.target || 7500,
          minutesTarget: gData.value.goals.time?.target || 600,
        });
      }
      if (cData.status === "fulfilled" && cData.value) {
        setChallenges(cData.value);
      }
    } catch (err) {
      console.warn("Could not load challenges/goals:", err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [auth.user]);

  // Handle Save Goal Settings
  const handleSaveGoals = async (e) => {
    e.preventDefault();
    try {
      await api.updateGoals(goalInputs);
      showToast("Reading goals updated! ✦");
      setEditingGoal(false);
      await loadData();
    } catch (err) {
      showToast("Could not update goals: " + err.message, "error");
    }
  };

  // Handle Join Challenge
  const handleJoinChallenge = async (challengeId) => {
    if (!auth.user) {
      openAuthModal({ message: "Sign in to participate in reading challenges." });
      return;
    }
    try {
      await api.joinChallenge(challengeId);
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 } });
      showToast("Joined reading challenge! Good luck ✦");
      await loadData();
    } catch (err) {
      showToast("Could not join challenge: " + err.message, "error");
    }
  };

  // Handle Prompt Check-off
  const handleTogglePrompt = async (challengeId, promptId, completed) => {
    if (!auth.user) return;
    try {
      await api.updateChallengeProgress(challengeId, {
        promptId,
        completed: !completed,
      });
      confetti({ particleCount: 40, spread: 60 });
      showToast("Reading prompt checked off! +40 XP ✦");
      await loadData();
    } catch (err) {
      showToast("Could not update prompt", "error");
    }
  };

  // Handle Create Custom Challenge
  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!newChallenge.title.trim()) return;

    try {
      await api.createChallenge(newChallenge);
      showToast("New reading challenge published! ✦");
      setCreateModalOpen(false);
      setNewChallenge({
        title: "",
        description: "",
        type: "count",
        targetCount: 10,
        category: "Custom",
      });
      await loadData();
    } catch (err) {
      showToast("Could not create challenge: " + err.message, "error");
    }
  };

  return (
    <main className="min-h-screen bg-readora-cream py-10">
      <div className="page-container">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-readora-gold/30 bg-readora-gold/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-readora-purple">
              <span>🎯</span> Goals & Achievements
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold text-readora-purple sm:text-5xl">
              Challenges & Gamification
            </h1>
            <p className="mt-2 text-sm text-readora-brown/75 max-w-xl">
              Set personal targets, join community reading quests, unlock milestone badges, and earn
              reader XP.
            </p>
          </div>

          <button
            onClick={() => {
              if (!auth.user) {
                openAuthModal({ message: "Sign in to create reading challenges." });
                return;
              }
              setCreateModalOpen(true);
            }}
            className="rounded-full bg-readora-gold px-6 py-3 text-xs font-bold text-readora-purple shadow-gold hover:bg-readora-goldLight transition"
          >
            + Create Challenge
          </button>
        </div>

        {/* GAMIFICATION LEVEL & XP BAR */}
        {auth.user && (
          <div className="mt-8 rounded-3xl border border-readora-gold/30 bg-gradient-to-r from-readora-purple via-readora-royal to-readora-plum p-6 text-readora-cream shadow-magical">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-readora-gold font-display text-2xl font-bold text-readora-purple shadow">
                  {auth.user.level || 1}
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-readora-gold">
                    Reader Rank
                  </span>
                  <h3 className="font-display text-xl font-bold text-readora-cream">
                    Level {auth.user.level || 1} Scholar
                  </h3>
                  <p className="text-xs text-readora-cream/70">
                    {auth.user.xp || 0} Total Reading XP Earned
                  </p>
                </div>
              </div>

              {/* STREAK BADGE */}
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2 border border-white/15">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-xs font-bold text-readora-gold">
                    {auth.user.streak?.current || 1}-Day Streak
                  </p>
                  <p className="text-[10px] text-readora-cream/70">
                    Longest: {auth.user.streak?.longest || 1} days
                  </p>
                </div>
              </div>
            </div>

            {/* LEVEL PROGRESS BAR */}
            <div className="mt-5">
              <div className="flex justify-between text-xs font-semibold text-readora-cream/80">
                <span>Next Rank: Level {(auth.user.level || 1) + 1}</span>
                <span>{(auth.user.xp || 0) % 200} / 200 XP</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-readora-gold transition-all duration-500"
                  style={{ width: `${Math.min(100, (((auth.user.xp || 0) % 200) / 200) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 1: READING GOALS */}
        <section className="mt-12">
          <div className="flex items-center justify-between border-b border-readora-purple/10 pb-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-readora-purple">
                Active Reading Goals
              </h2>
              <p className="text-xs text-readora-brown/70">
                Track your pace against monthly, annual, and page count targets
              </p>
            </div>
            <button
              onClick={() => setEditingGoal(!editingGoal)}
              className="text-xs font-bold text-readora-gold hover:underline"
            >
              {editingGoal ? "Close Editor" : "Edit Goals ⚙"}
            </button>
          </div>

          {editingGoal && (
            <form
              onSubmit={handleSaveGoals}
              className="mt-6 rounded-3xl border border-readora-purple/10 bg-white/80 p-6 shadow-sm animate-scale-in"
            >
              <h3 className="font-display text-lg font-bold text-readora-purple">
                Configure Target Numbers
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label className="text-xs font-bold text-readora-purple block mb-1">
                    Annual Books Target
                  </label>
                  <input
                    type="number"
                    value={goalInputs.annualTarget}
                    onChange={(e) =>
                      setGoalInputs((prev) => ({ ...prev, annualTarget: e.target.value }))
                    }
                    className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-readora-purple block mb-1">
                    Monthly Books Target
                  </label>
                  <input
                    type="number"
                    value={goalInputs.monthlyTarget}
                    onChange={(e) =>
                      setGoalInputs((prev) => ({ ...prev, monthlyTarget: e.target.value }))
                    }
                    className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-readora-purple block mb-1">
                    Pages Goal
                  </label>
                  <input
                    type="number"
                    value={goalInputs.pagesTarget}
                    onChange={(e) =>
                      setGoalInputs((prev) => ({ ...prev, pagesTarget: e.target.value }))
                    }
                    className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-readora-purple block mb-1">
                    Reading Time (Mins)
                  </label>
                  <input
                    type="number"
                    value={goalInputs.minutesTarget}
                    onChange={(e) =>
                      setGoalInputs((prev) => ({ ...prev, minutesTarget: e.target.value }))
                    }
                    className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 rounded-full bg-readora-purple px-6 py-2.5 text-xs font-bold text-readora-cream shadow"
              >
                Save Goals ✦
              </button>
            </form>
          )}

          {/* GOAL METERS GRID */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "2026 Annual Goal",
                current: goals?.annual?.current ?? 8,
                target: goals?.annual?.target ?? 25,
                unit: "books",
                pct: goals?.annual?.percentage ?? 32,
                color: "from-amber-400 to-amber-600",
              },
              {
                title: "October Monthly Goal",
                current: goals?.monthly?.current ?? 2,
                target: goals?.monthly?.target ?? 3,
                unit: "books",
                pct: goals?.monthly?.percentage ?? 67,
                color: "from-readora-purple to-readora-royal",
              },
              {
                title: "Page Summit Goal",
                current: goals?.pages?.current ?? 2850,
                target: goals?.pages?.target ?? 7500,
                unit: "pages",
                pct: goals?.pages?.percentage ?? 38,
                color: "from-emerald-400 to-emerald-600",
              },
              {
                title: "Reading Consistency",
                current: goals?.streak?.current ?? 5,
                target: goals?.streak?.target ?? 30,
                unit: "days",
                pct: goals?.streak?.percentage ?? 17,
                color: "from-rose-400 to-rose-600",
              },
            ].map((g) => (
              <div
                key={g.title}
                className="rounded-3xl border border-readora-purple/10 bg-white/80 p-5 shadow-sm"
              >
                <div className="flex justify-between items-center text-xs font-bold text-readora-purple">
                  <span>{g.title}</span>
                  <span className="text-readora-gold">{g.pct}%</span>
                </div>
                <p className="mt-3 font-display text-2xl font-bold text-readora-purple">
                  {g.current}{" "}
                  <span className="text-xs font-normal text-readora-brown/70">
                    / {g.target} {g.unit}
                  </span>
                </p>
                <div className="mt-3 h-2 w-full rounded-full bg-readora-purple/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${g.color}`}
                    style={{ width: `${Math.min(100, g.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: READING CHALLENGES */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold text-readora-purple">
            Reading Challenges & Quests
          </h2>
          <p className="mt-1 text-xs text-readora-brown/70">
            Join community challenges, complete special prompts, and earn exclusive rewards.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {challenges.map((c) => {
              const participant = c.participants?.find(
                (p) => p.userId?.toString() === auth.user?._id?.toString()
              );
              const isJoined = !!participant;
              const progress = participant?.progress !== undefined ? participant.progress : (c.userProgress || 0);
              const pct = Math.min(100, Math.round((progress / c.targetCount) * 100));

              return (
                <div
                  key={c._id || c.title}
                  className="rounded-3xl border border-readora-purple/10 bg-white/80 p-6 shadow-sm transition hover:shadow-magical"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-readora-lavenderLight/50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-readora-purple">
                        {c.category}
                      </span>
                      <h3 className="mt-2 font-display text-xl font-bold text-readora-purple">
                        {c.title}
                      </h3>
                      <p className="mt-1 text-xs text-readora-brown/75">{c.description}</p>
                    </div>

                    {c.badgeReward && (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-readora-gold/20 text-2xl">
                        {c.badgeReward.icon}
                      </div>
                    )}
                  </div>

                  {/* PROMPTS CHECKLIST (IF PROMPT CHALLENGE) */}
                  {c.prompts && c.prompts.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-readora-purple/10 pt-3">
                      <p className="text-xs font-bold text-readora-purple">Prompt Checklist:</p>
                      {c.prompts.map((pr) => (
                        <div
                          key={pr.id || pr.text}
                          onClick={() => handleTogglePrompt(c._id, pr.id, pr.completed)}
                          className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-readora-purple/10 p-2 text-xs transition hover:bg-readora-lavenderLight/30"
                        >
                          <input
                            type="checkbox"
                            checked={pr.completed}
                            onChange={() => {}}
                            className="rounded text-readora-purple"
                          />
                          <span
                            className={
                              pr.completed
                                ? "line-through text-readora-brown/50"
                                : "text-readora-brown font-semibold"
                            }
                          >
                            {pr.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PROGRESS BAR & JOIN BUTTON */}
                  <div className="mt-5 border-t border-readora-purple/10 pt-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-bold text-readora-purple">
                        <span>
                          {progress} / {c.targetCount} Completed
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-readora-purple/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-readora-gold"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {!isJoined ? (
                      <button
                        onClick={() => handleJoinChallenge(c._id)}
                        className="rounded-full bg-readora-gold px-4 py-2 text-xs font-bold text-readora-purple shadow hover:bg-readora-goldLight"
                      >
                        Join Quest ✦
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-readora-purple">
                        ✓ Participating
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: MILESTONE BADGES */}
        {auth.user?.badges && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-bold text-readora-purple">
              Unlocked Badges & Trophies
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {auth.user.badges.map((b) => (
                <div
                  key={b.id || b.name}
                  className="rounded-2xl border border-readora-gold/30 bg-white/80 p-4 text-center shadow-sm"
                >
                  <span className="text-3xl">{b.icon || "🏆"}</span>
                  <h4 className="mt-2 font-display text-xs font-bold text-readora-purple">
                    {b.name}
                  </h4>
                  <p className="mt-1 text-[10px] text-readora-brown/65">{b.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* CREATE CHALLENGE MODAL */}
      {createModalOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-readora-plum/70 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-readora-gold/30 bg-readora-cream p-7 shadow-2xl animate-scale-in"
          >
            <h3 className="font-display text-2xl font-bold text-readora-purple">
              Create a Reading Challenge
            </h3>
            <p className="text-xs text-readora-brown/70 mt-1">
              Challenge yourself or invite fellow Readora members to read together.
            </p>

            <form onSubmit={handleCreateChallenge} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">Title</label>
                <input
                  required
                  type="text"
                  value={newChallenge.title}
                  onChange={(e) =>
                    setNewChallenge((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. 12 Classic Epics Revival"
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={newChallenge.description}
                  onChange={(e) =>
                    setNewChallenge((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="What is the goal of this challenge?"
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-readora-purple block mb-1">
                    Target Count
                  </label>
                  <input
                    type="number"
                    value={newChallenge.targetCount}
                    onChange={(e) =>
                      setNewChallenge((prev) => ({ ...prev, targetCount: e.target.value }))
                    }
                    className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-readora-purple block mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newChallenge.category}
                    onChange={(e) =>
                      setNewChallenge((prev) => ({ ...prev, category: e.target.value }))
                    }
                    placeholder="e.g. Genre, Author, Page"
                    className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs text-readora-brown outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-full border border-readora-purple/20 px-4 py-2 text-xs font-bold text-readora-brown"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-readora-purple px-5 py-2 text-xs font-bold text-readora-cream shadow hover:bg-readora-plum"
                >
                  Publish Challenge ✦
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default ChallengesGoals;
