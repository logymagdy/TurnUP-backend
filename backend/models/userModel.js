const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, trim: true, default: null },
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
      default: "CLIENT", // Prevents crash if frontend forgets to send role
    },
    phone: { type: String, default: null, trim: true },
    socialProvider: {
      type: String,
      enum: ["google", "facebook", "local"],
      default: "local",
    },
    socialId: { type: String, default: null },
    googleId: { type: String, default: null },
    facebookId: { type: String, default: null },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },

    // --- CLIENT FIELDS ---
    servicePreference: { type: String, enum: ["MEN", "WOMEN", null], default: null },
    referralCode: { type: String, unique: true, sparse: true, default: null },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    loyaltyPoints: { type: Number, default: 0 },
    loyaltyTier: { type: String, enum: ["BRONZE", "SILVER", "GOLD"], default: "BRONZE" },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],
    debt: { type: Number, default: 0 },
    visitCount: { type: Number, default: 0 },

    // --- BUSINESS FIELDS ---
    instapayNumber: { type: String, default: null },

    // --- SHARED FIELDS ---
    savedCard: { type: String, default: null },
    expoPushToken: { type: String, default: null },
    language: { type: String, default: "en" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    notificationSettings: {
      booking: { 
        newBooking: { type: Boolean, default: true }, 
        cancellation: { type: Boolean, default: true }, 
        noShowAlert: { type: Boolean, default: true } 
      },
      queue: { 
        newWalkIn: { type: Boolean, default: true }, 
        queueDelay: { type: Boolean, default: true } 
      },
      system: { 
        dailySummary: { type: Boolean, default: false }, 
        importantUpdates: { type: Boolean, default: true } 
      },
      channels: { 
        push: { type: Boolean, default: true }, 
        sms: { type: Boolean, default: true }, 
        email: { type: Boolean, default: false } 
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

userSchema.index({ location: "2dsphere" });

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