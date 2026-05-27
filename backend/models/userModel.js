const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: false, trim: true },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["ADMIN", "serviceProvider", "RECEPTIONIST", "STYLIST", "CLIENT"],
      default: "CLIENT",
    },
    phone: {
      type: String,
      required: false,
      trim: true,
      unique: true,
      sparse: true,
    },
    socialProvider: {
      type: String,
      enum: ["google", "facebook", "local"],
      default: "local",
    },
    socialId: { type: String, default: null },
    googleId: { type: String, default: null },
    facebookId: { type: String, default: null },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    referralCode: { type: String, default: null, unique: true, sparse: true },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ─── WALLET ───────────────────────────────────────────────────────
    wallet: { type: Number, default: 0 },

    debt: { type: Number, default: 0 },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },
    servicePreference: {
      type: String,
      enum: ["MEN", "WOMEN", null],
      default: null,
    },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    address: { type: String },
    avatar: { type: String, default: null },
    language: { type: String, default: "en" },

    // ─── LOYALTY ──────────────────────────────────────────────────────
    points: { type: Number, default: 0 },
    loyaltyTier: {
      type: String,
      enum: ["BRONZE", "SILVER", "GOLD"],
      default: "BRONZE",
    },
    visitCount: { type: Number, default: 0 },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],

    fcmToken: { type: String, default: null },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [31.2357, 30.0444] },
    },
    notificationSettings: {
      general: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
      vibrate: { type: Boolean, default: false },
      specialOffers: { type: Boolean, default: true },
      promoDiscount: { type: Boolean, default: true },
      payments: { type: Boolean, default: true },
      appUpdates: { type: Boolean, default: false },
      newServiceAvailable: { type: Boolean, default: false },
      booking: {
        newBooking: { type: Boolean, default: true },
        cancellation: { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
);

userSchema.index({ location: "2dsphere" });

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err;
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);