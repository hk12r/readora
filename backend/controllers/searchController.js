const Book = require("../models/Book");
const { searchBooks: searchExternalBooks } = require("../services/bookApiService");

const searchBooks = async (req, res) => {
  try {
    const { q, external = "true" } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    const cleanQuery = q.trim();

    // 1. Search local Readora database
    const localBooks = await Book.find({
      $or: [
        { title: { $regex: cleanQuery, $options: "i" } },
        { author: { $regex: cleanQuery, $options: "i" } },
        { genre: { $regex: cleanQuery, $options: "i" } },
      ],
    }).limit(15);

    let externalBooks = [];
    if (external === "true") {
      try {
        const ext = await searchExternalBooks(cleanQuery);
        // Exclude books already in local results by title/isbn
        const localIsbns = new Set(localBooks.map((b) => b.isbn));
        const localTitles = new Set(localBooks.map((b) => b.title.toLowerCase()));

        externalBooks = ext.filter(
          (b) => !localIsbns.has(b.isbn) && !localTitles.has(b.title.toLowerCase())
        );
      } catch (extError) {
        console.warn("External book search warning:", extError.message);
      }
    }

    const combined = [...localBooks, ...externalBooks];

    res.json({
      query: cleanQuery,
      count: combined.length,
      localCount: localBooks.length,
      externalCount: externalBooks.length,
      books: combined,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  searchBooks,
};