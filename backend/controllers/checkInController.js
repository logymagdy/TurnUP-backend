const Appointment = require("../models/appointmentModel");
const Store = require("../models/storeModel");
const { sendNotification } = require("../services/notificationServices");
const { calculateLiveQueue } = require("../services/queueService");
const { emitQueueUpdate, emitFullQueueRefresh } = require("../services/queueSocket");

exports.checkIn = async (req, res) => {
  try {
    const { storeId } = req.body;
    const clientId = req.user.id;
    const today = new Date().toISOString().split("T")[0];

    // ── 1. Find client's active booking for today at this store ────────
    const appointment = await Appointment.findOne({
      storeId,
      client: clientId,
      date: today,
      status: { $in: ["CONFIRMED"] },
    });

    if (!appointment) {
      return res.status(404).json({
        message: "No active booking found for today at this store.",
      });
    }

    // ── 2. Prevent double check-in ─────────────────────────────────────
    if (appointment.checkedIn) {
      return res.status(400).json({
        message: "You have already checked in for this booking.",
      });
    }

    // ── 3. Check booking has not expired ───────────────────────────────
    const now = new Date();
    if (appointment.expiryTime && now > new Date(appointment.expiryTime)) {
      return res.status(400).json({
        message: "Your queue slot has expired. Please rebook.",
      });
    }

    // ── 4. ✅ 30 min before and 30 min after window enforcement ────────
    let referenceTime;
    if (appointment.bookingType === "NORMAL" && appointment.estimatedStartTime) {
      referenceTime = new Date(appointment.estimatedStartTime);
    } else {
      referenceTime = new Date(`${appointment.date}T${appointment.time}`);
    }

    const minutesUntilSlot = (referenceTime - now) / (1000 * 60);
    const minutesSinceSlot = (now - referenceTime) / (1000 * 60);

    // Too early — more than 30 mins before
    if (minutesUntilSlot > 30) {
      return res.status(400).json({
        message: `Too early to check in. You can check in 30 minutes before your appointment.`,
        minutesUntilCheckIn: Math.round(minutesUntilSlot - 30),
      });
    }

    // Too late — more than 30 mins after slot time
    if (minutesSinceSlot > 30) {
      // ✅ Apply penalty for late check-in / no-show
      const store = await Store.findById(storeId).select("settings");
      const penalty = store?.settings?.noShowPenalty ?? 15;

      const User = require("../models/userModel");
      await User.findByIdAndUpdate(clientId, { $inc: { debt: penalty } });

      appointment.status = "EXPIRED";
      await appointment.save();

      await sendNotification(
        clientId,
        "PENALTY_APPLIED",
        `You missed your check-in window. A penalty of ${penalty} EGP has been applied.`,
        "Check-In Window Missed",
        appointment._id,
        "APPOINTMENT"
      );

      return res.status(400).json({
        message: `Check-in window has passed (30 minutes after your slot). A penalty of ${penalty} EGP has been applied.`,
        penalty,
      });
    }

    // ── 5. Update booking to CHECKED_IN ────────────────────────────────
    appointment.checkedIn = true;
    appointment.checkInTime = now;
    appointment.status = "CHECKED_IN";
    await appointment.save();

    // ── 6. Get store details ───────────────────────────────────────────
    const store = await Store.findById(storeId).select(
      "owner storeName receptionists"
    );

    // ── 7. Recalculate and emit queue ──────────────────────────────────
    const io = req.app.get("io");
    const queueData = await calculateLiveQueue(storeId, today);
    emitFullQueueRefresh(io, storeId, queueData);

    emitQueueUpdate(io, storeId, "queueChanged", {
      type: "CLIENT_CHECKED_IN",
      queueNumber: appointment.queueNumber,
      clientId,
      checkInTime: appointment.checkInTime,
    });

    // ── 8. Notify client ───────────────────────────────────────────────
    await sendNotification(
      clientId,
      "BOOKING_CONFIRMED",
      `You have successfully checked in at ${store.storeName}. Queue #${appointment.queueNumber}.`,
      "Check-In Confirmed",
      appointment._id,
      "APPOINTMENT"
    );

    // ── 9. Notify store owner ──────────────────────────────────────────
    await sendNotification(
      store.owner,
      "CLIENT_CHECKED_IN",
      `A client has checked in. Queue #${appointment.queueNumber}.`,
      "Client Checked In",
      appointment._id,
      "APPOINTMENT"
    );

    // ── 10. Notify all receptionists ───────────────────────────────────
    if (store.receptionists && store.receptionists.length > 0) {
      for (const receptionistId of store.receptionists) {
        await sendNotification(
          receptionistId,
          "CLIENT_CHECKED_IN",
          `Client checked in. Queue #${appointment.queueNumber}.`,
          "Client Checked In",
          appointment._id,
          "APPOINTMENT"
        );
      }
    }

    return res.status(200).json({
      message: "Check-in successful.",
      queueNumber: appointment.queueNumber,
      estimatedStartTime: appointment.estimatedStartTime,
      expiryTime: appointment.expiryTime,
      checkInTime: appointment.checkInTime,
      status: appointment.status,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};