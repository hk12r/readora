const express = require("express");

const {
  createReview,
  getBookReviews,
  toggleLikeReview,
  addCommentToReview,
  getActivityFeed,
  reportReview,
} = require("../controllers/reviewController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// GET community activity feed
router.get("/feed", getActivityFeed);

// GET reviews for specific book
router.get("/book/:bookId", getBookReviews);

// POST - create a new review
router.post("/", protect, createReview);

// POST - like/unlike review
router.post("/:id/like", protect, toggleLikeReview);

// POST - comment on review
router.post("/:id/comment", protect, addCommentToReview);

// POST - report review
router.post("/:id/report", protect, reportReview);

module.exports = router;