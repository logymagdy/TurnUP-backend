const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateAvatar,
  updateLocation,
  deleteAccount,
  updateNotificationSettings,
  getFavorites,
  toggleFavorite,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// #swagger.tags = ['Users']

router.get("/me", protect, getProfile);
router.put("/me", protect, updateProfile);
router.put("/me/avatar", protect, updateAvatar);
router.put("/me/location", protect, updateLocation);
router.delete("/me", protect, deleteAccount);

// ─── NOTIFICATION SETTINGS ────────────────────────────────────────────────────
router.get("/notification-settings", protect, getProfile);
router.put("/notification-settings", protect, updateNotificationSettings);

// ─── FAVORITES ────────────────────────────────────────────────────────────────
router.get("/favorites", protect, getFavorites);
router.post("/favorites/:storeId", protect, toggleFavorite);

module.exports = router;