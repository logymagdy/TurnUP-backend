const Notification = require("../models/notificationModel");

/**
 * Creates a notification in DB and emits it via socket in real time
 * @param {object} io         - Socket.io instance from app
 * @param {string} userId     - The recipient user ID
 * @param {string} type       - Notification type (must match enum in model)
 * @param {string} message    - Human readable message
 * @param {string} referenceId     - Optional: related document ID
 * @param {string} referenceType   - Optional: QUEUE | APPOINTMENT | STORE | PAYMENT
 */
const sendNotification = async (io, userId, type, message, referenceId = null, referenceType = null) => {
  try {
    // Save to DB
    const notification = await Notification.create({
      userId,
      type,
      message,
      referenceId,
      referenceType,
    });

    // Emit real time to client's personal room
    if (io) {
      io.to(`client:${userId}`).emit("notification", {
        type,
        message,
        referenceId,
        referenceType,
        createdAt: notification.createdAt,
      });
    }

    return notification;
  } catch (err) {
    console.error("Failed to send notification:", err.message);
  }
};

module.exports = { sendNotification };