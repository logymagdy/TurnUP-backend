const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    photo: { type: String, default: null },
    durationMinutes: { type: Number, required: true }, // ✅ single avg duration
    price: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    description: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const stylistSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    photo: { type: String, default: null },
    age: { type: Number, default: null },
    role: { type: String, default: null }, // e.g. Senior Barber
    assignedServices: [{ type: String }], // service names they do
    payoutAccount: { type: String, default: null },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { _id: true }
);

const loyaltyProgramSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    pointsPerVisit: { type: Number, default: 10 },
    pointsPerEGP: { type: Number, default: 1 },
    maxDiscountPercent: { type: Number, default: 50 },
    referralReward: { type: Number, default: 20 },
    cancellationCompensation: { type: Number, default: 50 },
    onlinePaymentBonus: { type: Number, default: 10 },
    vipThreshold: { type: Number, default: 1000 },
    pointsExpiryMonths: { type: Number, default: 6 },
  },
  { _id: false }
);

const storeSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Step 1 ────────────────────────────────────────────────────────────
    storeName: { type: String, required: true },
    logo: { type: String, default: null },
    storeType: {
      type: String,
      enum: ["barbershop", "beautySalon"],
      required: true,
    },
    bio: { type: String, default: null },
    location: { type: String, default: null },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    // ── Step 2 ────────────────────────────────────────────────────────────
    gallery: [{ type: String }],
    businessLicense: { type: String, default: null },

    // ── Step 3 ────────────────────────────────────────────────────────────
    workingHours: {
      days: [{ type: String }],
      opening: { type: String, default: "09:00" },
      closing: { type: String, default: "21:00" },
    },
    settings: {
      acceptWalkIns: { type: Boolean, default: true },
      acceptOnlineBookings: { type: Boolean, default: true },
      autoAssignStaff: { type: Boolean, default: true },
      showEstimatedWaitTime: { type: Boolean, default: true },
      queueExpiryMinutes: { type: Number, default: 30 },
      noShowPenalty: { type: Number, default: 15 },
      maxGroupSize: { type: Number, default: 7 },
    },
    socialPresence: {
      instagramUsername: { type: String, default: null },
      followersCount: { type: Number, default: 0 },
    },
    phone: { type: String, default: null },

    // ── Step 4 ────────────────────────────────────────────────────────────
    services: { type: [serviceSchema], default: [] },

    // ── Step 5 ────────────────────────────────────────────────────────────
    // ✅ Stylists stored inside store — shown to clients
    stylists: { type: [stylistSchema], default: [] },

    // ── Step 6 (pending) ─────────────────────────────────────────────────
    // bookingRules will be added when step 6 is pasted

    // ── Step 7 ────────────────────────────────────────────────────────────
    loyaltyProgram: { type: loyaltyProgramSchema, default: () => ({}) },

    // ── Step 8 ────────────────────────────────────────────────────────────
    refundPolicy: {
      refundType: {
        type: String,
        enum: ["FULL", "PARTIAL", "NONE"],
        default: "FULL",
      },
      partialRefundPercentage: { type: Number, default: 50 },
      normalCancellationMinutes: { type: Number, default: 30 },
      homeCancellationMinutes: { type: Number, default: 60 },
      eventCancellationMinutes: { type: Number, default: 120 },
    },
    depositType: {
      type: String,
      enum: ["FIXED", "PERCENTAGE", "NONE"],
      default: "NONE",
    },
    depositAmount: { type: Number, default: 0 },
    acceptedPaymentMethods: {
      cash: { type: Boolean, default: true },
      card: { type: Boolean, default: true },
    },

    // ── Step 9 ────────────────────────────────────────────────────────────
    subscriptionStatus: {
      type: String,
      enum: ["TRIAL", "SUBSCRIBED", "EXPIRED"],
      default: "TRIAL",
    },
    trialStartDate: { type: Date, default: Date.now },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 2 months
    },
    subscribedAt: { type: Date, default: null },

    // ── Receptionist ──────────────────────────────────────────────────────
    receptionists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ── Status & Approval ─────────────────────────────────────────────────
    approvalStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    rejectionReason: { type: String, default: null },
    operationalStatus: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "BANNED", "UNDER_INVESTIGATION"],
      default: "ACTIVE",
    },
    isOpen: { type: Boolean, default: false },
    isPaused: { type: Boolean, default: false },
    isWorkDayActive: { type: Boolean, default: false },

    // ── Analytics: Monthly Revenue Goal ──────────────────────────────────
    // Set by store owner in Settings > Analytics
    // Used in analytics screen to show progress bar (e.g. EGP 15,000 / 20,000)
    monthlyRevenueGoal: { type: Number, default: 0 },

    // ── Stats ─────────────────────────────────────────────────────────────
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    warningCount: { type: Number, default: 0 },
    moderationLog: [
      {
        action: String,
        reason: String,
        date: { type: Date, default: Date.now },
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Store", storeSchema);