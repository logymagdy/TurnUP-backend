const Appointment = require("../models/appointmentModel");
const Store = require("../models/storeModel");
const User = require("../models/userModel");
const { sendNotification } = require("./notificationServices");
const { calculateLiveQueue } = require("./queueService");
const { emitFullQueueRefresh } = require("./queueSocket");

/**
 * Runs every 60 seconds via setInterval in app.js
 * Handles:
 * 1. Expiry warning notifications (30 mins and 10 mins before expiry)
 * 2. Marking expired bookings and applying penalties
 * 3. Emitting queue refresh to affected stores
 */
const runQueueExpiryJob = async (io = null) => {
  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // ── 1. Send 30-min expiry warning ──────────────────────────────────
    const thirtyMinWarningTime = new Date(now.getTime() + 30 * 60 * 1000);
    const needsThirtyMinWarning = await Appointment.find({
      bookingType: "NORMAL",
      date: today,
      status: { $in: ["CONFIRMED", "CHECKED_IN"] },
      expiryTime: {
        $gte: now,
        $lte: thirtyMinWarningTime,
      },
      "expiryWarningsSent.thirtyMin": false,
    });

    for (const appointment of needsThirtyMinWarning) {
      const minutesLeft = Math.round(
        (new Date(appointment.expiryTime) - now) / (1000 * 60)
      );

      await sendNotification(
        appointment.client,
        "TURN_EXPIRED",
        `⚠️ Your queue slot #${appointment.queueNumber} will expire in ${minutesLeft} minutes. Please arrive soon!`,
        "Queue Expiring Soon",
        appointment._id,
        "APPOINTMENT"
      );

      // Emit countdown data to client's socket room
      if (io) {
        io.to(String(appointment.client)).emit("expiryCountdown", {
          appointmentId: appointment._id,
          queueNumber: appointment.queueNumber,
          expiryTime: appointment.expiryTime,
          minutesLeft,
        });
      }

      appointment.expiryWarningsSent.thirtyMin = true;
      await appointment.save();
    }

    // ── 2. Send 10-min expiry warning ──────────────────────────────────
    const tenMinWarningTime = new Date(now.getTime() + 10 * 60 * 1000);
    const needsTenMinWarning = await Appointment.find({
      bookingType: "NORMAL",
      date: today,
      status: { $in: ["CONFIRMED", "CHECKED_IN"] },
      expiryTime: {
        $gte: now,
        $lte: tenMinWarningTime,
      },
      "expiryWarningsSent.tenMin": false,
    });

    for (const appointment of needsTenMinWarning) {
      const minutesLeft = Math.round(
        (new Date(appointment.expiryTime) - now) / (1000 * 60)
      );

      await sendNotification(
        appointment.client,
        "TURN_EXPIRED",
        `🚨 URGENT: Your queue slot #${appointment.queueNumber} expires in ${minutesLeft} minutes!`,
        "Queue Expiring Now",
        appointment._id,
        "APPOINTMENT"
      );

      if (io) {
        io.to(String(appointment.client)).emit("expiryCountdown", {
          appointmentId: appointment._id,
          queueNumber: appointment.queueNumber,
          expiryTime: appointment.expiryTime,
          minutesLeft,
        });
      }

      appointment.expiryWarningsSent.tenMin = true;
      await appointment.save();
    }

    // ── 3. Mark expired bookings ───────────────────────────────────────
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
        `Your turn at ${store?.storeName} has expired. A penalty of ${penalty} EGP has been applied.`,
        "Turn Expired",
        appointment._id,
        "APPOINTMENT"
      );

      await sendNotification(
        appointment.client,
        "PENALTY_APPLIED",
        `A no-show penalty of ${penalty} EGP has been added. Please clear it before your next booking.`,
        "Penalty Applied",
        appointment._id,
        "APPOINTMENT"
      );

      await sendNotification(
        store.owner,
        "TURN_EXPIRED",
        `Client no-show for Queue #${appointment.queueNumber}. Penalty of ${penalty} EGP applied.`,
        "Client No-Show",
        appointment._id,
        "APPOINTMENT"
      );

      affectedStoreIds.add(String(appointment.storeId));
    }

    // ── 4. Refresh queues for affected stores ──────────────────────────
    if (io && affectedStoreIds.size > 0) {
      for (const storeId of affectedStoreIds) {
        const queueData = await calculateLiveQueue(storeId, today);
        emitFullQueueRefresh(io, storeId, queueData);
      }
    }

    if (expiredBookings.length > 0) {
      console.log(
        `⏰ Queue expiry job: ${expiredBookings.length} booking(s) expired across ${affectedStoreIds.size} store(s).`
      );
    }
  } catch (err) {
    console.error("Queue expiry job error:", err.message);
  }
};

module.exports = { runQueueExpiryJob };