const mongoose = require("mongoose");

const bookNoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "Quote",
        "Chapter Note",
        "Character Analysis",
        "Theme & Idea",
        "Vocabulary / Passage",
      ],
      default: "Chapter Note",
      index: true,
    },

    title: {
      type: String,
      default: "",
    },

    content: {
      type: String,
      required: true,
    },

    chapterOrPage: {
      type: String,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BookNote", bookNoteSchema);
