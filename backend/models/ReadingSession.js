const mongoose = require("mongoose");

const readingSessionSchema = new mongoose.Schema(
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

    date: {
      type: Date,
      default: Date.now,
      index: true,
    },

    durationMinutes: {
      type: Number,
      required: true,
      default: 15,
      min: 1,
    },

    pagesRead: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
    },

    startPage: {
      type: Number,
      default: 0,
    },

    endPage: {
      type: Number,
      default: 0,
    },

    mood: {
      type: String,
      default: "Thoughtful",
    },

    thoughts: {
      type: String,
      default: "",
    },

    favoriteQuote: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ReadingSession", readingSessionSchema);
