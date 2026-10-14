const express = require("express");
const {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  getReportedReviews,
  dismissReviewReport,
  deleteReviewModerated,
} = require("../controllers/adminController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/roleMiddleware");

const router = express.Router();

// Require authenticated user with role: 'admin'
router.use(protect, adminOnly);

router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);

router.get("/reports", getReportedReviews);
router.put("/reviews/:id/dismiss", dismissReviewReport);
router.delete("/reviews/:id", deleteReviewModerated);

module.exports = router;
