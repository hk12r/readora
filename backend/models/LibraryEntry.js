const mongoose = require("mongoose");

const libraryEntrySchema = new mongoose.Schema(
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

    shelf: {
      type: String,
      required: true,
      enum: ["Want to Read", "Currently Reading", "Read", "DNF"],
      default: "Want to Read",
      index: true,
    },

    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },

    isOwned: {
      type: Boolean,
      default: false,
    },

    isUpNext: {
      type: Boolean,
      default: false,
    },

    upNextOrder: {
      type: Number,
      default: 0,
    },

    customShelves: {
      type: [String],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
    },

    currentPage: {
      type: Number,
      default: 0,
      min: 0,
    },

    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    startDate: {
      type: Date,
    },

    finishDate: {
      type: Date,
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: null,
    },

    reviewText: {
      type: String,
      default: "",
    },

    dnfReason: {
      type: String,
      enum: [
        "Too slow",
        "Too long",
        "Disliked characters",
        "Writing style didn't click",
        "Lost interest",
        "Too dense / difficult",
        "Disappointing plot",
        "Other",
        null,
      ],
      default: null,
    },

    dnfPage: {
      type: Number,
      default: null,
    },

    whyIReadThis: {
      type: String,
      enum: [
        "Friend Recommendation",
        "Author Interest",
        "BookTok / Social Media",
        "Movie / TV Adaptation",
        "Reading Challenge",
        "Random Discovery",
        "Cover Caught My Eye",
        "Gift",
        "Other",
        null,
      ],
      default: null,
    },

    personalNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

libraryEntrySchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model("LibraryEntry", libraryEntrySchema);