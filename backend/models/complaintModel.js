const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
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

    // ✅ Updated categories to match screen exactly
    category: {
      type: String,
      enum: [
        "RUDE_STAFF",
        "LONG_WAIT",
        "PAYMENT_ISSUE",
        "OVERCHARGING",
        "HYGIENE",
        "INAPPROPRIATE_BEHAVIOR",
        "LOW_QUALITY",
        "FAKE_SERVICE",
        "SCAM",
        "OTHER",
      ],
      required: true,
    },
    message: { type: String, default: null },

    // ✅ Evidence photos — optional
    images: [{ type: String }],

    status: {
      type: String,
      enum: ["SUBMITTED", "IN_REVIEW", "RESOLVED"],
      default: "SUBMITTED",
    },

    storeResponse: {
      message: { type: String, default: null },
      images: [{ type: String }],
      respondedAt: { type: Date, default: null },
    },

    adminNotes: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);