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

    // ── Store availability controls ────────────────────────────────────
    isWorkDayActive: { type: Boolean, default: false },
    isOpen: { type: Boolean, default: false },       // ✅ Store is open for bookings
    isPaused: { type: Boolean, default: false },     // ✅ Temporarily paused (breaks etc)

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
      maxGroupSize: { type: Number, default: 7 },       // ✅ Max group size is 7
      queueExpiryMinutes: { type: Number, default: 30 }, // ✅ Updated to 30 mins
      noShowPenalty: { type: Number, default: 15 },
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

    // ── ONBOARDING APPROVAL SYSTEM ─────────────────────────────────────
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

    // ── OPERATIONAL STATUS ─────────────────────────────────────────────
    operationalStatus: {
      type: String,
      enum: ["ACTIVE", "UNDER_INVESTIGATION", "SUSPENDED", "BANNED"],
      default: "ACTIVE",
    },
    suspensionEndsAt: { type: Date, default: null },
    warningCount: { type: Number, default: 0 },
    moderationLog: [moderationLogSchema],

    // ── Legacy status field ────────────────────────────────────────────
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
    },

    // ── SUBSCRIPTION SYSTEM ────────────────────────────────────────────
    subscriptionStatus: {
      type: String,
      enum: ["TRIAL", "ACTIVE", "EXPIRED"],
      default: "TRIAL",
    },
    trialStartDate: { type: Date, default: null },
    trialEndDate: { type: Date, default: null },
    lastPaymentDate: { type: Date, default: null },       // ✅ Added
    nextPaymentDate: { type: Date, default: null },       // ✅ Added
    gracePeriodEndsAt: { type: Date, default: null },     // ✅ Added

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
      normalCancellationMinutes: { type: Number, default: 30 },  // ✅ Updated to 30
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