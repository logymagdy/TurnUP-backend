const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // ✅ title immediately after userId as required by Fix 3
    title: { type: String, default: "TurnUP" },
    type: {
      type: String,
      enum: [
        // ✅ Queue notifications
        "QUEUE_JOINED",
        "YOURE_NEXT",
        "TEN_MINS_LEFT",
        "SERVICE_STARTED",
        "SERVICE_DONE",
        "TURN_EXPIRED",

        // ✅ Booking notifications
        "BOOKING_CONFIRMED",
        "BOOKING_CANCELLED",
        "RATING_PROMPT",
        "NEW_BOOKING",
        "CLIENT_CHECKED_IN",
        "CANCELLATION",

        // ✅ Payment notifications
        "PENALTY_APPLIED",
        "SUBSCRIPTION_DUE",

        // ✅ Marketing notifications
        "PROMOTION",
        "SPECIAL_OFFER",

        // ✅ Store notifications
        "STORE_SUSPENDED",
        "WARNING_ISSUED",
      ],
      required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    referenceType: {
      type: String,
      enum: ["QUEUE", "APPOINTMENT", "STORE", "PAYMENT", null],
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);