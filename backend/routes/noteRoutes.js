const express = require("express");
const {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
} = require("../controllers/noteController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getNotes);
router.post("/", createNote);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);

module.exports = router;
