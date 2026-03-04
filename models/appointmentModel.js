const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
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
    name: String,
    price: Number,
    durationMin: Number,
    durationMax: Number,
  },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "IN_SERVICE", "DONE", "CANCELLED", "NO_SHOW"],
    default: "PENDING",
  },
  bookingType: {
    type: String,
    enum: ["NORMAL", "HOME", "EVENT"],
    default: "NORMAL",
  },
  address: { type: String, default: null },
  deposit: { type: Number, default: 0 },
  rating: { type: Number, min: 1, max: 5, default: null },
  review: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);