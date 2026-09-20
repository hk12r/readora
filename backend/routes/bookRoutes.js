const express = require("express");

const {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");

const router = express.Router();

// GET all books
router.get("/", getBooks);

// POST a new book
router.post("/", createBook);

// PUT - update a book
router.put("/:id", updateBook);

// DELETE - delete a book
router.delete("/:id", deleteBook);

module.exports = router;