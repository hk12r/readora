const Review = require("../models/Review");
const Book = require("../models/Book");

// Create a new review
const createReview = async (req, res) => {
  try {
    const { userId, bookId, rating, reviewText } = req.body;

    // Check whether the referenced book exists
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    // Create the review
    const review = new Review({
      userId,
      bookId,
      rating,
      reviewText,
    });

    const savedReview = await review.save();

    res.status(201).json(savedReview);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

module.exports = {
  createReview,
};