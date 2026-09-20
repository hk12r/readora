const express = require("express");

const {
  addToLibrary,
  getLibrary,
  updateLibraryEntry,
  removeFromLibrary,
} = require("../controllers/libraryController");

const router = express.Router();

// POST - Add a book to user's library
router.post("/", addToLibrary);

// GET - Get all library entries
router.get("/", getLibrary);

// PUT - Update a library entry
router.put("/:id", updateLibraryEntry);

// DELETE - Remove a book from library
router.delete("/:id", removeFromLibrary);

module.exports = router;