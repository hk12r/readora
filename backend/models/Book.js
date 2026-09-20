const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  isbn: {
    type: String,
    required: true,
    unique: true
  },
  rating: {
    type: Number,
    default: 0
  },
  genre: {
    type: String
  },
  pages: {
    type: Number
  },
  cover: {
    type: String
  }
});

module.exports = mongoose.model("Book", bookSchema);