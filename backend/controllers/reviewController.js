const Review = require("../models/Review");
const Book = require("../models/Book");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Create a new review with ratings, quotes, spoilers
const createReview = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : req.body.userId;
    const {
      bookId,
      rating,
      reviewText,
      hasSpoilers = false,
      favoriteQuotes = [],
      chapterOrPageNote = "",
    } = req.body;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const review = new Review({
      userId,
      bookId,
      rating: parseFloat(rating),
      reviewText,
      hasSpoilers,
      favoriteQuotes,
      chapterOrPageNote,
    });

    const savedReview = await review.save();
    await savedReview.populate("userId", "name avatar");
    await savedReview.populate("bookId", "title author cover");

    // Recalculate book's average rating
    const allBookReviews = await Review.find({ bookId });
    if (allBookReviews.length > 0) {
      const avg =
        allBookReviews.reduce((sum, r) => sum + r.rating, 0) / allBookReviews.length;
      book.rating = Math.round(avg * 10) / 10;
      book.ratingsCount = allBookReviews.length;
      await book.save();
    }

    // Award XP
    const user = await User.findById(userId);
    if (user) {
      user.xp = (user.xp || 0) + 50;
      user.level = Math.floor(user.xp / 200) + 1;
      await user.save();
    }

    res.status(201).json(savedReview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET reviews for a book
const getBookReviews = async (req, res) => {
  try {
    const { bookId } = req.params;
    const reviews = await Review.find({ bookId })
      .populate("userId", "name avatar level")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST like/unlike a review
const toggleLikeReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    const index = review.likes.indexOf(userId);
    let liked = false;
    if (index === -1) {
      review.likes.push(userId);
      liked = true;

      // Notify review author
      if (review.userId.toString() !== userId.toString()) {
        await Notification.create({
          userId: review.userId,
          senderId: userId,
          senderName: req.user.name || "A reader",
          type: "like",
          title: "New Like",
          message: `${req.user.name || "A reader"} liked your review.`,
        });
      }
    } else {
      review.likes.splice(index, 1);
      liked = false;
    }

    await review.save();
    res.json({ liked, likesCount: review.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST comment on a review
const addCommentToReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    review.comments.push({
      userId,
      userName: req.user.name || "A reader",
      text: text.trim(),
    });

    await review.save();

    // Notify author
    if (review.userId.toString() !== userId.toString()) {
      await Notification.create({
        userId: review.userId,
        senderId: userId,
        senderName: req.user.name,
        type: "comment",
        title: "New Comment",
        message: `${req.user.name} commented on your review: "${text.substring(0, 40)}..."`,
      });
    }

    res.json(review.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET community activity feed
const getActivityFeed = async (req, res) => {
  try {
    const reviews = await Review.find({ reported: false })
      .populate("userId", "name avatar level")
      .populate("bookId", "title author cover genre")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST report review
const reportReview = async (req, res) => {
  try {
    const { reason = "Inappropriate content" } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { reported: true, reportReason: reason },
      { new: true }
    );
    res.json({ message: "Review reported to moderators", review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReview,
  getBookReviews,
  toggleLikeReview,
  addCommentToReview,
  getActivityFeed,
  reportReview,
};