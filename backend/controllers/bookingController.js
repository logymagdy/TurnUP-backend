const Appointment = require("../models/appointmentModel");
const Store = require("../models/storeModel");
const { success, error } = require("../utils/responseHandler");

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

    // Check stylist availability
    const existingAppointment = await Appointment.findOne({
      stylist: stylistId,
      date,
      time,
      status: { $in: ["PENDING", "CONFIRMED", "IN_SERVICE"] },
    });

    if (existingAppointment)
      return res.status(400).json({ message: "Stylist already booked for this time" });

    // Calculate deposit
    let depositAmount = 0;
    if (bookingType === "HOME" || bookingType === "EVENT") {
      depositAmount = store.depositAmount || 0;
    }

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
    });

    await newAppointment.save();

    // Socket notification
    const io = req.app.get("io");
    if (io) {
      io.to(`store:${storeId}`).emit("newBooking", {
        message: "New appointment booked!",
        appointment: newAppointment,
      });
    }

    res.status(201).json({
      message: "Booking created successfully",
      appointment: newAppointment,
      requiresDeposit: depositAmount > 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

    res.json(categorized);
  } catch (err) {
    res.status(500).json({ message: err.message });
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

    // Check cancellation policy
    const appointmentTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const minutesDiff = (appointmentTime - now) / (1000 * 60);

    let refundAmount = 0;
    if (minutesDiff >= 30) {
      refundAmount = appointment.deposit;
    }

    appointment.status = "CANCELLED";
    appointment.cancelledBy = "CLIENT";
    await appointment.save();

    return success(res, "Booking cancelled successfully", {
      refundAmount,
      refundMethod: refundMethod || null,
    });
  } catch (err) {
    return error(res, "Failed to cancel booking", 500);
  }
};