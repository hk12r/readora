const BookNote = require("../models/BookNote");

// Create note
const createNote = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      bookId,
      type = "Chapter Note",
      title = "",
      content,
      chapterOrPage = "",
      tags = [],
    } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const note = new BookNote({
      userId,
      bookId,
      type,
      title,
      content,
      chapterOrPage,
      tags,
    });

    await note.save();
    await note.populate("bookId", "title author cover");

    res.status(201).json(note);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET notes with filters (by book, by type, search)
const getNotes = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookId, type, search } = req.query;

    const query = { userId };
    if (bookId) query.bookId = bookId;
    if (type && type !== "All") query.type = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const notes = await BookNote.find(query)
      .populate("bookId", "title author cover")
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update note
const updateNote = async (req, res) => {
  try {
    const userId = req.user._id;
    const note = await BookNote.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true }
    ).populate("bookId", "title author cover");

    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete note
const deleteNote = async (req, res) => {
  try {
    const userId = req.user._id;
    const note = await BookNote.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
};
