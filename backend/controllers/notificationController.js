const Notification = require("../models/notificationModel");
const User = require("../models/userModel");

// ─── GET MY NOTIFICATIONS ─────────────────────────────────────────────────────
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    // ✅ Count unread for badge
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });

    return res.status(200).json({
      message: "Notifications retrieved.",
      unreadCount,
      notifications,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── MARK ONE AS READ ─────────────────────────────────────────────────────────
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user.id },
      { isRead: true },
      { returnDocument: "after" }
    );

    if (!notification)
      return res.status(404).json({ message: "Notification not found." });

    return res.status(200).json({
      message: "Notification marked as read.",
      notification,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── MARK ALL AS READ ─────────────────────────────────────────────────────────
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({ message: "All notifications marked as read." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── SAVE FCM TOKEN ───────────────────────────────────────────────────────────
exports.savePushToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken)
      return res.status(400).json({ message: "FCM token is required." });

    await User.findByIdAndUpdate(req.user.id, { fcmToken });

    return res.status(200).json({ message: "Push token saved successfully." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET UNREAD COUNT ─────────────────────────────────────────────────────────
// ✅ Used for bell icon badge on home screen
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });

    return res.status(200).json({ unreadCount: count });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};