const express = require("express");

const {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");

const { validateBook } = require("../middleware/validationMiddleware");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/roleMiddleware");

const router = express.Router();

// GET all books
router.get("/", getBooks);

// POST a new book
router.post("/", protect, validateBook, createBook);

// PUT - update a book
router.put("/:id", updateBook);

// DELETE - delete a book
router.delete("/:id", deleteBook);

module.exports = router;
router.get("/admin-test", protect, adminOnly, (req, res) => {
  res.json({
    message: "Admin access granted",
  });
});