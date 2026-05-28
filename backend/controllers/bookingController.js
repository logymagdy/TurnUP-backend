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

    // ✅ Get client — debt will be auto-deducted on next payment
    const client = await User.findById(req.user.id).select("debt wallet");
    const hasDebt = client.debt > 0;

    if (!rawServices || !Array.isArray(rawServices) || rawServices.length === 0)
      return res.status(400).json({ message: "At least one service is required." });

    // ✅ Validate services exist in store
    const resolvedServices = rawServices.map((s) => {
      const storeService = store.services.id(s.serviceId || s._id);
      if (!storeService)
        throw new Error(`Service not found: ${s.serviceId || s._id}`);
      return {
        name: storeService.name,
        price: storeService.price,
        durationMin: storeService.durationMinutes || 15,
        durationMax: storeService.durationMinutes || 30,
      };
    });

    const services = deduplicateServices(resolvedServices);
    const primaryService = services[0];
    const totalAmount = calculateServicesTotal(services);

    // ✅ Validate stylist exists in store.stylists subdoc
    const stylistInStore = store.stylists.find(
      (s) => String(s._id) === String(stylistId)
    );
    if (!stylistInStore)
      return res.status(400).json({ message: "Stylist not found in store." });

    // ✅ Group booking validation
    let validatedGroupMembers = [];
    let totalGroupPrice = 0;
    if (isGroupBooking) {
      const maxGroup = store.settings?.maxGroupSize || 7;
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
      queueNumber,
      estimatedStartTime,
      expiryTime,
      totalAmount,
      // ✅ Tell frontend to show debt notice
      debtNotice: hasDebt ? {
        hasDebt: true,
        debtAmount: client.debt,
        message: `You have an outstanding balance of ${client.debt} EGP that will be added to your next payment.`,
      } : null,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET MY BOOKINGS ──────────────────────────────────────────────────────────
// ✅ Returns active bookings for client "Bookings" tab
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
      .sort({ date: 1, time: 1 });

    return success(res, "Bookings retrieved", bookings);
  } catch (err) {
    return error(res, "Failed to get bookings", 500);
  }
};

