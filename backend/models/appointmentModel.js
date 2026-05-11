const mongoose = require("mongoose");

const serviceItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    durationMin: { type: Number, default: 0 },
    durationMax: { type: Number, default: 0 },
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stylist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Primary service (queue display & backward compat) ──────────────
    service: {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      durationMin: Number,
      durationMax: Number,
    },

    // ── Multi-service list ─────────────────────────────────────────────
    services: {
      type: [serviceItemSchema],
      default: [],
    },

    // ── Computed total across all selected services ────────────────────
    totalAmount: { type: Number, default: 0 },

    date: { type: String, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "CHECKED_IN",
        "IN_SERVICE",
        "DONE",
        "CANCELLED",
        "NO_SHOW",
        "EXPIRED",
      ],
      default: "PENDING",
    },
    bookingType: {
      type: String,
      enum: ["NORMAL", "HOME", "EVENT"],
      default: "NORMAL",
    },
    address: { type: String, default: null },

    // ── Queue fields ───────────────────────────────────────────────────
    queueNumber: { type: Number, default: null },
    estimatedStartTime: { type: Date, default: null },
    expiryTime: { type: Date, default: null },
    checkedIn: { type: Boolean, default: false },
    checkInTime: { type: Date, default: null },
    actualStartTime: { type: Date, default: null },
    actualEndTime: { type: Date, default: null },

    // ── Payment & Deposit ──────────────────────────────────────────────
    deposit: { type: Number, default: 0 },
    depositPaid: { type: Boolean, default: false },
    depositRefunded: { type: Boolean, default: false },
    paymentId: { type: String, default: null },
    isPaid: { type: Boolean, default: false },
    paymentMethod: {
      type: String,
      enum: ["CARD", "CASH", null],
      default: null,
    },

    // ── Refund safety ──────────────────────────────────────────────────
    refundId: { type: String, default: null },
    refundedAt: { type: Date, default: null },

    // ── Group Bookings ─────────────────────────────────────────────────
    isGroupBooking: { type: Boolean, default: false },
    groupMembers: [
      {
        clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        clientName: String,
        service: {
          name: String,
          price: Number,
          durationMin: Number,
          durationMax: Number,
        },
      },
    ],
    totalGroupPrice: { type: Number, default: 0 },

    // ── Post-Service ───────────────────────────────────────────────────
    rating: { type: Number, min: 1, max: 5, default: null },
    review: { type: String, default: null },
    ratedAt: { type: Date, default: null },
    ratingDeadline: { type: Date, default: null },

    // ── Complaint — one per appointment, set after submission ──────────
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      default: null,
    },

    // ── Cancellation ───────────────────────────────────────────────────
    cancelledBy: {
      type: String,
      enum: ["CLIENT", "STORE", null],
      default: null,
    },
    cancellationReason: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);