const express = require("express");
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  updateAvatar, 
  updateLocation, 
  deleteAccount,
  updateNotificationSettings 
} = require("../controllers/authController"); 
const { protect } = require("../middleware/authMiddleware");

// #swagger.tags = ['Users']
/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 */
router.get("/me", protect, getProfile);

/**
 * @route   PUT /api/users/me
 * @desc    Update profile fields (name, phone, etc.)
 * @access  Private
 */
router.put("/me", protect, updateProfile);

/**
 * @route   PUT /api/users/me/avatar
 * @desc    Update profile picture
 * @access  Private
 */
router.put("/me/avatar", protect, updateAvatar);

/**
 * @route   PUT /api/users/me/location
 * @desc    Update GeoJSON coordinates
 * @access  Private
 */
router.put("/me/location", protect, updateLocation);

/**
 * @route   DELETE /api/users/me
 * @desc    Deactivate/Delete account
 * @access  Private
 */
router.delete("/me", protect, deleteAccount);

/**
 * @route   GET /api/users/notification-settings
 * @desc    Get user notification preferences
 * @access  Private
 */
router.get("/notification-settings", protect, getProfile); 

/**
 * @route   PUT /api/users/notification-settings
 * @desc    Update notification preferences
 * @access  Private
 */
router.put("/notification-settings", protect, updateNotificationSettings);

module.exports = router;