const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
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
      match: [/^01[0-2,5]{1}[0-9]{8}$/, "Please enter a valid Egyptian phone number"],
    },

    // --- SOCIAL LOGINS ---
    socialProvider: {
      type: String,
      enum: ["google", "facebook", "local"],
      default: "local",
    },
    socialId: { type: String, default: null },
    googleId: { type: String, default: null },
    facebookId: { type: String, default: null },

    // --- PASSWORD RECOVERY (OTP) ---
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    resetPasswordOtp: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },

    // --- REFERRAL ---
    referralCode: { type: String, default: null },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // --- FINANCIAL ---
    wallet: { type: Number, default: 0 },
    debt: { type: Number, default: 0 },

    // --- PROFILE & PREFERENCES ---
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null },
    servicePreference: { type: String, enum: ["MEN", "WOMEN", null], default: null },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    address: { type: String },
    avatar: { type: String, default: "default-avatar.png" },
    language: { type: String, default: "en" },
    points: { type: Number, default: 0 },
    fcmToken: { type: String, default: null },

    // GeoJSON for nearby salon search
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [31.2357, 30.0444] },
    },

    // --- NOTIFICATION SETTINGS ---
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

// FIXED: pre-save middleware (no next)
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);