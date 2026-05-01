const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  durationMin: { type: Number, required: true },
  durationMax: { type: Number, required: true },
  description: { type: String, default: null },
  isActive: { type: Boolean, default: true },
});

const seatSchema = new mongoose.Schema({
  seatNumber: { type: Number, required: true },
  isOccupied: { type: Boolean, default: false },
  currentEntryId: { type: mongoose.Schema.Types.ObjectId, default: null },
});

const storeSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    storeName: { type: String, required: [true, "Store name is required"], trim: true },
    storeType: {
      type: String,
      enum: ["barbershop", "beautySalon"],
      required: true,
    },
    location: { type: String, required: [true, "Location is required"] },
    phone: { type: String, default: null },
    logo: { type: String, default: null },
    bio: { type: String, default: null },
    services: [serviceSchema],
    seats: [seatSchema],
    isWorkDayActive: { type: Boolean, default: false },
    workingHours: {
      days: [{ type: String }],
      opening: { type: String, default: "09:00" },
      closing: { type: String, default: "21:00" },
    },
    settings: {
      acceptWalkIns: { type: Boolean, default: true },
      acceptOnlineBookings: { type: Boolean, default: true },
      autoAssignStaff: { type: Boolean, default: true },
      showWaitTime: { type: Boolean, default: true },
      manualQueueControl: { type: Boolean, default: false },
    },
    loyaltyProgram: {
      enabled: { type: Boolean, default: false },
      pointsPerVisit: { type: Number, default: 0 },
      redemptionRules: [{
        pointsNeeded: Number,
        rewardType: String,
        value: Number,
      }],
    },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    receptionists: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    stylists: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    approvalStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    rejectionReason: { type: String, default: null },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
    },
    approvalDocuments: {
      businessLicense: { type: String, default: null },
      shopPhotos: [{ type: String }],
      ownerIdPhoto: { type: String, default: null },
      address: { type: String, default: null },
    },
    subscriptionStatus: {
      type: String,
      enum: ["TRIAL", "ACTIVE", "EXPIRED"],
      default: "TRIAL",
    },
    trialStartDate: { type: Date, default: null },
    trialEndDate: { type: Date, default: null },
    paymentSetup: {
      acceptedMethods: [{ type: String }],
      payoutInfo: {
        accountHolderName: String,
        bankAccountName: String,
        iban: String,
      },
    },
    depositType: {
      type: String,
      enum: ["FIXED", "PERCENTAGE", "NONE"],
      default: "NONE",
    },
    depositAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Store", storeSchema);