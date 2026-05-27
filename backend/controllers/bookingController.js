const Appointment = require("../models/appointmentModel");
const Payment = require("../models/paymentModel");
const Store = require("../models/storeModel");
const User = require("../models/userModel");
const { success, error } = require("../utils/responseHandler");
const { sendNotification } = require("../services/notificationServices");
const { assignQueueSlot, calculateLiveQueue } = require("../services/queueService");
const { emitQueueUpdate, emitFullQueueRefresh } = require("../services/queueSocket");

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const refreshQueue = async (io, storeId, date) => {
  const queueData = await calculateLiveQueue(storeId, date);
  emitFullQueueRefresh(io, storeId, queueData);
};

const deduplicateServices = (services) => {
  const seen = new Set();
  return services.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });
};

const calculateServicesTotal = (services) => {
  return services.reduce((sum, s) => sum + (s.price || 0), 0);
};

// ─── CREATE BOOKING ───────────────────────────────────────────────────────────
exports.createBooking = async (req, res) => {
  try {
    const {
      storeId,
      stylistId,
      services: rawServices,
      date,
      time,
      bookingType,
      address,
      isGroupBooking,
      groupMembers,
      paymentMethod,
    } = req.body;

    const store = await Store.findById(storeId);
    if (!store)
      return res.status(404).json({ message: "Store not found." });

    if (store.approvalStatus !== "APPROVED")
      return res.status(403).json({ message: "This store is not currently accepting bookings." });

    if (!store.isOpen)
      return res.status(403).json({ message: "This store is currently closed." });

    if (store.isPaused)
      return res.status(403).json({ message: "This store is temporarily paused." });

    if (
      store.operationalStatus === "SUSPENDED" ||
      store.operationalStatus === "BANNED"
    )
      return res.status(403).json({ message: "This store is temporarily unavailable." });

    const client = await User.findById(req.user.id).select("debt");
    if (client.debt > 0)
      return res.status(403).json({
        message: `You have an outstanding debt of ${client.debt} EGP. Please clear it before booking.`,
        debt: client.debt,
      });

    if (!rawServices || !Array.isArray(rawServices) || rawServices.length === 0)
      return res.status(400).json({ message: "At least one service is required." });

    const services = deduplicateServices(rawServices);

    for (const svc of services) {
      if (!svc.durationMin || !svc.durationMax || svc.durationMin <= 0 || svc.durationMax <= 0)
        return res.status(400).json({
          message: `Service "${svc.name}" has invalid duration.`,
        });

      const storeService = store.services.find(
        (s) => s.name === svc.name && s.isActive
      );
      if (!storeService)
        return res.status(400).json({
          message: `Service "${svc.name}" is not available at this store.`,
        });
      if (storeService.price !== svc.price)
        return res.status(400).json({
          message: `Price mismatch for "${svc.name}". Expected ${storeService.price} EGP.`,
        });
    }

    const totalAmount = calculateServicesTotal(services);
    const primaryService = services[0];

    const existingAppointment = await Appointment.findOne({
      stylist: stylistId,
      date,
      time,
      status: { $in: ["CONFIRMED", "CHECKED_IN", "IN_SERVICE"] },
    });

    if (existingAppointment)
      return res.status(400).json({ message: "Stylist already booked for this time." });

    const stylistInStore = store.stylists.some(
      (s) => String(s) === String(stylistId)
    );
    if (!stylistInStore)
      return res.status(400).json({ message: "Selected stylist does not belong to this store." });

    let totalGroupPrice = 0;
    let validatedGroupMembers = [];

    if (isGroupBooking) {
      if (!groupMembers || groupMembers.length < 1)
        return res.status(400).json({
          message: "Group booking requires at least 2 members.",
        });

      const maxGroup =
        bookingType === "HOME" || bookingType === "EVENT" ? 7 : 2;

      if (groupMembers.length + 1 > maxGroup)
        return res.status(400).json({
          message: `Group size exceeds maximum (${maxGroup} members).`,
        });

      totalGroupPrice = groupMembers.reduce(
        (sum, m) => sum + (m.service?.price || 0),
        totalAmount
      );
      validatedGroupMembers = groupMembers;
    }

    let depositAmount = 0;
    if (bookingType === "HOME" || bookingType === "EVENT") {
      if (!address)
        return res.status(400).json({ message: "Address required for HOME/EVENT." });

      if (store.depositType === "FIXED") {
        depositAmount = store.depositAmount || 0;
      } else if (store.depositType === "PERCENTAGE") {
        depositAmount = (totalAmount * store.depositAmount) / 100;
      }

      if (depositAmount > 0 && paymentMethod !== "PAY_AT_STORE") {
        return res.status(400).json({
          message: "HOME/EVENT bookings require a deposit.",
          depositAmount,
          requiresDeposit: true,
        });
      }
    }

    let queueNumber = null;
    let estimatedStartTime = null;
    let expiryTime = null;

    if (!bookingType || bookingType === "NORMAL") {
      const expiryMinutes = store.settings?.queueExpiryMinutes ?? 30;
      const slot = await assignQueueSlot(storeId, date, time, expiryMinutes);
      queueNumber = slot.queueNumber;
      estimatedStartTime = slot.estimatedStartTime;
      expiryTime = slot.expiryTime;
    }

    const newAppointment = new Appointment({
      storeId,
      client: req.user.id,
      stylist: stylistId,
      service: primaryService,
      services,
      totalAmount,
      date,
      time,
      status: "CONFIRMED",
      bookingType: bookingType || "NORMAL",
      address: bookingType === "HOME" || bookingType === "EVENT" ? address : null,
      deposit: depositAmount,
      depositPaid: false,
      queueNumber,
      estimatedStartTime,
      expiryTime,
      checkedIn: false,
      paymentMethod: paymentMethod || null,
      isPaid: false,
      isGroupBooking: isGroupBooking || false,
      groupMembers: isGroupBooking ? validatedGroupMembers : [],
      totalGroupPrice: isGroupBooking ? totalGroupPrice : 0,
    });

    await newAppointment.save();

    const io = req.app.get("io");
    await refreshQueue(io, storeId, date);
    emitQueueUpdate(io, storeId, "queueChanged", {
      type: "NEW_BOOKING",
      queueNumber,
      date,
      time,
    });

    const queueMsg = queueNumber
      ? `Queue #${queueNumber} on ${date} at ${time}.`
      : `Appointment on ${date} at ${time}.`;

    await sendNotification(
      req.user.id,
      "BOOKING_CONFIRMED",
      `Your booking at ${store.storeName} is confirmed. ${queueMsg}`,
      "Booking Confirmed",
      newAppointment._id,
      "APPOINTMENT"
    );

    await sendNotification(
      store.owner,
      "NEW_BOOKING",
      `New booking received. ${queueMsg}`,
      "New Booking",
      newAppointment._id,
      "APPOINTMENT"
    );

    return res.status(201).json({
      message: "Booking created successfully.",
      appointment: newAppointment,
      requiresDeposit: depositAmount > 0,
      depositAmount,
      totalAmount,
      servicesCount: services.length,
      queueNumber,
      estimatedStartTime,
      expiryTime,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET MY BOOKINGS ──────────────────────────────────────────────────────────
// ✅ Returns active bookings for "Bookings" tab
exports.getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {
      client: req.user.id,
      status: { $in: ["CONFIRMED", "CHECKED_IN", "IN_SERVICE"] },
    };

    if (status) query.status = status;

    const bookings = await Appointment.find(query)
      .populate("storeId", "storeName location logo rating numReviews")
      .populate("stylist", "username avatar")
      .sort({ date: 1, time: 1 });

    return success(res, "Bookings retrieved", bookings);
  } catch (err) {
    return error(res, "Failed to get bookings", 500);
  }
};

// ─── GET BOOKING HISTORY ──────────────────────────────────────────────────────
// ✅ Returns completed/cancelled for "Booking History" tab
// Shows: services list, total paid, status badge, date, time, specialist
exports.getBookingHistory = async (req, res) => {
  try {
    const { filter } = req.query;
    // filter: "all" | "completed" | "cancelled"

    const query = {
      client: req.user.id,
      status: { $in: ["DONE", "CANCELLED", "EXPIRED", "NO_SHOW"] },
    };

    if (filter === "completed") query.status = "DONE";
    if (filter === "cancelled")
      query.status = { $in: ["CANCELLED", "EXPIRED", "NO_SHOW"] };

    const bookings = await Appointment.find(query)
      .populate("storeId", "storeName location logo rating numReviews")
      .populate("stylist", "username avatar rating")
      .sort({ date: -1, time: -1 });

    // ✅ Add visit count
    const visitCount = await Appointment.countDocuments({
      client: req.user.id,
      status: "DONE",
    });

    const result = bookings.map((b) => ({
      _id: b._id,
      storeId: b.storeId,
      stylist: b.stylist,
      services: b.services,
      totalAmount: b.totalAmount,
      date: b.date,
      time: b.time,
      status: b.status,
      paymentMethod: b.paymentMethod,
      rating: b.rating,
      complaintId: b.complaintId,
      isGroupBooking: b.isGroupBooking,
      cancelledBy: b.cancelledBy,
      cancellationReason: b.cancellationReason,
      createdAt: b.createdAt,
    }));

    return success(res, "Booking history retrieved", {
      visitCount,
      bookings: result,
    });
  } catch (err) {
    return error(res, "Failed to get booking history", 500);
  }
};

// ─── GET BOOKING DETAILS ──────────────────────────────────────────────────────
// ✅ Full details for Booking Details screen
exports.getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const appointment = await Appointment.findById(bookingId)
      .populate("storeId", "storeName location logo phone rating")
      .populate("stylist", "username avatar rating");

    if (!appointment)
      return res.status(404).json({ message: "Booking not found." });

    if (String(appointment.client) !== String(req.user.id))
      return res.status(403).json({ message: "Not authorized." });

    return success(res, "Booking details retrieved", appointment);
  } catch (err) {
    return error(res, "Failed to get booking details", 500);
  }
};

