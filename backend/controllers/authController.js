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
    { expiresIn: "7d" }
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
// POST /api/auth/register
// Frontend sends: { username, email, password, role, phone, servicePreference?, referralCode? }
// Role must be explicitly chosen by user — no default assignment
exports.registerUser = async (req, res) => {
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

    // ── Step 1: Block ADMIN self-registration
    if (role === "ADMIN")
      return res.status(403).json({ message: "Forbidden" });

    // ── Step 2: Validate role BEFORE anything else
    if (!role || !ALL_ALLOWED_ROLES.includes(role))
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${ALL_ALLOWED_ROLES.join(", ")}`,
      });

    // ── Step 3: Check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // ── Step 4: Build user data based on role track
    const isClientTrack = CLIENT_ROLES.includes(role);
    const isBusinessTrack = BUSINESS_ROLES.includes(role);

    // ── Step 5: Handle referral (CLIENT only)
    let referredBy = null;
    if (isClientTrack && incomingReferralCode) {
      const referrer = await User.findOne({ referralCode: incomingReferralCode });
      if (referrer) referredBy = referrer._id;
    }

    // ── Step 6: Generate referral code (CLIENT only)
    let newReferralCode = null;
    if (isClientTrack) {
      let unique = false;
      while (!unique) {
        newReferralCode = generateReferralCode();
        const clash = await User.findOne({ referralCode: newReferralCode });
        if (!clash) unique = true;
      }
    }

    // ── Step 7: Create user
    const newUser = new User({
      username,
      email,
      password,
      phone,
      role,
      // CLIENT only fields
      servicePreference: isClientTrack ? servicePreference : null,
      referralCode: isClientTrack ? newReferralCode : null,
      referredBy: isClientTrack ? referredBy : null,
      // Business track — storeId linked later by serviceProvider
      storeId: null,
    });

    await newUser.save();

    const token = generateToken(newUser._id, newUser.role, null);

    res.status(201).json({
      message: "Account created successfully",
      token,
      userId: newUser._id,
      role: newUser.role,
      track: isClientTrack ? "CLIENT" : "BUSINESS",
      referralCode: isClientTrack ? newReferralCode : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Must use .select("+password") because select: false in model
    const user = await User.findOne({ email }).select("+password");
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
    res.status(500).json({ message: err.message });
  }
};

// ─── SOCIAL LOGIN (unified — handles google and facebook) ─────────────────────
// googleLogin and facebookLogin both call this same logic
const handleSocialLogin = async (req, res, provider) => {
  try {
    const { email, name, socialId } = req.body;
    if (!email || !name || !socialId)
      return res.status(400).json({ message: "email, name and socialId are required" });

    let user = await User.findOne({ email });

    if (!user) {
      // Social login always creates CLIENT account
      user = new User({
        username: name,
        email,
        socialId,
        googleId: provider === "google" ? socialId : null,
        facebookId: provider === "facebook" ? socialId : null,
        socialProvider: provider,
        role: "CLIENT",
        phone: null,
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
    res.status(500).json({ message: err.message });
  }
};

exports.googleLogin = (req, res) => handleSocialLogin(req, res, "google");
exports.facebookLogin = (req, res) => handleSocialLogin(req, res, "facebook");
exports.socialLogin = (req, res) => {
  const { provider } = req.body;
  if (!provider)
    return res.status(400).json({ message: "provider is required" });
  return handleSocialLogin(req, res, provider);
};

// ─── LOGOUT & TOKEN ───────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token" });
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    const newToken = generateToken(user._id, user.role, user.storeId);
    res.json({ token: newToken });
  } catch (err) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -otp -otpExpiry")
      .populate("storeId", "storeName storeType");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    // ✅ Only phone — no more mobileNumber confusion
    const allowedUpdates = [
      "username",
      "phone",        // unified field
      "instapayNumber",
      "servicePreference",
      "language",
      "expoPushToken",
    ];
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password -otp -otpExpiry");

    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar },
      { new: true }
    ).select("-password");
    res.json({ message: "Avatar updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { coordinates } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { location: { type: "Point", coordinates } },
      { new: true }
    ).select("-password");
    res.json({ message: "Location updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
exports.updateNotificationSettings = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { notificationSettings: req.body } },
      { new: true }
    );
    res.json({
      message: "Settings updated",
      settings: user.notificationSettings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Current and new password required" });

    // Must use .select("+password") because select: false in model
    const user = await User.findById(req.user.id).select("+password");
    if (!user || !(await user.comparePassword(currentPassword)))
      return res.status(400).json({ message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── PASSWORD RESET (OTP) ─────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await transporter.sendMail({
      from: `"TurnUP" <${process.env.EMAIL_USER}>`,
      to: email,
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

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({
      email,
      otp,
      otpExpiry: { $gt: Date.now() },
    });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired OTP" });
    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({
      email,
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
    res.status(500).json({ message: err.message });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await transporter.sendMail({
      from: `"TurnUP" <${process.env.EMAIL_USER}>`,
      to: email,
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
    res.json({ message: "New OTP sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};