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
    service: {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      durationMin: Number,
      durationMax: Number,
    },
    services: { type: [serviceItemSchema], default: [] },
    totalAmount: { type: Number, default: 0 },
    date: { type: String, required: true },
    time: { type: String, required: true },

    // ✅ No PENDING — auto CONFIRMED
    status: {
      type: String,
      enum: [
        "CONFIRMED",
        "CHECKED_IN",
        "IN_SERVICE",
        "DONE",
        "CANCELLED",
        "NO_SHOW",
        "EXPIRED",
      ],
      default: "CONFIRMED",
    },

    bookingType: {
      type: String,
      enum: ["NORMAL", "HOME", "EVENT"],
      default: "NORMAL",
    },
    address: { type: String, default: null },

    // ✅ Walk-in support
    isWalkIn: { type: Boolean, default: false },
    walkInClientName: { type: String, default: null },

    // ── Queue ──────────────────────────────────────────────────────────
    queueNumber: { type: Number, default: null },
    estimatedStartTime: { type: Date, default: null },
    expiryTime: { type: Date, default: null },
    checkedIn: { type: Boolean, default: false },
    checkInTime: { type: Date, default: null },
    actualStartTime: { type: Date, default: null },
    actualEndTime: { type: Date, default: null },

    // ✅ Expiry warning tracking
    expiryWarningsSent: {
      thirtyMin: { type: Boolean, default: false },
      tenMin: { type: Boolean, default: false },
    },

    // ✅ You're next notification tracking
    youreNextSent: { type: Boolean, default: false },

    // ── Payment ────────────────────────────────────────────────────────
    deposit: { type: Number, default: 0 },
    depositPaid: { type: Boolean, default: false },
    depositRefunded: { type: Boolean, default: false },
    paymentId: { type: String, default: null },
    isPaid: { type: Boolean, default: false },

    // ✅ Updated payment method — CARD or PAY_AT_STORE
    paymentMethod: {
      type: String,
      enum: ["CARD", "PAY_AT_STORE", null],
      default: null,
    },

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
    reviewPhotos: [{ type: String }],
    ratedAt: { type: Date, default: null },
    ratingDeadline: { type: Date, default: null },

    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      default: null,
    },

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