const admin = require("firebase-admin");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");

// ─── FIREBASE INIT (once, safely) ─────────────────────────────────────────────
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    console.log("🔥 Firebase Admin initialized");
  } catch (err) {
    console.error("Firebase Admin init failed:", err.message);
  }
}

/**
 * Sends a push notification via FCM AND saves it to DB.
 * Push failure never throws — it only logs.
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
    // ── 1. Save notification to DB always ─────────────────────────────
    await Notification.create({
      userId,
      type,
      message,
      referenceId,
      referenceType,
    });

    // ── 2. Get user FCM token and settings ─────────────────────────────
    const user = await User.findById(userId).select(
      "fcmToken notificationSettings"
    );
    if (!user || !user.fcmToken) return;

    if (!user.notificationSettings?.general) return;

    // ── 3. Build FCM message ───────────────────────────────────────────
    const message_payload = {
      token: user.fcmToken,
      notification: {
        title,
        body: message,
      },
      data: {
        type,
        referenceId: referenceId ? String(referenceId) : "",
        referenceType: referenceType || "",
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
      },
      android: {
        notification: {
          sound: user.notificationSettings?.sound ? "default" : null,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: user.notificationSettings?.sound ? "default" : null,
          },
        },
      },
    };

    // ── 4. Send push — failure is logged, never thrown ─────────────────
    try {
      await admin.messaging().send(message_payload);
    } catch (pushErr) {
      console.error(`FCM push failed for user ${userId}:`, pushErr.message);
    }
  } catch (err) {
    console.error("sendNotification failed:", err.message);
  }
};

/**
 * Sends the same notification to multiple users at once.
 * Uses FCM sendEachForMulticast for batching.
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
    // ── 1. Save all to DB in one operation ─────────────────────────────
    const notificationDocs = userIds.map((userId) => ({
      userId,
      type,
      message,
      referenceId,
      referenceType,
    }));
    await Notification.insertMany(notificationDocs);

    // ── 2. Get users with valid FCM tokens ─────────────────────────────
    const users = await User.find({
      _id: { $in: userIds },
      fcmToken: { $ne: null },
      "notificationSettings.general": true,
    }).select("fcmToken notificationSettings");

    if (!users.length) return;

    const tokens = users.map((u) => u.fcmToken);

    // ── 3. Build multicast message ─────────────────────────────────────
    const multicastMessage = {
      tokens,
      notification: { title, body: message },
      data: {
        type,
        referenceId: referenceId ? String(referenceId) : "",
        referenceType: referenceType || "",
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
      },
    };

    // ── 4. Send — log failures per token, never throw ──────────────────
    try {
      const response = await admin.messaging().sendEachForMulticast(multicastMessage);
      response.responses.forEach((r, i) => {
        if (!r.success) {
          console.error(`FCM bulk fail for token ${tokens[i]}:`, r.error?.message);
        }
      });
    } catch (pushErr) {
      console.error("FCM bulk send failed:", pushErr.message);
    }
  } catch (err) {
    console.error("sendBulkNotification failed:", err.message);
  }
};

module.exports = { sendNotification, sendBulkNotification };