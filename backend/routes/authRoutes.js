const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  loginBusiness,
  loginReceptionist,
  googleLogin,
  facebookLogin,
  socialLogin,
  logout,
  refreshToken,
  forgotPassword,
  verifyOtp,
  resetPassword,
  resendOtp,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/userModel");

// #swagger.tags = ['Auth']

// ─── CLIENT AUTH ──────────────────────────────────────────────────────────────
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/facebook", facebookLogin);
router.post("/social-login", socialLogin);

// ─── BUSINESS AUTH ────────────────────────────────────────────────────────────
router.post("/business/login", loginBusiness);

// ─── RECEPTIONIST AUTH ────────────────────────────────────────────────────────
router.post("/receptionist/login", loginReceptionist);

// ─── SHARED ───────────────────────────────────────────────────────────────────
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/resend-otp", resendOtp);
router.post("/logout", protect, logout);

// ─── TEMPORARY: Fix null referral codes for existing users ───────────────────
// ⚠️ Run once then delete this route
router.post("/fix-referral-codes", protect, async (req, res) => {
  try {
    const { generateReferralCode } = require("../utils/generateReferralCode");
    const users = await User.find({ role: "CLIENT", referralCode: null });
    let count = 0;
    for (const user of users) {
      let unique = false;
      let code;
      while (!unique) {
        code = generateReferralCode();
        const clash = await User.findOne({ referralCode: code });
        if (!clash) unique = true;
      }
      user.referralCode = code;
      await user.save();
      count++;
    }
    res.json({ message: `Fixed ${count} users`, count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;