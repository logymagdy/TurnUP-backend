const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { generateReferralCode } = require("../utils/generateReferralCode");

// ─── ROLE DEFINITIONS ─────────────────────────────────────────────────────────
const BUSINESS_ROLES = ["serviceProvider", "RECEPTIONIST", "STYLIST"];
const CLIENT_ROLES = ["CLIENT"];
const ALL_ALLOWED_ROLES = [...BUSINESS_ROLES, ...CLIENT_ROLES];

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

// ─── Nodemailer ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

    // ✅ Must provide at least email or phone
    if (!email && !phone)
      return res.status(400).json({ message: "Email or phone number is required" });

    // ✅ Check duplicate by email OR phone
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.findOneAndUpdate(
      { $or: orConditions },
      { $set: { otp, otpExpiry } },
      { returnDocument: "after" }
    );

    if (!user) return res.status(404).json({ message: "No account found" });

    if (user.email) {
      try {
        await transporter.sendMail({
          from: `"TurnUP" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: "TurnUP — Password Reset OTP",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #6C3EF0;">TurnUP Password Reset</h2>
              <p>Your OTP is:</p>
              <h1 style="color: #6C3EF0; letter-spacing: 10px;">${otp}</h1>
              <p>Expires in <strong>10 minutes</strong>.</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr.message);
      }
    }

    if (!user.email && user.phone) {
      console.log(`OTP for ${user.phone}: ${otp}`);
      // TODO: integrate SMS provider here
    }

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
      return res.status(400).json({ message: "Email or phone number is required" });

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
      return res.status(400).json({ message: "Email or phone number is required" });

    const orConditions = [];
    if (email) orConditions.push({ email: email.toLowerCase().trim() });
    if (phone) orConditions.push({ phone: phone.trim() });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.findOneAndUpdate(
      { $or: orConditions },
      { $set: { otp, otpExpiry } },
      { returnDocument: "after" }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.email) {
      try {
        await transporter.sendMail({
          from: `"TurnUP" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: "TurnUP — New OTP",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #6C3EF0;">TurnUP — New OTP</h2>
              <p>Your new OTP is:</p>
              <h1 style="color: #6C3EF0; letter-spacing: 10px;">${otp}</h1>
              <p>Expires in <strong>10 minutes</strong>.</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr.message);
      }
    }

    if (!user.email && user.phone) {
      console.log(`OTP for ${user.phone}: ${otp}`);
      // TODO: integrate SMS provider here
    }

    res.json({ message: "New OTP sent successfully" });
  } catch (err) {
    next(err);
  }
};