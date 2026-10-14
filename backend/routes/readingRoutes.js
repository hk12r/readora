const express = require("express");
const {
  createSession,
  getSessions,
  getGoals,
  updateGoals,
  getAnalytics,
  getReaderPersonality,
  getDnfAnalysis,
  pickNextBook,
  getRecommendations,
  getWorldMap,
  getTimeline,
  getYearInBooks,
} = require("../controllers/readingController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Journal / Sessions
router.post("/sessions", protect, createSession);
router.get("/sessions", protect, getSessions);

// Goals
router.get("/goals", protect, getGoals);
router.put("/goals", protect, updateGoals);

// Analytics
router.get("/analytics", protect, getAnalytics);

// Reader Personality Profile
router.get("/personality", protect, getReaderPersonality);

// DNF Analysis
router.get("/dnf-analysis", protect, getDnfAnalysis);

// Pick My Next Book ("Surprise Me")
router.post("/pick-next", protect, pickNextBook);

// Personalized Recommendations
router.get("/recommendations", protect, getRecommendations);

// Literary World Map
router.get("/world-map", protect, getWorldMap);

// Reading Timeline
router.get("/timeline", protect, getTimeline);

// Year in Books ("Spotify Wrapped")
router.get("/year-in-books", protect, getYearInBooks);

module.exports = router;
