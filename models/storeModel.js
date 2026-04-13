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
  approvalStatus: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
    default: "PENDING",
  },
  approvalDocuments: {
    businessLicense: String,
    shopPhotos: [String],
    ownerIdPhoto: String,
    address: String,
  },
  warnings: {
    type: Number,
    default: 0,
  },
  rejectionReason: {
    type: String,
    default: null,
  },
  suspensionReason: {
    type: String,
    default: null,
  },
  trialStartDate: {
    type: Date,
    default: null,
  },
  trialEndDate: {
    type: Date,
    default: null,
  },
  subscriptionStatus: {
    type: String,
    enum: ["TRIAL", "ACTIVE", "EXPIRED"],
    default: "TRIAL",
  },
  maxGroupSize: {
    type: Number,
    default: 10,
  },
  depositAmount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model("Store", storeSchema);