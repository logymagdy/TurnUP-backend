const express = require("express");
const router = express.Router();
// #swagger.tags = ['Notifications']

const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  savePushToken,
  getUnreadCount,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getMyNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.patch("/:notificationId/read", protect, markAsRead);
router.patch("/read-all", protect, markAllAsRead);
router.post("/push-token", protect, savePushToken);

module.exports = router;