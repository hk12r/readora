const User = require("../models/User");
const Book = require("../models/Book");
const Review = require("../models/Review");
const LibraryEntry = require("../models/LibraryEntry");

// Get platform stats
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBooks = await Book.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalEntries = await LibraryEntry.countDocuments();
    const reportedReviews = await Review.countDocuments({ reported: true });

    res.json({
      totalUsers,
      totalBooks,
      totalReviews,
      totalEntries,
      reportedReviews,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Manage users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Review moderation
const getReportedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reported: true })
      .populate("userId", "name email")
      .populate("bookId", "title author");

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const dismissReviewReport = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { reported: false, reportReason: "" },
      { new: true }
    );
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json({ message: "Report dismissed", review });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteReviewModerated = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json({ message: "Review removed by administrator" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  getReportedReviews,
  dismissReviewReport,
  deleteReviewModerated,
};
