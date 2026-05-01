const Notification = require("../models/notificationModel");

// ─── GET MY NOTIFICATIONS ─────────────────────────────────────────────────────
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      message: "Notifications retrieved.",
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
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

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