const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
    },

    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
    },

    isbn: {
      type: String,
      required: [true, "ISBN is required"],
      unique: true,
      trim: true,
      validate: {
        validator: function (value) {
          // Supports ISBN-10 and ISBN-13
          const isbn10 = /^(?:\d{9}[\dXx])$/;
          const isbn13 = /^(?:\d{13})$/;

          const cleanedISBN = value.replace(/[-\s]/g, "");

          return isbn10.test(cleanedISBN) || isbn13.test(cleanedISBN);
        },
        message: "ISBN must be a valid ISBN-10 or ISBN-13",
      },
    },

    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot be greater than 5"],
    },

    genre: {
      type: String,
      required: [true, "Genre is required"],
      trim: true,
    },

    pages: {
      type: Number,
      required: [true, "Page count is required"],
      min: [1, "Page count must be greater than 0"],
    },

    cover: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Book", bookSchema);