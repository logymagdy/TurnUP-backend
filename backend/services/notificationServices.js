const { Expo } = require("expo-server-sdk");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");

const expo = new Expo();

/**
 * Sends an Expo push notification AND saves it to DB
 *
 * @param {string} userId         - Recipient user ID
 * @param {string} type           - Notification type (must match enum in notificationModel)
 * @param {string} message        - Notification body text
 * @param {string} title          - Notification title shown on device
 * @param {string} referenceId    - Optional: related document ID
 * @param {string} referenceType  - Optional: QUEUE | APPOINTMENT | STORE | PAYMENT
 * @param {object} data           - Optional: extra data payload sent to mobile app
 */
const sendNotification = async (
  userId,
  type,
  message,
  title = "TurnUP",
  referenceId = null,
  referenceType = null,
  data = {}
) => {
  try {
    // ── 1. Save notification to DB ─────────────────────────────────────
    await Notification.create({
      userId,
      type,
      message,
      referenceId,
      referenceType,
    });

    // ── 2. Get user's Expo push token ──────────────────────────────────
    const user = await User.findById(userId).select("expoPushToken notificationSettings");
    if (!user || !user.expoPushToken) return;

    // ── 3. Respect user push notification setting ──────────────────────
    if (!user.notificationSettings?.channels?.push) return;

    // ── 4. Validate Expo token ─────────────────────────────────────────
    if (!Expo.isExpoPushToken(user.expoPushToken)) {
      console.error(`Invalid Expo push token for user ${userId}`);
      return;
    }

    // ── 5. Build and send push message ────────────────────────────────
    const pushMessage = {
      to: user.expoPushToken,
      sound: user.notificationSettings?.sound ? "default" : null,
      title,
      body: message,
      data: { type, referenceId, referenceType, ...data },
    };

    const chunks = expo.chunkPushNotifications([pushMessage]);

    for (const chunk of chunks) {
      try {
        const receipts = await expo.sendPushNotificationsAsync(chunk);
        receipts.forEach((receipt) => {
          if (receipt.status === "error") {
            console.error("Expo push error:", receipt.message);
          }
        });
      } catch (chunkErr) {
        console.error("Chunk send error:", chunkErr.message);
      }
    }
  } catch (err) {
    console.error("sendNotification failed:", err.message);
  }
};

/**
 * Sends the same notification to multiple users at once
 * @param {string[]} userIds - Array of user IDs
 */
const sendBulkNotification = async (
  userIds,
  type,
  message,
  title = "TurnUP",
  referenceId = null,
  referenceType = null,
  data = {}
) => {
  try {
    // ── 1. Save all notifications to DB in one operation ───────────────
    const notificationDocs = userIds.map((userId) => ({
      userId,
      type,
      message,
      referenceId,
      referenceType,
    }));
    await Notification.insertMany(notificationDocs);

    // ── 2. Get all users with valid push tokens ────────────────────────
    const users = await User.find({
      _id: { $in: userIds },
      expoPushToken: { $ne: null },
      "notificationSettings.channels.push": true,
    }).select("expoPushToken notificationSettings");

    if (!users.length) return;

    // ── 3. Build push messages for valid tokens only ───────────────────
    const messages = users
      .filter((u) => Expo.isExpoPushToken(u.expoPushToken))
      .map((u) => ({
        to: u.expoPushToken,
        sound: u.notificationSettings?.sound ? "default" : null,
        title,
        body: message,
        data: { type, referenceId, referenceType, ...data },
      }));

    if (!messages.length) return;

    // ── 4. Send in chunks ──────────────────────────────────────────────
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const receipts = await expo.sendPushNotificationsAsync(chunk);
        receipts.forEach((receipt) => {
          if (receipt.status === "error") {
            console.error("Expo bulk push error:", receipt.message);
          }
        });
      } catch (chunkErr) {
        console.error("Bulk chunk send error:", chunkErr.message);
      }
    }
  } catch (err) {
    console.error("sendBulkNotification failed:", err.message);
  }
};

module.exports = { sendNotification, sendBulkNotification };