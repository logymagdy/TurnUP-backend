const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
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
// #swagger.path = '/auth/register'
router.post("/register", registerUser);

// #swagger.tags = ['Auth']
// #swagger.path = '/auth/login'
router.post("/login", loginUser);

// #swagger.tags = ['Auth']
// #swagger.path = '/auth/google'
router.post("/google", googleLogin);

// #swagger.tags = ['Auth']
// #swagger.path = '/auth/facebook'
router.post("/facebook", facebookLogin);

// #swagger.tags = ['Auth']
// #swagger.path = '/auth/social-login'
router.post("/social-login", socialLogin);

// #swagger.tags = ['Auth']
// #swagger.path = '/auth/refresh-token'
router.post("/refresh-token", refreshToken);

// #swagger.tags = ['Auth']
// #swagger.path = '/auth/forgot-password'
router.post("/forgot-password", forgotPassword);

// #swagger.tags = ['Auth']
// #swagger.path = '/auth/verify-otp'
router.post("/verify-otp", verifyOtp);

// #swagger.tags = ['Auth']
// #swagger.path = '/auth/reset-password'
router.post("/reset-password", resetPassword);

// #swagger.tags = ['Auth']
// #swagger.path = '/auth/resend-otp'
router.post("/resend-otp", resendOtp);

// #swagger.tags = ['Auth']
// #swagger.path = '/auth/logout'
router.post("/logout", protect, logout);

module.exports = router;