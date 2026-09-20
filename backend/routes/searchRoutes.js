const express = require("express");
const { searchBooks } = require("../services/bookApiService");

const router = express.Router();

// GET - Search books using external Open Library API
router.get("/", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        message: "Please provide a search query using ?q=",
      });
    }

    const books = await searchBooks(q);

    res.json({
      query: q,
      results: books,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;