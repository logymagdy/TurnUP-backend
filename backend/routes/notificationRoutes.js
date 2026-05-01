const express = require("express");
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.get("/", protect, getMyNotifications);
router.patch("/:notificationId/read", protect, markAsRead);
router.patch("/read-all", protect, markAllAsRead);

module.exports = router;