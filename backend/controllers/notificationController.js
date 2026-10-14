const Notification = require("../models/Notification");

// GET all notifications for the user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT mark notification as read
const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { read: true }
    );
    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT mark all as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany({ userId, read: false }, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
