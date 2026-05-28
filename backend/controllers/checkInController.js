const Appointment = require("../models/appointmentModel");
const Store = require("../models/storeModel");
const User = require("../models/userModel");
const { sendNotification } = require("../services/notificationServices");
const { calculateLiveQueue } = require("../services/queueService");
const { emitQueueUpdate, emitFullQueueRefresh } = require("../services/queueSocket");

// ─── CLIENT CHECK-IN (QR SCAN) ────────────────────────────────────────────────
exports.checkIn = async (req, res) => {
  try {
    const { storeId } = req.body;
    const clientId = req.user.id;
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    // ✅ Find booking — works for both online booked AND walk-in clients
    const appointment = await Appointment.findOne({
      storeId,
      date: today,
      status: "CONFIRMED",
      $or: [
        { client: clientId },           // online booked client
        { isWalkIn: true, checkedIn: false }, // walk-in not yet checked in
      ],
    });

    if (!appointment) {
      return res.status(404).json({
        message: "No active booking found for today at this store.",
      });
    }

    // ✅ If walk-in — link this client to the appointment
    if (appointment.isWalkIn && String(appointment.client) !== String(clientId)) {
      appointment.client = clientId;
    }

    // ── Prevent double check-in ────────────────────────────────────────
    if (appointment.checkedIn) {
      return res.status(400).json({
        message: "You have already checked in for this booking.",
      });
    }

    // ── Check not expired ──────────────────────────────────────────────
    if (appointment.expiryTime && now > new Date(appointment.expiryTime)) {
      return res.status(400).json({
        message: "Your queue slot has expired. Please ask the receptionist.",
      });
    }

    // ── 30-min window check ────────────────────────────────────────────
    let referenceTime;
    if (appointment.estimatedStartTime) {
      referenceTime = new Date(appointment.estimatedStartTime);
    } else {
      referenceTime = new Date(`${appointment.date}T${appointment.time}`);
    }

    const minutesUntilSlot = (referenceTime - now) / (1000 * 60);
    const minutesSinceSlot = (now - referenceTime) / (1000 * 60);

    if (minutesUntilSlot > 30) {
      return res.status(400).json({
        message: `Too early to check in. Come back in ${Math.round(minutesUntilSlot - 30)} minutes.`,
        minutesUntilCheckIn: Math.round(minutesUntilSlot - 30),
      });
    }

    if (minutesSinceSlot > 30) {
      const store = await Store.findById(storeId).select("settings");
      const penalty = store?.settings?.noShowPenalty ?? 15;

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
        message: `Check-in window passed. Penalty of ${penalty} EGP applied.`,
        penalty,
      });
    }

    // ── Mark as CHECKED_IN ─────────────────────────────────────────────
    appointment.checkedIn = true;
    appointment.checkInTime = now;
    appointment.status = "CHECKED_IN";
    await appointment.save();

    const store = await Store.findById(storeId).select(
      "owner storeName receptionists"
    );

    // ── Recalculate and emit queue ─────────────────────────────────────
    const io = req.app.get("io");
    const queueData = await calculateLiveQueue(storeId, today);
    emitFullQueueRefresh(io, storeId, queueData);

    emitQueueUpdate(io, storeId, "queueChanged", {
      type: "CLIENT_CHECKED_IN",
      queueNumber: appointment.queueNumber,
      clientId,
      checkInTime: appointment.checkInTime,
    });

    // ── Emit to client's personal room ─────────────────────────────────
    if (io) {
      io.to(String(clientId)).emit("checkInConfirmed", {
        queueNumber: appointment.queueNumber,
        estimatedStartTime: appointment.estimatedStartTime,
        expiryTime: appointment.expiryTime,
        storeName: store.storeName,
      });
    }

    // ── Notifications ──────────────────────────────────────────────────
    await sendNotification(
      clientId,
      "BOOKING_CONFIRMED",
      `Checked in at ${store.storeName}. Queue #${appointment.queueNumber}.`,
      "Check-In Confirmed",
      appointment._id,
      "APPOINTMENT"
    );

    await sendNotification(
      store.owner,
      "CLIENT_CHECKED_IN",
      `Client checked in. Queue #${appointment.queueNumber}.`,
      "Client Checked In",
      appointment._id,
      "APPOINTMENT"
    );

    if (store.receptionists?.length > 0) {
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
      liveQueue: {
        totalInQueue: queueData.pendingEntries.length,
        totalWaitTime: queueData.totalWaitTime,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── ADD WALK-IN (RECEPTIONIST) ───────────────────────────────────────────────
exports.addWalkIn = async (req, res) => {
  try {
    const { clientName, serviceId, stylistId } = req.body;
    const storeId = req.user.storeId;
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    if (!clientName || !serviceId || !stylistId)
      return res.status(400).json({
        message: "clientName, serviceId and stylistId are required.",
      });

    const store = await Store.findById(storeId);
    if (!store)
      return res.status(404).json({ message: "Store not found." });

    if (!store.isOpen)
      return res.status(403).json({ message: "Store is closed." });

    const service = store.services.id(serviceId);
    if (!service)
      return res.status(404).json({ message: "Service not found." });

    const stylistInStore = store.stylists.some(
      (s) => String(s) === String(stylistId)
    );
    if (!stylistInStore)
      return res.status(400).json({ message: "Stylist not found in store." });

    const expiryMinutes = store.settings?.queueExpiryMinutes ?? 30;
    const { assignQueueSlot } = require("../services/queueService");

    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const slot = await assignQueueSlot(storeId, today, timeStr, expiryMinutes);

    // ✅ Walk-in appointment — anonymous client
    // client field uses receptionist ID as placeholder
    // When walk-in scans QR → their ID replaces it
    const newAppointment = new Appointment({
      storeId,
      client: req.user.id,  // placeholder — updated when they scan QR
      stylist: stylistId,
      service: {
        name: service.name,
        price: service.price,
        durationMin: service.durationMin,
        durationMax: service.durationMax,
      },
      services: [
        {
          name: service.name,
          price: service.price,
          durationMin: service.durationMin,
          durationMax: service.durationMax,
        },
      ],
      totalAmount: service.price,
      date: today,
      time: timeStr,
      status: "CONFIRMED",
      bookingType: "NORMAL",
      queueNumber: slot.queueNumber,
      estimatedStartTime: slot.estimatedStartTime,
      expiryTime: slot.expiryTime,
      checkedIn: false,     // ✅ false — they check in by scanning QR
      paymentMethod: null,
      isPaid: false,
      isWalkIn: true,
      walkInClientName: clientName,
    });

    await newAppointment.save();

    const io = req.app.get("io");
    const queueData = await calculateLiveQueue(storeId, today);
    emitFullQueueRefresh(io, storeId, queueData);
    emitQueueUpdate(io, storeId, "queueChanged", {
      type: "WALK_IN_ADDED",
      queueNumber: slot.queueNumber,
      clientName,
    });

    return res.status(201).json({
      message: `Walk-in added to queue.`,
      clientName,
      queueNumber: slot.queueNumber,
      estimatedStartTime: slot.estimatedStartTime,
      expiryTime: slot.expiryTime,
      appointmentId: newAppointment._id,
      // ✅ Receptionist shows this to the walk-in client
      // Client scans store QR to confirm arrival
      instruction: "Ask the client to scan the store QR code to confirm their arrival and see their queue number.",
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};