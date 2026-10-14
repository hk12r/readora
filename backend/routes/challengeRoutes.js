const express = require("express");
const {
  getChallenges,
  createChallenge,
  joinChallenge,
  updateChallengeProgress,
} = require("../controllers/challengeController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getChallenges);
router.post("/", protect, createChallenge);
router.post("/:id/join", protect, joinChallenge);
router.put("/:id/progress", protect, updateChallengeProgress);

module.exports = router;
