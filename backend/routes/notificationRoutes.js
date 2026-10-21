const express = require("express");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getEmailHistory,
  sendTestEmail,
} = require("../controllers/notificationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.get("/emails", getEmailHistory);
router.post("/test-email", sendTestEmail);
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);

module.exports = router;
