const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { generateReferralCode } = require("../utils/generateReferralCode");

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const generateToken = (id, role, storeId) => {
  return jwt.sign({ id, role, storeId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const generateRefreshToken = (id) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    console.error("FATAL: JWT_REFRESH_SECRET is missing in .env");
  }
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || "fallback_secret", { expiresIn: "30d" });
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── SOCIAL LOGIN HANDLER ─────────────────────────────────────────────────────
const handleSocialLogin = async (req, res, next, provider) => {
  try {
    const { email, name, socialId } = req.body;

    if (!email || !socialId) {
      return res.status(400).json({ message: "Email and SocialId are required" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        username: name || "User",
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
    console.error(`SOCIAL LOGIN ERROR (${provider}):`, err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.googleLogin = (req, res, next) => handleSocialLogin(req, res, next, "google");
exports.facebookLogin = (req, res, next) => handleSocialLogin(req, res, next, "facebook");

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await transporter.sendMail({
        from: `"TurnUP" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "TurnUP — Password Reset OTP",
        html: `<div style="font-family: Arial;"><h2>OTP: ${otp}</h2></div>`,
      });
      res.json({ message: "OTP sent to your email" });
    } catch (mailError) {
      console.error("NODEMAILER ERROR:", mailError);
      return res.status(503).json({ message: "Email service failed. Check EMAIL_PASS env." });
    }
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ... include other exports (registerUser, loginUser, etc.) from your previous file