const mongoose = require("mongoose");

const queueEntrySchema = new mongoose.Schema({
  queueNumber: { type: Number, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  clientName: { type: String, default: "Walk-in" },
  stylist: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  service: {
    name: String,
    price: Number,
    durationMin: Number,
    durationMax: Number,
  },
  isWalkIn: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["WAITING", "ARRIVED", "IN_SERVICE", "DONE", "EXPIRED", "CANCELLED"],
    default: "WAITING",
  },
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
  estimatedStartTime: { type: String, default: null },
  actualStartTime: { type: String, default: null },
  actualEndTime: { type: String, default: null },
  seatNumber: { type: Number, default: null },
  penaltyApplied: { type: Boolean, default: false },
  penaltyAmount: { type: Number, default: 0 },
  loyaltyPointsAwarded: { type: Number, default: 0 },
});

const queueSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    date: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    currentNumber: { type: Number, default: 0 },
    entries: [queueEntrySchema],
  },
  { timestamps: true }
);

queueSchema.index({ storeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Queue", queueSchema);