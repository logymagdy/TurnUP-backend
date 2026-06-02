const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  loginBusiness,
  loginReceptionist,
  registerReceptionist,
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
// ✅ "Create Account" on receptionist login screen → sets role: RECEPTIONIST
router.post("/receptionist/register", registerReceptionist);
// ✅ "Sign In" on receptionist login screen
router.post("/receptionist/login", loginReceptionist);

// ─── SHARED ───────────────────────────────────────────────────────────────────
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/resend-otp", resendOtp);
router.post("/logout", protect, logout);

module.exports = router;