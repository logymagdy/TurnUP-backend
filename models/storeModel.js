const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  storeName: {
    type: String,
    required: [true, "Store name is required"],
    trim: true,
  },
  storeType: {
    type: String,
    enum: ["barbershop", "beautySalon"],
    required: true,
  },
  location: {
    type: String,
    required: [true, "Location is required"],
  },
  phone: String,
  bio: String,
  logo: String,
  services: [
    {
      name: String,
      price: Number,
      durationMin: Number,
      durationMax: Number,
      isActive: { type: Boolean, default: true },
    },
  ],
  workingHours: {
    start: String,
    end: String,
  },
  offDays: [String],
  receptionists: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  stylists: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  seats: [
    {
      seatNumber: Number,
      isOccupied: { type: Boolean, default: false },
      currentEntryId: { type: mongoose.Schema.Types.ObjectId, default: null },
    },
  ],
  isOpen: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["ACTIVE", "SUSPENDED"],
    default: "ACTIVE",
  },
  loyaltyConversionRate: { type: Number, default: 10 },
}, { timestamps: true });

module.exports = mongoose.model("Store", storeSchema);