const mongoose = require("mongoose");

const libraryEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    shelf: {
      type: String,
      required: true,
      enum: ["Want to Read", "Currently Reading", "Read"],
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LibraryEntry", libraryEntrySchema);