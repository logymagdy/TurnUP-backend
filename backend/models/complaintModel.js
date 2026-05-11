const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    // ── Core links — all auto-set, never from client input ─────────────
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true, // one complaint per appointment, enforced at DB level
    },
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

    // ── Client submission ──────────────────────────────────────────────
    category: {
      type: String,
      enum: ["RUDE_STAFF", "PAYMENT_ISSUE", "LONG_WAIT", "HYGIENE", "SCAM", "OTHER"],
      required: true,
    },
    message: { type: String, default: null },
    images: [{ type: String }],

    // ── Client-facing status only — never expose adminNotes to client ──
    status: {
      type: String,
      enum: ["SUBMITTED", "IN_REVIEW", "RESOLVED"],
      default: "SUBMITTED",
    },

    // ── Store owner response ───────────────────────────────────────────
    storeResponse: {
      message: { type: String, default: null },
      images: [{ type: String }],
      respondedAt: { type: Date, default: null },
    },

    // ── Admin internal only — never returned in client-facing routes ───
    adminNotes: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);