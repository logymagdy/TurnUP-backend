const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const { generateReferralCode } = require("../utils/generateReferralCode");

// ─── ROLE DEFINITIONS ─────────────────────────────────────────────────────────
const BUSINESS_ROLES = ["serviceProvider", "RECEPTIONIST", "STYLIST"];
const CLIENT_ROLES = ["CLIENT"];
const ALL_ALLOWED_ROLES = [...BUSINESS_ROLES, ...CLIENT_ROLES];

// ─── TWILIO CLIENT ─────────────────────────────────────────────────────────────
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const generateToken = (id, role, storeId) => {
  return jwt.sign(
    { id, role, storeId },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
exports.registerUser = async (req, res, next) => {
  try {
    const {
      username,
      email,
      password,
      role,
      phone,
      servicePreference,
      referralCode: incomingReferralCode,
    } = req.body;

    if (role === "ADMIN")
      return res.status(403).json({ message: "Forbidden" });

    if (!role || !ALL_ALLOWED_ROLES.includes(role))
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${ALL_ALLOWED_ROLES.join(", ")}`,
      });

    if (!email && !phone)
      return res.status(400).json({ message: "Email or phone number is required" });

    const orConditions = [];
    if (email) orConditions.push({ email: email.toLowerCase().trim() });
    if (phone) orConditions.push({ phone: phone.trim() });

    const existingUser = await User.findOne({ $or: orConditions });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const isClientTrack = CLIENT_ROLES.includes(role);

    let referredBy = null;
    if (isClientTrack && incomingReferralCode) {
      const referrer = await User.findOne({ referralCode: incomingReferralCode });
      if (referrer) referredBy = referrer._id;
    }

    let newReferralCode = null;
    if (isClientTrack) {
      let unique = false;
      while (!unique) {
        newReferralCode = generateReferralCode();
        const clash = await User.findOne({ referralCode: newReferralCode });
        if (!clash) unique = true;
      }
    }

    const newUser = new User({
      username,
      email: email ? email.toLowerCase().trim() : null,
      password,
      phone: phone ? phone.trim() : null,
      role,
      servicePreference: isClientTrack ? servicePreference : null,
      referralCode: isClientTrack ? newReferralCode : null,
      referredBy: isClientTrack ? referredBy : null,
      storeId: null,
    });

    await newUser.save();

    const token = generateToken(newUser._id, newUser.role, null);
    const refreshToken = generateRefreshToken(newUser._id);

    res.status(201).json({
      message: "Account created successfully",
      token,
      refreshToken,
      userId: newUser._id,
      role: newUser.role,
      track: isClientTrack ? "CLIENT" : "BUSINESS",
      referralCode: isClientTrack ? newReferralCode : null,
    });
  } catch (err) {
    next(err);
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.loginUser = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    if (!email && !phone)
      return res.status(400).json({ message: "Email or phone number is required" });

    const orConditions = [];
    if (email) orConditions.push({ email: email.toLowerCase().trim() });
    if (phone) orConditions.push({ phone: phone.trim() });

    const user = await User.findOne({ $or: orConditions }).select("+password");

    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id, user.role, user.storeId);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      message: "Login successful",
      token,
      refreshToken,
      role: user.role,
      userId: user._id,
      name: user.username,
      storeId: user.storeId || null,
      track: CLIENT_ROLES.includes(user.role) ? "CLIENT" : "BUSINESS",
    });
  } catch (err) {
    next(err);
  }
};

// ─── SOCIAL LOGIN ─────────────────────────────────────────────────────────────
const handleSocialLogin = async (req, res, next, provider) => {
  try {
    const { email, name, socialId } = req.body;
    if (!email || !name || !socialId)
      return res.status(400).json({ message: "email, name and socialId are required" });

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        username: name,
        email,
        socialId,
        googleId: provider === "google" ? socialId : null,
        facebookId: provider === "facebook" ? socialId : null,
        socialProvider: provider,
        role: "CLIENT",
      });
      await user.save();
    }

    const token = generateToken(user._id, user.role, user.storeId);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      message: `${provider} login successful`,
      token,
      refreshToken,
      userId: user._id,
      role: user.role,
      name: user.username,
      track: "CLIENT",
    });
  } catch (err) {
    next(err);
  }
};

exports.googleLogin = (req, res, next) => handleSocialLogin(req, res, next, "google");
exports.facebookLogin = (req, res, next) => handleSocialLogin(req, res, next, "facebook");
exports.socialLogin = (req, res, next) => {
  const { provider } = req.body;
  if (!provider)
    return res.status(400).json({ message: "provider is required" });
  return handleSocialLogin(req, res, next, provider);
};

// ─── LOGOUT & TOKEN ───────────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ message: "No refresh token" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const newToken = generateToken(user._id, user.role, user.storeId);
    res.json({ token: newToken });
  } catch (err) {
    next(err);
  }
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -otp -otpExpiry")
      .populate("storeId", "storeName storeType");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = [
      "username",
      "phone",
      "servicePreference",
      "language",
      "fcmToken",
    ];
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { returnDocument: "after", runValidators: true }
    ).select("-password -otp -otpExpiry");

    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    next(err);
  }
};

exports.updateAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar },
      { returnDocument: "after" }
    ).select("-password");
    res.json({ message: "Avatar updated", user });
  } catch (err) {
    next(err);
  }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const { coordinates } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { location: { type: "Point", coordinates } },
      { returnDocument: "after" }
    ).select("-password");
    res.json({ message: "Location updated", user });
  } catch (err) {
    next(err);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    next(err);
  }
};

exports.updateNotificationSettings = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { notificationSettings: req.body } },
      { returnDocument: "after" }
    );
    res.json({
      message: "Settings updated",
      settings: user.notificationSettings,
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Current and new password required" });

    const user = await User.findById(req.user.id).select("+password");
    if (!user || !(await user.comparePassword(currentPassword)))
      return res.status(400).json({ message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone)
      return res.status(400).json({ message: "Email or phone number is required" });

    const orConditions = [];
    if (email) orConditions.push({ email: email.toLowerCase().trim() });
    if (phone) orConditions.push({ phone: phone.trim() });

    const user = await User.findOne({ $or: orConditions });
    if (!user) return res.status(404).json({ message: "No account found" });

    // Twilio Verify — sends OTP via email or SMS automatically
    const channel = email ? "email" : "sms";
    const to = email ? user.email : user.phone;

    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to, channel });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    next(err);
  }
};

// ─── VERIFY OTP ───────────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, phone, otp } = req.body;

    if (!email && !phone)
      return res.status(400).json({ message: "Email or phone number is required" });

    const to = email ? email.toLowerCase().trim() : phone.trim();

    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to, code: otp });

    if (result.status !== "approved")
      return res.status(400).json({ message: "Invalid or expired OTP" });

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    next(err);
  }
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, phone, otp, newPassword } = req.body;

    if (!email && !phone)
      return res.status(400).json({ message: "Email or phone number is required" });

    const to = email ? email.toLowerCase().trim() : phone.trim();

    // Verify OTP one more time before resetting
    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to, code: otp });

    if (result.status !== "approved")
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const orConditions = [];
    if (email) orConditions.push({ email: to });
    if (phone) orConditions.push({ phone: to });

    const user = await User.findOne({ $or: orConditions });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
};

// ─── RESEND OTP ───────────────────────────────────────────────────────────────
exports.resendOtp = async (req, res, next) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone)
      return res.status(400).json({ message: "Email or phone number is required" });

    const orConditions = [];
    if (email) orConditions.push({ email: email.toLowerCase().trim() });
    if (phone) orConditions.push({ phone: phone.trim() });

    const user = await User.findOne({ $or: orConditions });
    if (!user) return res.status(404).json({ message: "User not found" });

    const channel = email ? "email" : "sms";
    const to = email ? user.email : user.phone;

    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to, channel });

    res.json({ message: "New OTP sent successfully" });
  } catch (err) {
    next(err);
  }
};