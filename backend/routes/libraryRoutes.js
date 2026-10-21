const express = require("express");

const {
  addToLibrary,
  getLibrary,
  updateLibraryEntry,
  removeFromLibrary,
  importLibrary,
  exportLibrary,
} = require("../controllers/libraryController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// GET - Get user's library
router.get("/", protect, getLibrary);

// POST - Add book to library
router.post("/", protect, addToLibrary);

// POST - Import CSV / Goodreads / Fable
router.post("/import", protect, importLibrary);

// GET - Export user library
router.get("/export", protect, exportLibrary);

// PUT - Update a library entry
router.put("/:id", protect, updateLibraryEntry);

// DELETE - Remove a book from library
router.delete("/:id", protect, removeFromLibrary);

module.exports = router;