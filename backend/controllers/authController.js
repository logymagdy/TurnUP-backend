const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { generateReferralCode } = require("../utils/generateReferralCode");

const BUSINESS_ROLES = ["serviceProvider", "RECEPTIONIST", "STYLIST"];
const CLIENT_ROLES = ["CLIENT"];
const ALL_ALLOWED_ROLES = [...BUSINESS_ROLES, ...CLIENT_ROLES];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const generateToken = (id, role, storeId) => {
  return jwt.sign({ id, role, storeId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
};

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
    const { username, email, password, role, phone, servicePreference, referralCode: incomingReferralCode } = req.body;
    if (role === "ADMIN") return res.status(403).json({ message: "Forbidden" });
    if (!role || !ALL_ALLOWED_ROLES.includes(role)) return res.status(400).json({ message: "Invalid role" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

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
      username, email, password, phone, role,
      servicePreference: isClientTrack ? servicePreference : null,
      referralCode: isClientTrack ? newReferralCode : null,
      referredBy: isClientTrack ? referredBy : null,
    });

    await newUser.save();
    const token = generateToken(newUser._id, newUser.role, null);
    res.status(201).json({ message: "Account created", token, userId: newUser._id });
  } catch (err) { next(err); }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id, user.role, user.storeId);
    const refreshToken = generateRefreshToken(user._id);

    res.json({ message: "Login successful", token, refreshToken, userId: user._id, role: user.role });
  } catch (err) { next(err); }
};

// ─── SOCIAL LOGIN ─────────────────────────────────────────────────────────────
const handleSocialLogin = async (req, res, next, provider) => {
  try {
    const { email, name, socialId } = req.body;
    if (!email || !socialId) return res.status(400).json({ message: "email and socialId are required" });

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

    res.json({ message: `${provider} login successful`, token, refreshToken, userId: user._id });
  } catch (err) {
    console.error("SOCIAL LOGIN ERROR:", err);
    res.status(500).json({ message: err.message });
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
        subject: "TurnUP — OTP",
        html: `<h1>OTP: ${otp}</h1>`,
      });
      res.json({ message: "OTP sent" });
    } catch (mailErr) {
      console.error("MAIL ERROR:", mailErr);
      res.status(503).json({ message: "Email service failed" });
    }
  } catch (err) { next(err); }
};

// ... keep verifyOtp, resetPassword, and Profile functions as they were