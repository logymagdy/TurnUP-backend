const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "QUEUE_JOINED",
        "YOURE_NEXT",
        "TEN_MINS_LEFT",
        "SERVICE_STARTED",
        "SERVICE_DONE",
        "TURN_EXPIRED",
        "BOOKING_CONFIRMED",
        "BOOKING_CANCELLED",
        "PROMOTION",
        "SUBSCRIPTION_DUE",
        "WARNING_ISSUED",
        "STORE_SUSPENDED",
        "PENALTY_APPLIED",
        "RATING_PROMPT",
        "NEW_BOOKING",
        "CLIENT_CHECKED_IN",
        "CANCELLATION",
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

module.exports = mongoose.model("Notification", notificationSchema);