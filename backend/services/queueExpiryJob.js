const Appointment = require("../models/appointmentModel");
const Store = require("../models/storeModel");
const User = require("../models/userModel");
const { sendNotification } = require("./notificationService");
const { calculateLiveQueue } = require("./queueService");
const { emitFullQueueRefresh } = require("./queueSocket");

/**
 * Runs on a schedule every 60 seconds via setInterval in app.js
 * Finds all NORMAL bookings where expiryTime has passed
 * and status is still PENDING, CONFIRMED, or CHECKED_IN
 * Marks them EXPIRED, applies store-defined penalty,
 * then recalculates and emits the updated queue to the store dashboard
 */
const runQueueExpiryJob = async (io = null) => {
  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Find all expired NORMAL bookings not yet processed
    const expiredBookings = await Appointment.find({
      bookingType: "NORMAL",
      date: today,
      status: { $in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
      expiryTime: { $lte: now },
    });

    // Track which stores need queue refresh after processing
    const affectedStoreIds = new Set();

    for (const appointment of expiredBookings) {
      // Mark as EXPIRED
      appointment.status = "EXPIRED";
      await appointment.save();

      // Get store-defined penalty
      const store = await Store.findById(appointment.storeId).select(
        "settings owner storeName"
      );
      const penalty = store?.settings?.noShowPenalty ?? 15;

      // Apply penalty — add to debt if no saved card
      const client = await User.findById(appointment.client).select(
        "savedCard debt"
      );

      if (!client.savedCard) {
        await User.findByIdAndUpdate(appointment.client, {
          $inc: { debt: penalty },
        });
      }
      // If savedCard exists — charge via payment gateway in production

      // Notify client — turn expired
      await sendNotification(
        appointment.client,
        "TURN_EXPIRED",
        `Your turn at the store has expired. A penalty of ${penalty} EGP has been applied.`,
        "Turn Expired",
        appointment._id,
        "APPOINTMENT"
      );

      // Notify client — penalty applied
      await sendNotification(
        appointment.client,
        "PENALTY_APPLIED",
        `A no-show penalty of ${penalty} EGP has been added. Please clear it before your next booking.`,
        "Penalty Applied",
        appointment._id,
        "APPOINTMENT"
      );

      // Notify store owner — no-show
      await sendNotification(
        store.owner,
        "TURN_EXPIRED",
        `Client no-show for Queue #${appointment.queueNumber}. Penalty of ${penalty} EGP applied.`,
        "Client No-Show",
        appointment._id,
        "APPOINTMENT"
      );

      // Mark store as needing queue refresh
      affectedStoreIds.add(String(appointment.storeId));
    }

    // Recalculate and emit queue refresh for each affected store
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