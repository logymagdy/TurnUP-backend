const Appointment = require("../models/appointmentModel");
const Store = require("../models/storeModel");
const User = require("../models/userModel");
const {
  sendNotification,
  sendQueueNotification,
} = require("./notificationServices");
const { calculateLiveQueue } = require("./queueService");
const { emitFullQueueRefresh } = require("./queueSocket");

const runQueueExpiryJob = async (io = null) => {
  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // ── 1. Send 30-min expiry warnings ────────────────────────────────
    const thirtyMinWindow = new Date(now.getTime() + 30 * 60 * 1000);
    const needsThirtyMinWarning = await Appointment.find({
      bookingType: "NORMAL",
      date: today,
      status: { $in: ["CONFIRMED", "CHECKED_IN"] },
      expiryTime: { $gte: now, $lte: thirtyMinWindow },
      "expiryWarningsSent.thirtyMin": false,
    });

    for (const appointment of needsThirtyMinWarning) {
      const store = await Store.findById(appointment.storeId).select("storeName");
      const minutesLeft = Math.round(
        (new Date(appointment.expiryTime) - now) / (1000 * 60)
      );

      await sendQueueNotification(
        appointment.client,
        appointment.queueNumber,
        appointment.estimatedStartTime,
        appointment.expiryTime,
        store?.storeName || "the store",
        appointment._id,
        "THIRTY_MINS_LEFT"
      );

      // ✅ Emit countdown to client socket room
      if (io) {
        io.to(String(appointment.client)).emit("expiryCountdown", {
          appointmentId: appointment._id,
          queueNumber: appointment.queueNumber,
          expiryTime: appointment.expiryTime,
          estimatedStartTime: appointment.estimatedStartTime,
          minutesLeft,
          storeName: store?.storeName,
        });
      }

      appointment.expiryWarningsSent.thirtyMin = true;
      await appointment.save();
    }

    // ── 2. Send 10-min expiry warnings ────────────────────────────────
    const tenMinWindow = new Date(now.getTime() + 10 * 60 * 1000);
    const needsTenMinWarning = await Appointment.find({
      bookingType: "NORMAL",
      date: today,
      status: { $in: ["CONFIRMED", "CHECKED_IN"] },
      expiryTime: { $gte: now, $lte: tenMinWindow },
      "expiryWarningsSent.tenMin": false,
    });

    for (const appointment of needsTenMinWarning) {
      const store = await Store.findById(appointment.storeId).select("storeName");
      const minutesLeft = Math.round(
        (new Date(appointment.expiryTime) - now) / (1000 * 60)
      );

      await sendQueueNotification(
        appointment.client,
        appointment.queueNumber,
        appointment.estimatedStartTime,
        appointment.expiryTime,
        store?.storeName || "the store",
        appointment._id,
        "TEN_MINS_LEFT"
      );

      if (io) {
        io.to(String(appointment.client)).emit("expiryCountdown", {
          appointmentId: appointment._id,
          queueNumber: appointment.queueNumber,
          expiryTime: appointment.expiryTime,
          estimatedStartTime: appointment.estimatedStartTime,
          minutesLeft,
          storeName: store?.storeName,
          urgent: true,
        });
      }

      appointment.expiryWarningsSent.tenMin = true;
      await appointment.save();
    }

    // ── 3. Send "you're next" notifications ───────────────────────────
    const fiveMinWindow = new Date(now.getTime() + 5 * 60 * 1000);
    const youreNextAppointments = await Appointment.find({
      date: today,
      status: { $in: ["CONFIRMED", "CHECKED_IN"] },
      estimatedStartTime: { $gte: now, $lte: fiveMinWindow },
      youreNextSent: { $ne: true },
    });

    for (const appointment of youreNextAppointments) {
      const store = await Store.findById(appointment.storeId).select("storeName");

      await sendQueueNotification(
        appointment.client,
        appointment.queueNumber,
        appointment.estimatedStartTime,
        appointment.expiryTime,
        store?.storeName || "the store",
        appointment._id,
        "YOURE_NEXT"
      );

      if (io) {
        io.to(String(appointment.client)).emit("youreNext", {
          appointmentId: appointment._id,
          queueNumber: appointment.queueNumber,
          storeName: store?.storeName,
        });
      }

      await Appointment.findByIdAndUpdate(appointment._id, {
        youreNextSent: true,
      });
    }

    // ── 4. Mark expired bookings ──────────────────────────────────────
    const expiredBookings = await Appointment.find({
      bookingType: "NORMAL",
      date: today,
      status: { $in: ["CONFIRMED", "CHECKED_IN"] },
      expiryTime: { $lte: now },
    });

    const affectedStoreIds = new Set();

    for (const appointment of expiredBookings) {
      appointment.status = "EXPIRED";
      await appointment.save();

      const store = await Store.findById(appointment.storeId).select(
        "settings owner storeName"
      );
      const penalty = store?.settings?.noShowPenalty ?? 15;

      await User.findByIdAndUpdate(appointment.client, {
        $inc: { debt: penalty },
      });

      await sendNotification(
        appointment.client,
        "TURN_EXPIRED",
        `Your turn at ${store?.storeName} has expired. Penalty of ${penalty} EGP applied.`,
        "Turn Expired",
        appointment._id,
        "APPOINTMENT"
      );

      await sendNotification(
        appointment.client,
        "PENALTY_APPLIED",
        `No-show penalty of ${penalty} EGP added. Clear it before your next booking.`,
        "Penalty Applied",
        appointment._id,
        "APPOINTMENT"
      );

      if (store?.owner) {
        await sendNotification(
          store.owner,
          "TURN_EXPIRED",
          `Client no-show for Queue #${appointment.queueNumber}. Penalty of ${penalty} EGP applied.`,
          "Client No-Show",
          appointment._id,
          "APPOINTMENT"
        );
      }

      affectedStoreIds.add(String(appointment.storeId));
    }

    // ── 5. Refresh queues for affected stores ─────────────────────────
    if (io && affectedStoreIds.size > 0) {
      for (const storeId of affectedStoreIds) {
        const queueData = await calculateLiveQueue(storeId, today);
        emitFullQueueRefresh(io, storeId, queueData);
      }
    }

    if (expiredBookings.length > 0) {
      console.log(
        `⏰ Expiry job: ${expiredBookings.length} expired across ${affectedStoreIds.size} stores`
      );
    }
  } catch (err) {
    console.error("Queue expiry job error:", err.message);
  }
};

module.exports = { runQueueExpiryJob };