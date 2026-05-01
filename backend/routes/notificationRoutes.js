const express = require("express");
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  savePushToken,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getMyNotifications);
router.patch("/:notificationId/read", protect, markAsRead);
router.patch("/read-all", protect, markAllAsRead);
router.post("/push-token", protect, savePushToken);

module.exports = router;