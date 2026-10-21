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

// GET real-time email dispatch history for registered user
const getEmailHistory = async (req, res) => {
  try {
    const { getEmailDispatches } = require("../services/emailService");
    const emails = getEmailDispatches(req.user.email, 25);
    res.json({
      registeredEmail: req.user.email,
      dispatches: emails,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST test real-time email dispatch
const sendTestEmail = async (req, res) => {
  try {
    const { sendRealtimeNotificationEmail } = require("../services/emailService");
    const { emitToUser } = require("../services/socketService");

    const userEmail = req.user.email;
    const userName = req.user.name || "Reader";

    // 1. Dispatch real-time WebSocket in-app notification
    const testNotif = await Notification.create({
      userId: req.user._id,
      senderId: req.user._id,
      senderName: "Readora Real-Time Sync",
      type: "system",
      title: "Real-Time Email Sync Verified! ✦",
      message: `WebSocket & Email updates active for registered email: ${userEmail}`,
      link: "/community",
    });
    emitToUser(req.user._id, "notification:new", testNotif);

    // 2. Dispatch real-time email
    const result = await sendRealtimeNotificationEmail({
      to: userEmail,
      subject: `[Readora Test] Real-time updates verified for ${userEmail}`,
      title: "WebSocket & Email Synchronization Active!",
      subtitle: `Verified for ${userName}`,
      contentHtml: `
        <p>Hello <strong>${userName}</strong>,</p>
        <p>This confirms that real-time reading updates are active and synchronized with your registered email address:</p>
        <div style="background:#FAF6F0; border-left:4px solid #C99A3D; padding:12px 16px; border-radius:6px; font-weight:bold; color:#652469;">
          📧 Registered Email: ${userEmail}
        </div>
        <p>You will now receive real-time notifications for Buddy Read messages, progress checkpoints, and reading milestones as they happen.</p>
      `,
      eventType: "TEST_VERIFICATION",
    });

    res.json({
      success: true,
      registeredEmail: userEmail,
      notification: testNotif,
      emailResult: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getEmailHistory,
  sendTestEmail,
};
