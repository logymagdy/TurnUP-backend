const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
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
      default: null,
      trim: true,
    },
    socialProvider: {
      type: String,
      enum: ["google", "facebook", "local"],
      default: "local",
    },
    socialId: { type: String, default: null },
    googleId: { type: String, default: null },
    facebookId: { type: String, default: null },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    servicePreference: {
      type: String,
      enum: ["MEN", "WOMEN", null],
      default: null,
    },

    // Profile Information
    fullName: { type: String, trim: true, default: null },
    mobileNumber: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", null],
      default: null,
    },
    address: { type: String, default: null },

    // Geolocation
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },

    // Favorites
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],

    // Loyalty
    loyaltyPoints: { type: Number, default: 0 },
    loyaltyTier: {
      type: String,
      enum: ["BRONZE", "SILVER", "GOLD"],
      default: "BRONZE",
    },

    // Referral
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Financial
    debt: { type: Number, default: 0 },
    savedCard: { type: String, default: null },
    visitCount: { type: Number, default: 0 },
    instapayNumber: { type: String, default: null },

    // Expo Push Notifications
    expoPushToken: { type: String, default: null },

    // App Settings
    language: { type: String, default: "en" },

    // Notification Settings
    notificationSettings: {
      booking: {
        newBooking: { type: Boolean, default: true },
        cancellation: { type: Boolean, default: true },
        noShowAlert: { type: Boolean, default: true },
      },
      queue: {
        newWalkIn: { type: Boolean, default: true },
        queueDelay: { type: Boolean, default: true },
      },
      system: {
        dailySummary: { type: Boolean, default: false },
        importantUpdates: { type: Boolean, default: true },
      },
      channels: {
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
      },
      general: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
      vibrate: { type: Boolean, default: false },
      specialOffers: { type: Boolean, default: true },
      payments: { type: Boolean, default: true },
      appUpdates: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Geospatial index
userSchema.index({ location: "2dsphere" });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);