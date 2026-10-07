const express = require("express");

const {
  searchBooks,
} = require("../controllers/searchController");

const router = express.Router();

router.get("/", searchBooks);

module.exports = router;