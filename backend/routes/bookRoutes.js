const express = require("express");

const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  seedBooks,
} = require("../controllers/bookController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/roleMiddleware");

const router = express.Router();

// GET all books with filters
router.get("/", getBooks);

// POST trigger manual seed
router.post("/seed", protect, adminOnly, seedBooks);

// GET single book
router.get("/:id", getBookById);

// POST a new book
router.post("/", protect, createBook);

// PUT - update a book (admin or authenticated)
router.put("/:id", protect, updateBook);

// DELETE - delete a book (admin only)
router.delete("/:id", protect, adminOnly, deleteBook);

module.exports = router;
