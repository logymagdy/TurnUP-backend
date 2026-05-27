const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const { generateReferralCode } = require("../utils/generateReferralCode");
const Brevo = require("@getbrevo/brevo");

const BUSINESS_ROLES = ["serviceProvider", "RECEPTIONIST", "STYLIST"];
const CLIENT_ROLES = ["CLIENT"];
const ALL_ALLOWED_ROLES = [...BUSINESS_ROLES, ...CLIENT_ROLES];

// ─── BREVO EMAIL CLIENT ────────────────────────────────────────────────────────
const brevoClient = new Brevo.TransactionalEmailsApi();
brevoClient.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

// ─── TWILIO CLIENT ─────────────────────────────────────────────────────────────
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

// ─── TOKEN HELPERS ────────────────────────────────────────────────────────────
const generateToken = (id, role, storeId) => {
  return jwt.sign({ id, role, storeId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });
};

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ─── OTP EMAIL TEMPLATE ────────────────────────────────────────────────────────
const otpEmailTemplate = (otp) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#1a1a1a;border-radius:16px;padding:32px;">
    <h2 style="color:#6C3EF0;margin:0 0 8px 0;font-size:28px;">TurnUP</h2>
    <p style="color:#aaa;margin:0 0 24px 0;font-size:14px;">Smart Queue & Booking</p>
    <p style="color:#fff;font-size:16px;margin:0 0 16px 0;">Your verification code is:</p>
    <div style="background:#0f0f0f;border:2px solid #6C3EF0;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px 0;">
      <span style="color:#6C3EF0;font-size:48px;font-weight:bold;letter-spacing:16px;">${otp}</span>
    </div>
    <p style="color:#aaa;font-size:14px;margin:0 0 8px 0;">⏰ Expires in <strong style="color:#fff;">10 minutes</strong>.</p>
    <p style="color:#555;font-size:12px;margin:0;">If you didn't request this, ignore this email.</p>
  </div>
</body>
</html>
`;

// ─── SEND OTP HELPER ──────────────────────────────────────────────────────────
const sendOtp = async (user) => {
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = otp;
  user.otpExpiry = otpExpiry;
  await user.save();

  if (user.email) {
    try {
      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.subject = "TurnUP — Your Verification Code";
      sendSmtpEmail.htmlContent = otpEmailTemplate(otp);
      sendSmtpEmail.sender = {
        name: process.env.EMAIL_FROM_NAME || "TurnUP",
        email: process.env.EMAIL_FROM || "logymagdy8@gmail.com",
      };
      sendSmtpEmail.to = [{ email: user.email }];

      await brevoClient.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ OTP sent to ${user.email}`);
    } catch (emailErr) {
      console.error(`❌ Brevo failed for ${user.email}:`, emailErr.message);
      throw new Error("Failed to send OTP email. Please try again.");
    }
  } else if (user.phone && twilioClient) {
    try {
      await twilioClient.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({ to: user.phone, channel: "sms" });
      console.log(`✅ OTP SMS sent to ${user.phone}`);
    } catch (smsErr) {
      console.error(`❌ Twilio failed:`, smsErr.message);
      throw new Error("Failed to send OTP SMS. Please try again.");
    }
  }

  return otp;
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
      return res.status(400).json({ message: "Email or phone is required" });

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
      servicePreference: isClientTrack ? servicePreference || null : null,
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
      username: newUser.username,
      role: newUser.role,
      track: isClientTrack ? "CLIENT" : "BUSINESS",
      servicePreference: newUser.servicePreference,
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
      return res.status(400).json({ message: "Email or phone is required" });

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
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      storeId: user.storeId || null,
      track: CLIENT_ROLES.includes(user.role) ? "CLIENT" : "BUSINESS",
      servicePreference: user.servicePreference,
      referralCode: user.referralCode,
      points: user.points,
      wallet: user.wallet,
    });
  } catch (err) {
    next(err);
  }
};

