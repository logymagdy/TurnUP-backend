const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { generateReferralCode } = require("../utils/generateReferralCode");

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

// ─── Nodemailer transporter ───────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── REGISTER ─────────────────────────────────────────────────────────────────
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

    if (role === "ADMIN")
      return res.status(403).json({ message: "Forbidden" });

    const allowedRoles = ["serviceProvider", "RECEPTIONIST", "STYLIST", "CLIENT"];
    if (!allowedRoles.includes(role))
      return res.status(400).json({ message: "Invalid role" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    let referredBy = null;
    if (incomingReferralCode) {
      const referrer = await User.findOne({ referralCode: incomingReferralCode });
      if (referrer) referredBy = referrer._id;
    }

    let newReferralCode = null;
    if (role === "CLIENT") {
      let unique = false;
      while (!unique) {
        newReferralCode = generateReferralCode();
        const clash = await User.findOne({ referralCode: newReferralCode });
        if (!clash) unique = true;
      }
    }

    const newUser = new User({
      username,
      email,
      password,
      phone,
      role: role || "CLIENT",
      servicePreference,
      referralCode: newReferralCode,
      referredBy,
    });

    await newUser.save();
    const token = generateToken(newUser._id, newUser.role, null);

    res.status(201).json({
      message: "Account created successfully",
      token,
      userId: newUser._id,
      referralCode: newReferralCode,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Must use .select("+password") because select: false in model
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
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── SOCIAL LOGINS ────────────────────────────────────────────────────────────
exports.googleLogin = async (req, res) => {
  try {
    const { email, name, socialId } = req.body;
    if (!email || !name || !socialId)
      return res.status(400).json({ message: "email, name and socialId are required" });

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        username: name,
        email,
        googleId: socialId,
        socialProvider: "google",
        role: "CLIENT",
        phone: null,
      });
      await user.save();
    }

    const token = generateToken(user._id, user.role, user.storeId);
    const refreshToken = generateRefreshToken(user._id);
    res.json({
      message: "Google login successful",
      token,
      refreshToken,
      userId: user._id,
      role: user.role,
      name: user.username,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.facebookLogin = async (req, res) => {
  try {
    const { email, name, socialId } = req.body;
    if (!email || !name || !socialId)
      return res.status(400).json({ message: "email, name and socialId are required" });

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        username: name,
        email,
        facebookId: socialId,
        socialProvider: "facebook",
        role: "CLIENT",
        phone: null,
      });
      await user.save();
    }

    const token = generateToken(user._id, user.role, user.storeId);
    const refreshToken = generateRefreshToken(user._id);
    res.json({
      message: "Facebook login successful",
      token,
      refreshToken,
      userId: user._id,
      role: user.role,
      name: user.username,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.socialLogin = async (req, res) => {
  try {
    const { provider, email, name, socialId } = req.body;
    if (!email || !name || !socialId || !provider)
      return res.status(400).json({ message: "provider, email, name and socialId are required" });

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        username: name,
        email,
        socialId,
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
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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

// ─── PROFILE MANAGEMENT ───────────────────────────────────────────────────────
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
    const allowedUpdates = [
      "username",
      "phone",
      "mobileNumber",
      "instapayNumber",
      "servicePreference",
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

// ─── SETTINGS & SECURITY ──────────────────────────────────────────────────────
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

    // ✅ Must use .select("+password") because select: false in model
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