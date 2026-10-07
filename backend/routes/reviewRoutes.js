const express = require("express");

const {
  createReview,
} = require("../controllers/reviewController");

const router = express.Router();

// POST - create a new review
router.post("/", createReview);

module.exports = router;