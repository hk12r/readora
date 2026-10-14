const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    page: { type: String, default: "" },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: [true, "Book ID is required"],
      index: true,
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be greater than 5"],
    },

    reviewText: {
      type: String,
      required: [true, "Review text is required"],
      trim: true,
      minlength: [3, "Review must contain at least 3 characters"],
      maxlength: [5000, "Review cannot exceed 5000 characters"],
    },

    hasSpoilers: {
      type: Boolean,
      default: false,
    },

    favoriteQuotes: {
      type: [quoteSchema],
      default: [],
    },

    chapterOrPageNote: {
      type: String,
      default: "",
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: {
      type: [commentSchema],
      default: [],
    },

    reported: {
      type: Boolean,
      default: false,
    },

    reportReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Review", reviewSchema);