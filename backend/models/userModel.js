const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false, // Updated: Optional for social login users
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
      required: [true, "Mobile number is required"],
      trim: true,
      match: [/^01[0-2,5]{1}[0-9]{8}$/, "Please enter a valid Egyptian phone number"],
    },
    
    // --- SOCIAL LOGINS ---
    socialProvider: { 
      type: String, 
      enum: ["google", "facebook", "local"], 
      default: "local" 
    },
    socialId: { type: String, default: null },
    googleId: { type: String, default: null },   // Added: Explicit Google ID
    facebookId: { type: String, default: null }, // Added: Explicit Facebook ID

    // --- PASSWORD RECOVERY (OTP) ---
    otp: { type: String, default: null }, // General OTP
    otpExpiry: { type: Date, default: null },
    resetPasswordOtp: { type: String, default: null },    // Added: Specific for resets
    resetPasswordExpires: { type: Date, default: null }, // Added: Expiry for resets

    // --- PROFILE & PREFERENCES ---
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null },
    servicePreference: { type: String, enum: ["MEN", "WOMEN", null], default: null },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    address: { type: String },
    avatar: { type: String, default: "default-avatar.png" },
    language: { type: String, default: "en" },
    points: { type: Number, default: 0 },

    // GeoJSON for nearby salon search
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [31.2357, 30.0444] } // [lng, lat]
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
      // Keep your legacy nested structure if needed by existing logic:
      booking: {
        newBooking: { type: Boolean, default: true },
        cancellation: { type: Boolean, default: true }
      }
    }
  },
  { timestamps: true }
);

// Index for geo-spatial queries (nearby salons)
userSchema.index({ location: "2dsphere" });

// Hashing logic: Only hash if a password exists
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