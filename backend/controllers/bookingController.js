const Appointment = require("../models/appointmentModel");
const Store = require("../models/storeModel");
const { success, error } = require("../utils/responseHandler");
const { sendNotification } = require("../services/notificationService");

// ─── CREATE BOOKING ───────────────────────────────────────────────────────────
exports.createBooking = async (req, res) => {
  try {
    const {
      storeId,
      stylistId,
      service,
      date,
      time,
      bookingType,
      address,
    } = req.body;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const existingAppointment = await Appointment.findOne({
      stylist: stylistId,
      date,
      time,
      status: { $in: ["PENDING", "CONFIRMED", "IN_SERVICE"] },
    });

    if (existingAppointment)
      return res.status(400).json({ message: "Stylist already booked for this time" });

    // Calculate deposit based on store's depositType (FIXED or PERCENTAGE)
    let depositAmount = 0;
    if (bookingType === "HOME" || bookingType === "EVENT") {
      if (store.depositType === "FIXED") {
        depositAmount = store.depositAmount || 0;
      } else if (store.depositType === "PERCENTAGE") {
        const serviceData = store.services.find(
          (s) => s.name === service.name
        );
        if (serviceData) {
          depositAmount = (serviceData.price * store.depositAmount) / 100;
        }
      }
    }

    // Assign next queue number for today
    const today = new Date().toISOString().split("T")[0];
    const lastEntry = await Appointment.findOne({
      storeId,
      date: today,
    }).sort({ queueNumber: -1 });

    const queueNumber = lastEntry && lastEntry.queueNumber
      ? lastEntry.queueNumber + 1
      : 1;

    const newAppointment = new Appointment({
      storeId,
      client: req.user.id,
      stylist: stylistId,
      service,
      date,
      time,
      bookingType: bookingType || "NORMAL",
      address: bookingType === "HOME" || bookingType === "EVENT" ? address : null,
      deposit: depositAmount,
      depositPaid: false,
      queueNumber,
      checkedIn: false,
    });

    await newAppointment.save();

    // Notify client — booking confirmed
    await sendNotification(
      req.user.id,
      "BOOKING_CONFIRMED",
      `Your booking at ${store.storeName} is confirmed. Queue #${queueNumber} on ${date} at ${time}.`,
      "Booking Confirmed",
      newAppointment._id,
      "APPOINTMENT"
    );

    // Notify store owner — new booking arrived
    await sendNotification(
      store.owner,
      "NEW_BOOKING",
      `New booking received from a client. Queue #${queueNumber} on ${date} at ${time}.`,
      "New Booking",
      newAppointment._id,
      "APPOINTMENT"
    );

    return res.status(201).json({
      message: "Booking created successfully",
      appointment: newAppointment,
      requiresDeposit: depositAmount > 0,
      depositAmount,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET MY BOOKINGS ──────────────────────────────────────────────────────────
exports.getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;

    const query = { client: req.user.id };
    if (status) query.status = status;

    const bookings = await Appointment.find(query)
      .populate("storeId", "storeName location logo")
      .populate("stylist", "name")
      .sort({ date: -1, time: -1 });

    return success(res, "Bookings retrieved", bookings);
  } catch (err) {
    return error(res, "Failed to get bookings", 500);
  }
};

// ─── GET STORE BOOKINGS ───────────────────────────────────────────────────────
exports.getStoreBookings = async (req, res) => {
  try {
    const { date } = req.query;

    if (!req.user.storeId)
      return res.status(403).json({ message: "Not associated with a store" });

    const bookings = await Appointment.find({
      storeId: req.user.storeId,
      date,
    })
      .populate("client", "name phone")
      .populate("stylist", "name")
      .sort({ time: 1 });

    const categorized = {
      morning: bookings.filter((b) => parseInt(b.time.split(":")[0]) < 12),
      afternoon: bookings.filter((b) => {
        const hour = parseInt(b.time.split(":")[0]);
        return hour >= 12 && hour < 18;
      }),
      evening: bookings.filter((b) => parseInt(b.time.split(":")[0]) >= 18),
    };

    return res.json(categorized);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── CANCEL BOOKING ───────────────────────────────────────────────────────────
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { refundMethod } = req.body;

    const appointment = await Appointment.findById(bookingId);
    if (!appointment)
      return res.status(404).json({ message: "Booking not found" });

    if (String(appointment.client) !== String(req.user.id))
      return res.status(403).json({ message: "Not authorized to cancel this booking" });

    if (["DONE", "CANCELLED"].includes(appointment.status))
      return res.status(400).json({ message: "Cannot cancel this booking" });

    // Read refund policy from store — store owner controls this, backend enforces it
    const store = await Store.findById(appointment.storeId);
    if (!store)
      return res.status(404).json({ message: "Store not found" });

    const policy = store.refundPolicy;
    const allowedMinutes = policy?.allowedCancellationMinutes ?? 30;
    const refundType = policy?.refundType ?? "FULL";
    const partialRefundPercentage = policy?.partialRefundPercentage ?? 0;

    const appointmentTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const minutesUntilAppointment = (appointmentTime - now) / (1000 * 60);

    let refundAmount = 0;
    if (minutesUntilAppointment >= allowedMinutes) {
      if (refundType === "FULL") {
        refundAmount = appointment.deposit;
      } else if (refundType === "PARTIAL") {
        refundAmount = (appointment.deposit * partialRefundPercentage) / 100;
      } else {
        refundAmount = 0;
      }
    } else {
      refundAmount = 0;
    }

    appointment.status = "CANCELLED";
    appointment.cancelledBy = "CLIENT";
    await appointment.save();

    // Notify client — booking cancelled
    await sendNotification(
      req.user.id,
      "BOOKING_CANCELLED",
      `Your booking at ${store.storeName} has been cancelled. Refund: ${refundAmount} EGP.`,
      "Booking Cancelled",
      appointment._id,
      "APPOINTMENT"
    );

    // Notify store owner — booking cancelled by client
    await sendNotification(
      store.owner,
      "CANCELLATION",
      `A client cancelled their booking. Queue #${appointment.queueNumber}. Refund issued: ${refundAmount} EGP.`,
      "Booking Cancelled",
      appointment._id,
      "APPOINTMENT"
    );

    return success(res, "Booking cancelled successfully", {
      refundAmount,
      refundMethod: refundMethod || null,
    });
  } catch (err) {
    return error(res, "Failed to cancel booking", 500);
  }
};