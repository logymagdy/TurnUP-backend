const mongoose = require("mongoose");

const queueEntrySchema = new mongoose.Schema({
  queueNumber: Number,
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  clientName: String,
  stylist: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  service: String,
  isWalkIn: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["WAITING", "ARRIVED", "IN_SERVICE", "DONE", "EXPIRED", "CANCELLED"],
    default: "WAITING",
  },
  estimatedStartTime: String,
  actualStartTime: String,
  actualEndTime: String,
  seatNumber: { type: Number, default: null },
});

const queueSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },
  date: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  currentNumber: { type: Number, default: 0 },
  entries: [queueEntrySchema],
}, { timestamps: true });

module.exports = mongoose.model("Queue", queueSchema);