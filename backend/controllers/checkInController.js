const Appointment = require("../models/appointmentModel");
const Store = require("../models/storeModel");
const { sendNotification } = require("../services/notificationServices");
const { calculateLiveQueue } = require("../services/queueService");
const { emitQueueUpdate, emitFullQueueRefresh } = require("../services/queueSocket");

// ─── QR CHECK-IN ──────────────────────────────────────────────────────────────
// Called when client scans the store QR code
// QR contains storeId — system matches it to client's active booking
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
      status: { $in: ["PENDING", "CONFIRMED"] },
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

    // ── 4. Validate check-in time window ──────────────────────────────
    // NORMAL bookings use estimatedStartTime
    // HOME / EVENT use scheduled date + time
    let referenceTime;
    if (appointment.bookingType === "NORMAL" && appointment.estimatedStartTime) {
      referenceTime = new Date(appointment.estimatedStartTime);
    } else {
      referenceTime = new Date(`${appointment.date}T${appointment.time}`);
    }

    const minutesUntilSlot = (referenceTime - now) / (1000 * 60);

    if (minutesUntilSlot > 30) {
      return res.status(400).json({
        message: "Too early to check in. Please arrive closer to your appointment time.",
        minutesUntilSlot: Math.round(minutesUntilSlot),
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

    // ── 7. Recalculate full queue and emit to store dashboard ──────────
    const io = req.app.get("io");
    const queueData = await calculateLiveQueue(storeId, today);
    emitFullQueueRefresh(io, storeId, queueData);

    // Also emit lightweight check-in event for quick UI indicator
    emitQueueUpdate(io, storeId, "queueChanged", {
      type: "CLIENT_CHECKED_IN",
      queueNumber: appointment.queueNumber,
      clientId,
      checkInTime: appointment.checkInTime,
    });

    // ── 8. Notify client — check-in confirmed ──────────────────────────
    await sendNotification(
      clientId,
      "BOOKING_CONFIRMED",
      `You have successfully checked in at ${store.storeName}. Queue #${appointment.queueNumber}.`,
      "Check-In Confirmed",
      appointment._id,
      "APPOINTMENT"
    );

    // ── 9. Notify store owner — client checked in ──────────────────────
    await sendNotification(
      store.owner,
      "CLIENT_CHECKED_IN",
      `A client has checked in. Queue #${appointment.queueNumber}.`,
      "Client Checked In",
      appointment._id,
      "APPOINTMENT"
    );

    // ── 10. Notify all receptionists — client checked in ───────────────
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
      checkInTime: appointment.checkInTime,
      status: appointment.status,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};