// ─── GET BOOKING HISTORY (CLIENT) ────────────────────────────────────────────
// ✅ Returns completed/cancelled for client "Booking History" tab
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
      .sort({ date: -1, time: -1 });

    // ✅ Add visit count
    const visitCount = await Appointment.countDocuments({
      client: req.user.id,
      status: "DONE",
    });

    const result = bookings.map((b) => ({
      _id: b._id,
      storeId: b.storeId,
      service: b.service,
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
exports.getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const appointment = await Appointment.findById(bookingId)
      .populate("storeId", "storeName location logo phone rating")

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
exports.getReceipt = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const appointment = await Appointment.findById(bookingId)
      .populate("storeId", "storeName location logo phone");

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
exports.getRebookData = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const appointment = await Appointment.findById(bookingId)
      .populate("storeId", "storeName location logo rating services stylists isOpen isPaused operationalStatus approvalStatus");

    if (!appointment)
      return res.status(404).json({ message: "Booking not found." });

    if (String(appointment.client) !== String(req.user.id))
      return res.status(403).json({ message: "Not authorized." });

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

// ─── GET STORE BOOKINGS (business booking history) ────────────────────────────
// Screen: "Booking History" — tabs: All / Today / This Week
// Groups by MORNING / AFTERNOON / EVENING
// Resolves stylist name from store.stylists subdoc (NOT User collection)
// Access: serviceProvider + RECEPTIONIST
exports.getStoreBookings = async (req, res) => {
  try {
    const { filter } = req.query;
    // filter: "all" | "today" | "week"

    if (!req.user.storeId)
      return res.status(403).json({ message: "Not associated with a store." });

    const storeId = req.user.storeId;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // ✅ Load store to resolve stylist names from subdoc
    const store = await Store.findById(storeId).select("stylists");

    // ── Build date filter ────────────────────────────────────────────────
    let dateFilter = {};
    if (filter === "today") {
      dateFilter = { date: todayStr };
    } else if (filter === "week") {
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        weekDays.push(d.toISOString().split("T")[0]);
      }
      dateFilter = { date: { $in: weekDays } };
    }
    // "all" = no date filter

    const bookings = await Appointment.find({
      storeId,
      ...dateFilter,
    })
      .populate("client", "username phone avatar")
      .sort({ date: -1, time: 1 });

    // ✅ Enrich each entry — resolve stylist name, calculate end time
    const enriched = bookings.map((b) => {
      const appt = b.toObject ? b.toObject() : b;

      // Stylist name from store.stylists subdoc
      const stylistMatch = store?.stylists?.find(
        (s) => String(s._id) === String(appt.stylist)
      );

      // Client name: walk-in name or registered client username
      const clientName = appt.isWalkIn
        ? appt.walkInClientName
        : appt.client?.username || "Unknown";

      // End time = start time + service duration avg
      const durationAvg = appt.service?.durationMin && appt.service?.durationMax
        ? Math.round((appt.service.durationMin + appt.service.durationMax) / 2)
        : 30;

      let endTime = null;
      if (appt.time) {
        const [h, m] = appt.time.split(":").map(Number);
        const endMinutes = h * 60 + m + durationAvg;
        const endH = Math.floor(endMinutes / 60) % 24;
        const endM = endMinutes % 60;
        endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
      }

      return {
        appointmentId: appt._id,
        date: appt.date,
        startTime: appt.time,
        endTime,
        clientName,
        clientAvatar: appt.client?.avatar || null,
        serviceName: appt.service?.name || null,
        stylistId: appt.stylist,
        stylistName: stylistMatch?.fullName || null,
        stylistPhoto: stylistMatch?.photo || null,
        status: appt.status,
        queueNumber: appt.queueNumber || null,
        isWalkIn: appt.isWalkIn || false,
        totalAmount: appt.totalAmount,
      };
    });

    // ── Group by time of day ─────────────────────────────────────────────
    const morning = enriched.filter((b) => {
      const hour = parseInt(b.startTime?.split(":")[0] || 0);
      return hour >= 0 && hour < 12;
    });
    const afternoon = enriched.filter((b) => {
      const hour = parseInt(b.startTime?.split(":")[0] || 0);
      return hour >= 12 && hour < 18;
    });
    const evening = enriched.filter((b) => {
      const hour = parseInt(b.startTime?.split(":")[0] || 0);
      return hour >= 18;
    });

    return res.status(200).json({
      filter: filter || "all",
      totalCount: enriched.length,
      grouped: {
        morning,
        afternoon,
        evening,
      },
    });
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
      const partialRefundPercentage = policy?.partialRefundPercentage ?? 50;

      if (appointment.depositPaid && appointment.deposit > 0) {
        if (refundType === "FULL") {
          refundAmount = appointment.deposit;
        } else if (refundType === "PARTIAL") {
          refundAmount = (appointment.deposit * partialRefundPercentage) / 100;
        }
      }
    }

    appointment.status = "CANCELLED";
    appointment.cancelledBy = "CLIENT";
    appointment.cancellationReason = req.body.reason || "Cancelled by client";
    await appointment.save();

    const io = req.app.get("io");
    await refreshQueue(io, String(appointment.storeId), appointment.date);

    await sendNotification(
      store.owner,
      "BOOKING_CANCELLED",
      `A booking has been cancelled by the client.`,
      "Booking Cancelled",
      appointment._id,
      "APPOINTMENT"
    );

    return res.status(200).json({
      message: "Booking cancelled successfully.",
      refundAmount,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── CANCEL BOOKING BY STORE ──────────────────────────────────────────────────
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

    let refundAmount = 0;
    if (appointment.depositPaid && appointment.deposit > 0) {
      refundAmount = appointment.deposit;
    }

    appointment.status = "CANCELLED";
    appointment.cancelledBy = "STORE";
    appointment.cancellationReason = reason || "Cancelled by store";
    await appointment.save();

    const io = req.app.get("io");
    await refreshQueue(io, String(appointment.storeId), appointment.date);

    // ✅ Award 50 loyalty points for store-cancelled bookings
    await User.findByIdAndUpdate(appointment.client, {
      $inc: { loyaltyPoints: 50 },
    });

    await sendNotification(
      appointment.client,
      "BOOKING_CANCELLED",
      `Your booking has been cancelled by the store. 50 loyalty points added. Refund: ${refundAmount} EGP.`,
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
// ✅ Accessible by RECEPTIONIST and serviceProvider
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
// ✅ Accessible by RECEPTIONIST and serviceProvider
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
    // ✅ Deadline to rate — 48 hours after completion
    appointment.ratingDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await appointment.save();

    // ✅ Award loyalty points
    const store = await Store.findById(appointment.storeId).select(
      "loyaltyProgram owner"
    );
    const pointsPerVisit = store?.loyaltyProgram?.pointsPerVisit || 10;
    await User.findByIdAndUpdate(appointment.client, {
      $inc: { loyaltyPoints: pointsPerVisit },
    });

    const io = req.app.get("io");
    await refreshQueue(io, String(appointment.storeId), appointment.date);
    emitQueueUpdate(io, String(appointment.storeId), "queueChanged", {
      type: "SERVICE_COMPLETED",
      queueNumber: appointment.queueNumber,
    });

    await sendNotification(
      appointment.client,
      "SERVICE_DONE",
      `Your service is complete. ${pointsPerVisit} loyalty points added! Rate your experience.`,
      "Service Complete",
      appointment._id,
      "APPOINTMENT"
    );

    return res.status(200).json({
      message: "Service completed.",
      appointment,
      pointsAwarded: pointsPerVisit,
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
      return res.status(400).json({ message: "Cannot mark this booking as no-show." });

    const store = await Store.findById(appointment.storeId).select("settings storeName");
    const penalty = store?.settings?.noShowPenalty ?? 15;

    appointment.status = "NO_SHOW";
    await appointment.save();

    await User.findByIdAndUpdate(appointment.client, {
      $inc: { debt: penalty },
    });

    const io = req.app.get("io");
    await refreshQueue(io, String(appointment.storeId), appointment.date);

    await sendNotification(
      appointment.client,
      "PENALTY_APPLIED",
      `No-show penalty of ${penalty} EGP applied at ${store.storeName}.`,
      "No-Show Penalty",
      appointment._id,
      "APPOINTMENT"
    );

    return res.status(200).json({
      message: `No-show recorded. ${penalty} EGP penalty applied.`,
      penaltyAmount: penalty,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── SUBMIT RATING ────────────────────────────────────────────────────────────
exports.submitRating = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rating, review, reviewPhotos } = req.body;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: "Rating must be between 1 and 5." });

    const appointment = await Appointment.findById(bookingId);
    if (!appointment)
      return res.status(404).json({ message: "Booking not found." });

    if (String(appointment.client) !== String(req.user.id))
      return res.status(403).json({ message: "Not authorized." });

    if (appointment.status !== "DONE")
      return res.status(400).json({ message: "Can only rate completed bookings." });

    if (appointment.rating)
      return res.status(400).json({ message: "Already rated." });

    if (appointment.ratingDeadline && new Date() > appointment.ratingDeadline)
      return res.status(400).json({ message: "Rating window has expired." });

    appointment.rating = rating;
    appointment.review = review || null;
    appointment.reviewPhotos = reviewPhotos || [];
    appointment.ratedAt = new Date();
    await appointment.save();

    // ✅ Update store rating
    const allRatings = await Appointment.find({
      storeId: appointment.storeId,
      rating: { $ne: null },
    }).select("rating");

    const avgRating =
      allRatings.reduce((sum, a) => sum + a.rating, 0) / allRatings.length;

    await Store.findByIdAndUpdate(appointment.storeId, {
      rating: Math.round(avgRating * 10) / 10,
      numReviews: allRatings.length,
    });

    return res.status(200).json({ message: "Rating submitted.", rating });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};