// ─── GET RECEIPT ──────────────────────────────────────────────────────────────
// ✅ Get receipt after confirmed booking
exports.getReceipt = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const appointment = await Appointment.findById(bookingId)
      .populate("storeId", "storeName location logo phone")
      .populate("stylist", "username avatar");

    if (!appointment)
      return res.status(404).json({ message: "Booking not found." });

    if (String(appointment.client) !== String(req.user.id))
      return res.status(403).json({ message: "Not authorized." });

    const payment = await Payment.findOne({
      appointmentId: bookingId,
      status: { $in: ["COMPLETED", "PENDING"] },
    });

    return res.status(200).json({
      message: "Receipt retrieved",
      receipt: {
        bookingId: appointment._id,
        salon: appointment.storeId,
        stylist: appointment.stylist,
        services: appointment.services,
        totalAmount: appointment.totalAmount,
        date: appointment.date,
        time: appointment.time,
        queueNumber: appointment.queueNumber,
        estimatedStartTime: appointment.estimatedStartTime,
        paymentMethod: appointment.paymentMethod,
        isPaid: appointment.isPaid,
        paymentStatus: payment?.status || "PENDING",
        status: appointment.status,
        createdAt: appointment.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── REBOOK ───────────────────────────────────────────────────────────────────
// ✅ Rebook from history — returns previous booking data pre-filled
exports.getRebookData = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const appointment = await Appointment.findById(bookingId)
      .populate("storeId", "storeName location logo rating services stylists isOpen isPaused operationalStatus approvalStatus")
      .populate("stylist", "username avatar rating");

    if (!appointment)
      return res.status(404).json({ message: "Booking not found." });

    if (String(appointment.client) !== String(req.user.id))
      return res.status(403).json({ message: "Not authorized." });

    // ✅ Check if store is still available
    const store = appointment.storeId;
    const storeAvailable =
      store.approvalStatus === "APPROVED" &&
      store.operationalStatus === "ACTIVE";

    return res.status(200).json({
      message: "Rebook data retrieved",
      rebookData: {
        store: {
          _id: store._id,
          storeName: store.storeName,
          location: store.location,
          logo: store.logo,
          rating: store.rating,
          isAvailable: storeAvailable,
        },
        previousServices: appointment.services,
        previousStylist: appointment.stylist,
        bookingType: appointment.bookingType,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET STORE BOOKINGS ───────────────────────────────────────────────────────
exports.getStoreBookings = async (req, res) => {
  try {
    const { date } = req.query;

    if (!req.user.storeId)
      return res.status(403).json({ message: "Not associated with a store." });

    const bookings = await Appointment.find({
      storeId: req.user.storeId,
      date,
    })
      .populate("client", "username phone")
      .populate("stylist", "username")
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

// ─── CANCEL BOOKING (CLIENT) ──────────────────────────────────────────────────
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { refundMethod } = req.body;

    const appointment = await Appointment.findById(bookingId);
    if (!appointment)
      return res.status(404).json({ message: "Booking not found." });

    if (String(appointment.client) !== String(req.user.id))
      return res.status(403).json({ message: "Not authorized." });

    if (["DONE", "CANCELLED", "EXPIRED"].includes(appointment.status))
      return res.status(400).json({ message: "Cannot cancel this booking." });

    if (appointment.refundId)
      return res.status(400).json({ message: "Refund already processed." });

    const store = await Store.findById(appointment.storeId);
    if (!store) return res.status(404).json({ message: "Store not found." });

    const policy = store.refundPolicy;
    const now = new Date();
    let refundAmount = 0;

    if (appointment.bookingType === "NORMAL") {
      const allowedMinutes = policy?.normalCancellationMinutes ?? 30;
      const estimatedStart = new Date(appointment.estimatedStartTime);
      const minutesUntilStart = (estimatedStart - now) / (1000 * 60);

      if (minutesUntilStart < allowedMinutes) {
        const penalty = store.settings?.noShowPenalty ?? 15;
        await User.findByIdAndUpdate(appointment.client, {
          $inc: { debt: penalty },
        });

        await sendNotification(
          req.user.id,
          "PENALTY_APPLIED",
          `Penalty of ${penalty} EGP applied for late cancellation.`,
          "Penalty Applied",
          appointment._id,
          "APPOINTMENT"
        );
      }
    } else {
      const allowedMinutes =
        appointment.bookingType === "HOME"
          ? policy?.homeCancellationMinutes ?? 30
          : policy?.eventCancellationMinutes ?? 60;

      const refundType = policy?.refundType ?? "FULL";
      const partialRefundPercentage = policy?.partialRefundPercentage ?? 0;
      const appointmentTime = new Date(
        `${appointment.date}T${appointment.time}`
      );
      const minutesUntilAppointment = (appointmentTime - now) / (1000 * 60);

      if (minutesUntilAppointment >= allowedMinutes) {
        if (refundType === "FULL") {
          refundAmount = appointment.deposit;
        } else if (refundType === "PARTIAL") {
          refundAmount =
            (appointment.deposit * partialRefundPercentage) / 100;
        }
      }

      if (refundAmount > 0 && appointment.depositPaid) {
        await User.findByIdAndUpdate(appointment.client, {
          $inc: { wallet: refundAmount },
        });

        const refundRecord = await Payment.create({
          client: appointment.client,
          storeId: appointment.storeId,
          appointmentId: appointment._id,
          amount: refundAmount,
          type: "REFUND",
          method: appointment.paymentMethod || "CARD",
          status: "COMPLETED",
          refundedAmount: refundAmount,
          refundedAt: now,
          referenceId: appointment._id,
          referenceType: "APPOINTMENT",
          notes: `Refund for cancelled ${appointment.bookingType} booking`,
        });

        appointment.refundId = String(refundRecord._id);
        appointment.refundedAt = now;
        appointment.depositRefunded = true;
      }
    }

    appointment.status = "CANCELLED";
    appointment.cancelledBy = "CLIENT";
    await appointment.save();

    const io = req.app.get("io");
    await refreshQueue(io, String(appointment.storeId), appointment.date);
    emitQueueUpdate(io, String(appointment.storeId), "queueChanged", {
      type: "CANCELLATION",
      queueNumber: appointment.queueNumber,
    });

    await sendNotification(
      req.user.id,
      "BOOKING_CANCELLED",
      `Your booking at ${store.storeName} has been cancelled. Refund: ${refundAmount} EGP.`,
      "Booking Cancelled",
      appointment._id,
      "APPOINTMENT"
    );

    await sendNotification(
      store.owner,
      "CANCELLATION",
      `Client cancelled booking. Queue #${appointment.queueNumber}.`,
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

// ─── CANCEL BOOKING (STORE) ───────────────────────────────────────────────────
exports.cancelBookingByStore = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(bookingId);
    if (!appointment)
      return res.status(404).json({ message: "Booking not found." });

    if (String(appointment.storeId) !== String(req.user.storeId))
      return res.status(403).json({ message: "Not authorized." });

    if (["DONE", "CANCELLED", "EXPIRED"].includes(appointment.status))
      return res.status(400).json({ message: "Cannot cancel this booking." });

    if (appointment.refundId)
      return res.status(400).json({ message: "Refund already processed." });

    const refundAmount = appointment.depositPaid
      ? appointment.deposit || 0
      : 0;

    if (refundAmount > 0) {
      await User.findByIdAndUpdate(appointment.client, {
        $inc: { wallet: refundAmount },
      });

      const refundRecord = await Payment.create({
        client: appointment.client,
        storeId: appointment.storeId,
        appointmentId: appointment._id,
        amount: refundAmount,
        type: "REFUND",
        method: appointment.paymentMethod || "CARD",
        status: "COMPLETED",
        refundedAmount: refundAmount,
        refundedAt: new Date(),
        referenceId: appointment._id,
        referenceType: "APPOINTMENT",
        notes: "Full refund — store cancelled",
      });

      appointment.refundId = String(refundRecord._id);
      appointment.refundedAt = new Date();
      appointment.depositRefunded = true;
    }

    appointment.status = "CANCELLED";
    appointment.cancelledBy = "STORE";
    appointment.cancellationReason = reason || null;
    await appointment.save();

    await User.findByIdAndUpdate(appointment.client, {
      $inc: { points: 50 },
    });

    const io = req.app.get("io");
    await refreshQueue(io, String(appointment.storeId), appointment.date);
    emitQueueUpdate(io, String(appointment.storeId), "queueChanged", {
      type: "STORE_CANCELLATION",
      queueNumber: appointment.queueNumber,
    });

    await sendNotification(
      appointment.client,
      "BOOKING_CANCELLED",
      `Booking cancelled by store. 50 loyalty points added. Refund: ${refundAmount} EGP.`,
      "Booking Cancelled by Store",
      appointment._id,
      "APPOINTMENT"
    );

    return res.status(200).json({
      message: "Booking cancelled. Client notified and 50 points awarded.",
      refundAmount,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── START SERVICE ────────────────────────────────────────────────────────────
exports.startService = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const appointment = await Appointment.findById(bookingId);
    if (!appointment)
      return res.status(404).json({ message: "Booking not found." });

    if (String(appointment.storeId) !== String(req.user.storeId))
      return res.status(403).json({ message: "Not authorized." });

    if (appointment.status !== "CHECKED_IN")
      return res.status(400).json({
        message: "Client must be checked in before service can start.",
      });

    appointment.status = "IN_SERVICE";
    appointment.actualStartTime = new Date();
    await appointment.save();

    const io = req.app.get("io");
    await refreshQueue(io, String(appointment.storeId), appointment.date);
    emitQueueUpdate(io, String(appointment.storeId), "queueChanged", {
      type: "SERVICE_STARTED",
      queueNumber: appointment.queueNumber,
    });

    await sendNotification(
      appointment.client,
      "SERVICE_STARTED",
      `Your service has started. Sit back and relax!`,
      "Service Started",
      appointment._id,
      "APPOINTMENT"
    );

    return res.status(200).json({ message: "Service started.", appointment });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── COMPLETE SERVICE ─────────────────────────────────────────────────────────
exports.completeService = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const appointment = await Appointment.findById(bookingId);
    if (!appointment)
      return res.status(404).json({ message: "Booking not found." });

    if (String(appointment.storeId) !== String(req.user.storeId))
      return res.status(403).json({ message: "Not authorized." });

    if (appointment.status !== "IN_SERVICE")
      return res.status(400).json({ message: "Service has not started yet." });

    appointment.status = "DONE";
    appointment.actualEndTime = new Date();
    appointment.ratingDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await appointment.save();

    const pointsEarned = Math.floor(
      appointment.totalAmount || appointment.service.price || 0
    );
    await User.findByIdAndUpdate(appointment.client, {
      $inc: { points: pointsEarned, visitCount: 1 },
    });

    const io = req.app.get("io");
    await refreshQueue(io, String(appointment.storeId), appointment.date);
    emitQueueUpdate(io, String(appointment.storeId), "queueChanged", {
      type: "SERVICE_DONE",
      queueNumber: appointment.queueNumber,
    });

    await sendNotification(
      appointment.client,
      "SERVICE_DONE",
      `Service complete! You earned ${pointsEarned} loyalty points.`,
      "Service Complete",
      appointment._id,
      "APPOINTMENT"
    );

    await sendNotification(
      appointment.client,
      "RATING_PROMPT",
      `How was your experience? Rate your stylist within 24 hours.`,
      "Rate Your Experience",
      appointment._id,
      "APPOINTMENT"
    );

    return res.status(200).json({
      message: "Service completed.",
      pointsEarned,
      appointment,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── MARK NO SHOW ─────────────────────────────────────────────────────────────
exports.markNoShow = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const appointment = await Appointment.findById(bookingId);
    if (!appointment)
      return res.status(404).json({ message: "Booking not found." });

    if (String(appointment.storeId) !== String(req.user.storeId))
      return res.status(403).json({ message: "Not authorized." });

    if (!["CONFIRMED", "CHECKED_IN"].includes(appointment.status))
      return res.status(400).json({ message: "Cannot mark as no-show." });

    appointment.status = "NO_SHOW";
    await appointment.save();

    const store = await Store.findById(appointment.storeId).select(
      "settings owner storeName"
    );
    const penalty = store?.settings?.noShowPenalty ?? 15;

    await User.findByIdAndUpdate(appointment.client, {
      $inc: { debt: penalty },
    });

    const io = req.app.get("io");
    await refreshQueue(io, String(appointment.storeId), appointment.date);
    emitQueueUpdate(io, String(appointment.storeId), "queueChanged", {
      type: "NO_SHOW",
      queueNumber: appointment.queueNumber,
    });

    await sendNotification(
      appointment.client,
      "TURN_EXPIRED",
      `Your turn expired. Penalty of ${penalty} EGP applied.`,
      "Turn Expired",
      appointment._id,
      "APPOINTMENT"
    );

    await sendNotification(
      appointment.client,
      "PENALTY_APPLIED",
      `No-show penalty of ${penalty} EGP added.`,
      "Penalty Applied",
      appointment._id,
      "APPOINTMENT"
    );

    return res.status(200).json({
      message: "Client marked as no-show. Penalty applied.",
      penalty,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── SUBMIT RATING ────────────────────────────────────────────────────────────
// ✅ Updated to support photo upload in review
exports.submitRating = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rating, review, photos } = req.body;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: "Rating must be between 1 and 5." });

    const appointment = await Appointment.findById(bookingId);
    if (!appointment)
      return res.status(404).json({ message: "Booking not found." });

    if (String(appointment.client) !== String(req.user.id))
      return res.status(403).json({ message: "Not authorized." });

    if (appointment.status !== "DONE")
      return res.status(400).json({ message: "Can only rate completed services." });

    if (appointment.rating)
      return res.status(400).json({ message: "Already rated." });

    const now = new Date();
    if (now > appointment.ratingDeadline)
      return res.status(400).json({ message: "Rating window expired (24 hours)." });

    appointment.rating = rating;
    appointment.review = review || null;
    appointment.reviewPhotos = photos || [];  // ✅ store review photos
    appointment.ratedAt = now;
    await appointment.save();

    const stylistAppointments = await Appointment.find({
      stylist: appointment.stylist,
      rating: { $ne: null },
    });

    const avgRating =
      stylistAppointments.reduce((sum, a) => sum + a.rating, 0) /
      stylistAppointments.length;

    await User.findByIdAndUpdate(appointment.stylist, {
      rating: Math.round(avgRating * 10) / 10,
    });

    // ✅ Update store rating
    const storeAppointments = await Appointment.find({
      storeId: appointment.storeId,
      rating: { $ne: null },
    });

    const storeAvgRating =
      storeAppointments.reduce((sum, a) => sum + a.rating, 0) /
      storeAppointments.length;

    await Store.findByIdAndUpdate(appointment.storeId, {
      rating: Math.round(storeAvgRating * 10) / 10,
      numReviews: storeAppointments.length,
    });

    return res.status(200).json({
      message: "Rating submitted successfully.",
      rating,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};