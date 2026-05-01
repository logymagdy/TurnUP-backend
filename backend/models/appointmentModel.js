const mongoose = require("mongoose");

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
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_SERVICE", "DONE", "CANCELLED", "NO_SHOW"],
      default: "PENDING",
    },
    bookingType: {
      type: String,
      enum: ["NORMAL", "HOME", "EVENT"],
      default: "NORMAL",
    },
    address: { type: String, default: null },

    // Queue
    queueNumber: { type: Number, default: null },
    checkedIn: { type: Boolean, default: false },
    checkInTime: { type: Date, default: null },

    // Payment & Deposit
    deposit: { type: Number, default: 0 },
    depositPaid: { type: Boolean, default: false },
    depositRefunded: { type: Boolean, default: false },
    paymentId: { type: String, default: null },
    isPaid: { type: Boolean, default: false },
    paymentMethod: {
      type: String,
      enum: ["CARD", "INSTAPAY", "CASH", null],
      default: null,
    },

    // Group Bookings
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

    // Post-Service
    rating: { type: Number, min: 1, max: 5, default: null },
    review: { type: String, default: null },
    ratedAt: { type: Date, default: null },
    ratingDeadline: { type: Date, default: null },

    // Cancellation
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