// ─── SOCIAL LOGIN ─────────────────────────────────────────────────────────────
const handleSocialLogin = async (req, res, next, provider) => {
  try {
    const { email, name, socialId, servicePreference } = req.body;
    if (!email || !name || !socialId)
      return res.status(400).json({ message: "email, name and socialId required" });

    let user = await User.findOne({ email });

    if (!user) {
      let newReferralCode = null;
      let unique = false;
      while (!unique) {
        newReferralCode = generateReferralCode();
        const clash = await User.findOne({ referralCode: newReferralCode });
        if (!clash) unique = true;
      }

      user = new User({
        username: name,
        email,
        socialId,
        googleId: provider === "google" ? socialId : null,
        facebookId: provider === "facebook" ? socialId : null,
        socialProvider: provider,
        role: "CLIENT",
        servicePreference: servicePreference || null,
        referralCode: newReferralCode,
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
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      track: "CLIENT",
      servicePreference: user.servicePreference,
      referralCode: user.referralCode,
      points: user.points,
      wallet: user.wallet,
    });
  } catch (err) {
    next(err);
  }
};

exports.googleLogin = (req, res, next) =>
  handleSocialLogin(req, res, next, "google");
exports.facebookLogin = (req, res, next) =>
  handleSocialLogin(req, res, next, "facebook");
exports.socialLogin = (req, res, next) => {
  const { provider } = req.body;
  if (!provider)
    return res.status(400).json({ message: "provider is required" });
  return handleSocialLogin(req, res, next, provider);
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ message: "No refresh token" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const newToken = generateToken(user._id, user.role, user.storeId);
    res.json({
      token: newToken,
      userId: user._id,
      role: user.role,
      storeId: user.storeId || null,
    });
  } catch (err) {
    next(err);
  }
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -otp -otpExpiry")
      .populate("storeId", "storeName storeType logo");
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
      "address",
      "servicePreference",
      "language",
      "fcmToken",
      "dateOfBirth",
      "gender",
    ];
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      returnDocument: "after",
      runValidators: true,
    }).select("-password -otp -otpExpiry");

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

// ─── FAVORITES ────────────────────────────────────────────────────────────────
exports.getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("favorites")
      .populate({
        path: "favorites",
        select: "storeName storeType logo rating numReviews services location isOpen",
      });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Favorites retrieved",
      favorites: user.favorites || [],
    });
  } catch (err) {
    next(err);
  }
};

exports.toggleFavorite = async (req, res, next) => {
  try {
    const { storeId } = req.params;

    const user = await User.findById(req.user.id).select("favorites");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isFavorited = user.favorites.map(String).includes(String(storeId));

    if (isFavorited) {
      user.favorites = user.favorites.filter(
        (id) => String(id) !== String(storeId)
      );
    } else {
      user.favorites.push(storeId);
    }

    await user.save();

    res.json({
      message: isFavorited ? "Removed from favorites" : "Added to favorites",
      isFavorited: !isFavorited,
    });
  } catch (err) {
    next(err);
  }
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone)
      return res.status(400).json({ message: "Email or phone is required" });

    const orConditions = [];
    if (email) orConditions.push({ email: email.toLowerCase().trim() });
    if (phone) orConditions.push({ phone: phone.trim() });

    const user = await User.findOne({ $or: orConditions });
    if (!user) return res.status(404).json({ message: "No account found" });

    await sendOtp(user);
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
      return res.status(400).json({ message: "Email or phone is required" });

    const orConditions = [];
    if (email) orConditions.push({ email: email.toLowerCase().trim() });
    if (phone) orConditions.push({ phone: phone.trim() });

    const user = await User.findOne({
      $or: orConditions,
      otp,
      otpExpiry: { $gt: Date.now() },
    });

    if (!user)
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
      return res.status(400).json({ message: "Email or phone is required" });

    const orConditions = [];
    if (email) orConditions.push({ email: email.toLowerCase().trim() });
    if (phone) orConditions.push({ phone: phone.trim() });

    const user = await User.findOne({
      $or: orConditions,
      otp,
      otpExpiry: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    user.password = newPassword;
    user.otp = null;
    user.otpExpiry = null;
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
      return res.status(400).json({ message: "Email or phone is required" });

    const orConditions = [];
    if (email) orConditions.push({ email: email.toLowerCase().trim() });
    if (phone) orConditions.push({ phone: phone.trim() });

    const user = await User.findOne({ $or: orConditions });
    if (!user) return res.status(404).json({ message: "User not found" });

    await sendOtp(user);
    res.json({ message: "New OTP sent successfully" });
  } catch (err) {
    next(err);
  }
};