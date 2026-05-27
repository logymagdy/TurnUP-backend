const admin = require("firebase-admin");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");

// ─── FIREBASE INIT ────────────────────────────────────────────────────────────
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

// ─── SEND SINGLE NOTIFICATION ─────────────────────────────────────────────────
const sendNotification = async (
  userId,
  type,
  message,
  title = "TurnUP",
  referenceId = null,
  referenceType = null,
  extraData = {}
) => {
  try {
    // ── 1. Always save to DB — in-app notification ─────────────────────
    await Notification.create({
      userId,
      type,
      message,
      title,
      referenceId,
      referenceType,
    });

    // ── 2. Get user FCM token and settings ─────────────────────────────
    const user = await User.findById(userId).select(
      "fcmToken notificationSettings username"
    );
    if (!user || !user.fcmToken) return;

    // ── 3. Check notification settings ────────────────────────────────
    const settings = user.notificationSettings;
    if (!settings?.general) return;

    // ✅ Check specific notification type settings
    const typeSettingMap = {
      PROMOTION: settings.specialOffers,
      BOOKING_CONFIRMED: settings.booking?.newBooking,
      BOOKING_CANCELLED: settings.booking?.cancellation,
      PENALTY_APPLIED: settings.payments,
      SERVICE_DONE: settings.booking?.newBooking,
      SUBSCRIPTION_DUE: settings.payments,
    };

    if (typeSettingMap[type] === false) return;

    // ── 4. Build FCM payload ───────────────────────────────────────────
    const fcmPayload = {
      token: user.fcmToken,
      notification: {
        title,
        body: message,
      },
      // ✅ data field — used by frontend for in-app handling
      data: {
        type,
        referenceId: referenceId ? String(referenceId) : "",
        referenceType: referenceType || "",
        title,
        message,
        ...Object.fromEntries(
          Object.entries(extraData).map(([k, v]) => [k, String(v)])
        ),
      },
      android: {
        priority: "high",
        notification: {
          sound: settings.sound ? "default" : null,
          channelId: "turnup_notifications",
          priority: "high",
          defaultSound: true,
          defaultVibrateTimings: settings.vibrate || false,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: settings.sound ? "default" : null,
            badge: 1,
            "content-available": 1,
          },
        },
        headers: {
          "apns-priority": "10",
        },
      },
    };

    // ── 5. Send push — failure never throws ───────────────────────────
    try {
      await admin.messaging().send(fcmPayload);
    } catch (pushErr) {
      console.error(`FCM push failed for user ${userId}:`, pushErr.message);
      // ✅ If token invalid, clear it so we don't keep trying
      if (
        pushErr.code === "messaging/invalid-registration-token" ||
        pushErr.code === "messaging/registration-token-not-registered"
      ) {
        await User.findByIdAndUpdate(userId, { fcmToken: null });
      }
    }
  } catch (err) {
    console.error("sendNotification error:", err.message);
  }
};

// ─── SEND QUEUE POSITION NOTIFICATION ────────────────────────────────────────
// ✅ Special notification for queue updates — includes countdown data
const sendQueueNotification = async (
  userId,
  queueNumber,
  estimatedStartTime,
  expiryTime,
  storeName,
  appointmentId,
  messageType // "YOURE_NEXT" | "TEN_MINS_LEFT" | "THIRTY_MINS_LEFT"
) => {
  const now = new Date();
  const minutesLeft = estimatedStartTime
    ? Math.round((new Date(estimatedStartTime) - now) / (1000 * 60))
    : null;

  const messageMap = {
    YOURE_NEXT: `You're next at ${storeName}! Queue #${queueNumber}. Get ready!`,
    TEN_MINS_LEFT: `⏰ 10 minutes until your turn at ${storeName}. Queue #${queueNumber}.`,
    THIRTY_MINS_LEFT: `Your turn at ${storeName} is in ~30 minutes. Queue #${queueNumber}.`,
  };

  const titleMap = {
    YOURE_NEXT: "You're Next! 🎉",
    TEN_MINS_LEFT: "Almost Your Turn ⏰",
    THIRTY_MINS_LEFT: "Upcoming Turn 📅",
  };

  await sendNotification(
    userId,
    "YOURE_NEXT",
    messageMap[messageType] || messageMap.YOURE_NEXT,
    titleMap[messageType] || "Queue Update",
    appointmentId,
    "APPOINTMENT",
    {
      queueNumber: String(queueNumber),
      estimatedStartTime: estimatedStartTime
        ? new Date(estimatedStartTime).toISOString()
        : "",
      expiryTime: expiryTime ? new Date(expiryTime).toISOString() : "",
      minutesLeft: minutesLeft ? String(minutesLeft) : "",
      storeName,
    }
  );
};

// ─── SEND BULK NOTIFICATION ───────────────────────────────────────────────────
const sendBulkNotification = async (
  userIds,
  type,
  message,
  title = "TurnUP",
  referenceId = null,
  referenceType = null,
  extraData = {}
) => {
  try {
    // ── 1. Save all to DB ──────────────────────────────────────────────
    const notificationDocs = userIds.map((userId) => ({
      userId,
      type,
      message,
      title,
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

    const multicastMessage = {
      tokens,
      notification: { title, body: message },
      data: {
        type,
        referenceId: referenceId ? String(referenceId) : "",
        referenceType: referenceType || "",
        title,
        message,
        ...Object.fromEntries(
          Object.entries(extraData).map(([k, v]) => [k, String(v)])
        ),
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "turnup_notifications",
        },
      },
      apns: {
        payload: {
          aps: { sound: "default", badge: 1 },
        },
      },
    };

    try {
      const response = await admin
        .messaging()
        .sendEachForMulticast(multicastMessage);

      // ✅ Clean up invalid tokens
      const invalidTokenUsers = [];
      response.responses.forEach((r, i) => {
        if (!r.success) {
          console.error(
            `FCM bulk fail for token ${tokens[i]}:`,
            r.error?.message
          );
          if (
            r.error?.code ===
              "messaging/invalid-registration-token" ||
            r.error?.code ===
              "messaging/registration-token-not-registered"
          ) {
            invalidTokenUsers.push(users[i]._id);
          }
        }
      });

      if (invalidTokenUsers.length > 0) {
        await User.updateMany(
          { _id: { $in: invalidTokenUsers } },
          { fcmToken: null }
        );
      }
    } catch (pushErr) {
      console.error("FCM bulk send failed:", pushErr.message);
    }
  } catch (err) {
    console.error("sendBulkNotification error:", err.message);
  }
};

module.exports = {
  sendNotification,
  sendBulkNotification,
  sendQueueNotification,
};