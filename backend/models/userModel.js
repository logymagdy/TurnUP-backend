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
      minlength: [8, "Password must be at least 8 characters"],
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

    // ✅ OTP attempt tracking — prevents brute force
    otpAttempts: { type: Number, default: 0 },
    otpLockedUntil: { type: Date, default: null },

    referralCode: { type: String, default: null, unique: true, sparse: true },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
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
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: ["male", "female", "other", null], default: null },
    address: { type: String, default: null },
    avatar: { type: String, default: null },
    language: { type: String, default: "en" },
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

    // ── CLIENT notification settings ─────────────────────────────────────
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

    // ── BUSINESS (serviceProvider + RECEPTIONIST) notification settings ───
    // Separate from client settings — controls business-side alerts
    businessNotificationSettings: {
      // Booking alerts
      newBooking: { type: Boolean, default: true },
      bookingCancellation: { type: Boolean, default: true },
      noShowAlert: { type: Boolean, default: true },
      // Queue alerts
      newWalkIn: { type: Boolean, default: true },
      queueDelay: { type: Boolean, default: true },
      // Channels
      pushNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: false },
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