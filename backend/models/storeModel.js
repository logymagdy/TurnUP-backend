const mongoose = require("mongoose");

// Sub-schema for Services
const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  durationMin: { type: Number, required: true },
  durationMax: { type: Number, required: true },
  description: { type: String, default: null },
  isActive: { type: Boolean, default: true },
});

// Sub-schema for Seats
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

    // --- OPERATIONAL DATA ---
    services: [serviceSchema],
    seats: [seatSchema],
    isWorkDayActive: { type: Boolean, default: false }, // ✅ Toggle for "Start Work Day"

    workingHours: {
      days: [{ type: String }], // ["Mon", "Tue", etc.]
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

    // --- LOYALTY PROGRAM ---
    loyaltyProgram: {
      enabled: { type: Boolean, default: false },
      pointsPerVisit: { type: Number, default: 0 },
      redemptionRules: [{
        pointsNeeded: Number,
        rewardType: String, // e.g., "Percentage Discount", "Free Service"
        value: Number       // e.g., 20 for 20% off
      }]
    },

    // --- DISCOVERY & STAFF ---
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    receptionists: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    stylists: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // --- APPROVAL & STATUS ---
    approvalStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    status: { 
      type: String, 
      enum: ["ACTIVE", "SUSPENDED"], 
      default: "ACTIVE" 
    },
    
    approvalDocuments: {
      businessLicense: { type: String, default: null },
      shopPhotos: [{ type: String }],
      ownerIdPhoto: { type: String, default: null },
      address: { type: String, default: null },
    },

    // --- FINANCIALS & PAYMENTS ---
    subscriptionStatus: {
      type: String,
      enum: ["TRIAL", "ACTIVE", "EXPIRED"],
      default: "TRIAL",
    },
    paymentSetup: {
      acceptedMethods: [{ type: String }], // ["Credit/Debit Card", "Apple Pay", etc.]
      payoutInfo: {
        accountHolderName: String,
        bankAccountName: String,
        iban: String
      }
    },
    depositType: { 
      type: String, 
      enum: ["FIXED", "PERCENTAGE", "NONE"], 
      default: "NONE" 
    },
    depositAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Store", storeSchema);