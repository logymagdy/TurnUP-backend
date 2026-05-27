const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  durationMin: { type: Number, required: true },
  durationMax: { type: Number, required: true },
  description: { type: String, default: null },
  image: { type: String, default: null },       // ✅ service image
  category: { type: String, default: null },    // ✅ Hair, Nails, Facial etc
  discountPercent: { type: Number, default: 0 }, // ✅ discount badge
  isActive: { type: Boolean, default: true },
});

// ✅ Package schema — bundles of services at fixed price
const packageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: null },
  services: [{ type: String }],  // list of service names included
  price: { type: Number, required: true },
  image: { type: String, default: null },
  isActive: { type: Boolean, default: true },
});

const seatSchema = new mongoose.Schema({
  seatNumber: { type: Number, required: true },
  isOccupied: { type: Boolean, default: false },
  currentEntryId: { type: mongoose.Schema.Types.ObjectId, default: null },
});

const moderationLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "WARNED",
        "UNDER_INVESTIGATION",
        "SUSPENDED",
        "BANNED",
        "REACTIVATED",
        "COMPLAINT_REVIEWED",
      ],
      required: true,
    },
    reason: { type: String, required: true },
    previousStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
    suspensionDays: { type: Number, default: null },
    suspensionEndsAt: { type: Date, default: null },
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      default: null,
    },
    resolution: { type: String, default: null },
  },
  { timestamps: true }
);

const storeSchema = new mongoose.Schema(
  {
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
    location: { type: String, required: [true, "Location is required"] },
    phone: { type: String, default: null },
    logo: { type: String, default: null },
    bio: { type: String, default: null },

    // ✅ Gallery images
    gallery: [{ type: String }],

    // ✅ View count
    viewCount: { type: Number, default: 0 },

    services: [serviceSchema],
    packages: [packageSchema],  // ✅ store packages
    seats: [seatSchema],

    isWorkDayActive: { type: Boolean, default: false },
    isOpen: { type: Boolean, default: false },
    isPaused: { type: Boolean, default: false },

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
      maxGroupSize: { type: Number, default: 7 },
      queueExpiryMinutes: { type: Number, default: 30 },
      noShowPenalty: { type: Number, default: 15 },
    },

    loyaltyProgram: {
      enabled: { type: Boolean, default: false },
      pointsPerVisit: { type: Number, default: 0 },
      redemptionRules: [
        {
          pointsNeeded: Number,
          rewardType: String,
          value: Number,
        },
      ],
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
    approvalDocuments: {
      businessLicense: { type: String, default: null },
      shopPhotos: [{ type: String }],
      ownerIdPhoto: { type: String, default: null },
      address: { type: String, default: null },
    },

    operationalStatus: {
      type: String,
      enum: ["ACTIVE", "UNDER_INVESTIGATION", "SUSPENDED", "BANNED"],
      default: "ACTIVE",
    },
    suspensionEndsAt: { type: Date, default: null },
    warningCount: { type: Number, default: 0 },
    moderationLog: [moderationLogSchema],

    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
    },

    subscriptionStatus: {
      type: String,
      enum: ["TRIAL", "ACTIVE", "EXPIRED"],
      default: "TRIAL",
    },
    trialStartDate: { type: Date, default: null },
    trialEndDate: { type: Date, default: null },
    lastPaymentDate: { type: Date, default: null },
    nextPaymentDate: { type: Date, default: null },
    gracePeriodEndsAt: { type: Date, default: null },

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
    refundPolicy: {
      normalCancellationMinutes: { type: Number, default: 30 },
      homeCancellationMinutes: { type: Number, default: 30 },
      eventCancellationMinutes: { type: Number, default: 60 },
      refundType: {
        type: String,
        enum: ["FULL", "PARTIAL", "NONE"],
        default: "FULL",
      },
      partialRefundPercentage: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Store", storeSchema);