const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  updatePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/update-password", updatePassword);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;