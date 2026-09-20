const LibraryEntry = require("../models/LibraryEntry");

// POST - Add a book to user's library
const addToLibrary = async (req, res) => {
  try {
    const entry = new LibraryEntry(req.body);
    const savedEntry = await entry.save();

    res.status(201).json(savedEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET - Get all library entries
const getLibrary = async (req, res) => {
  try {
    const entries = await LibraryEntry.find().populate("bookId");

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT - Update a library entry
const updateLibraryEntry = async (req, res) => {
  try {
    const updatedEntry = await LibraryEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedEntry) {
      return res.status(404).json({
        message: "Library entry not found",
      });
    }

    res.json(updatedEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE - Remove a book from library
const removeFromLibrary = async (req, res) => {
  try {
    const deletedEntry = await LibraryEntry.findByIdAndDelete(req.params.id);

    if (!deletedEntry) {
      return res.status(404).json({
        message: "Library entry not found",
      });
    }

    res.json({
      message: "Book removed from library successfully",
      entry: deletedEntry,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  addToLibrary,
  getLibrary,
  updateLibraryEntry,
  removeFromLibrary,
};