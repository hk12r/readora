const express = require("express");
const {
  createBuddyRead,
  getBuddyReads,
  getBuddyReadById,
  joinBuddyRead,
  updateBuddyProgress,
  postBuddyMessage,
  createBookClub,
  getBookClubs,
  joinBookClub,
  voteForClubBook,
  getUserProfile,
  toggleFollowUser,
  getCommunityReaders,
} = require("../controllers/socialController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Buddy Reads
router.get("/buddy-reads", protect, getBuddyReads);
router.post("/buddy-reads", protect, createBuddyRead);
router.get("/buddy-reads/:id", protect, getBuddyReadById);
router.post("/buddy-reads/:id/join", protect, joinBuddyRead);
router.put("/buddy-reads/:id/progress", protect, updateBuddyProgress);
router.post("/buddy-reads/:id/messages", protect, postBuddyMessage);

// Book Clubs
router.get("/book-clubs", getBookClubs);
router.post("/book-clubs", protect, createBookClub);
router.post("/book-clubs/:id/join", protect, joinBookClub);
router.post("/book-clubs/:id/vote", protect, voteForClubBook);

// Readers & Profiles
router.get("/readers", getCommunityReaders);
router.get("/profile/:id", getUserProfile);
router.post("/follow/:id", protect, toggleFollowUser);

module.exports = router;
