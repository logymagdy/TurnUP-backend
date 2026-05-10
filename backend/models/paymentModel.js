const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    stylist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    amount: { type: Number, required: true },
    adminCut: { type: Number, default: 0 },
    storeCut: { type: Number, default: 0 },
    type: {
      type: String,
      enum: ["SERVICE", "TIP", "DEPOSIT", "PENALTY", "SUBSCRIPTION", "REFUND"],
      required: true,
    },
    method: {
      type: String,
      enum: ["CARD", "CASH"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    // ── Gateway fields (Paymob) ────────────────────────────────────────
    paymobOrderId: { type: String, default: null },
    paymobTransactionId: { type: String, default: null },

    // ── Refund audit ───────────────────────────────────────────────────
    refundedAmount: { type: Number, default: 0 },
    refundedAt: { type: Date, default: null },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    referenceType: {
      type: String,
      enum: ["QUEUE_ENTRY", "APPOINTMENT", null],
      default: null,
    },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);