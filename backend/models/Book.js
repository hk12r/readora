const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
      index: true,
    },

    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
      index: true,
    },

    isbn: {
      type: String,
      required: [true, "ISBN is required"],
      unique: true,
      trim: true,
      index: true,
    },

    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot be greater than 5"],
    },

    ratingsCount: {
      type: Number,
      default: 0,
    },

    genre: {
      type: String,
      required: [true, "Genre is required"],
      trim: true,
      index: true,
    },

    pages: {
      type: Number,
      required: [true, "Page count is required"],
      min: [1, "Page count must be greater than 0"],
    },

    cover: {
      type: String,
    },

    blurb: {
      type: String,
      default: "Every story opens a different door. Add this book to your reading journey and discover where its pages take you.",
    },

    publicationYear: {
      type: Number,
    },

    country: {
      type: String,
      default: "International",
    },

    pace: {
      type: String,
      enum: ["Fast", "Medium", "Slow"],
      default: "Medium",
    },

    moods: {
      type: [String],
      default: [],
      index: true,
    },

    isFiction: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

bookSchema.index({ title: "text", author: "text", genre: "text" });

module.exports = mongoose.model("Book", bookSchema);