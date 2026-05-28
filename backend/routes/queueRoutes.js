const express = require("express");
const router = express.Router();
const { getLiveQueue } = require("../controllers/queueController");
const { protect, allowRoles } = require("../middleware/authMiddleware");
// #swagger.tags = ['Queue']

// ─── LIVE QUEUE ───────────────────────────────────────────────────────────────
// Returns: isShiftActive, queue stats (totalInQueue, activeCount),
//          entries with client name, stylist name (from store subdoc), status, timer
// "Start Day" button state = isShiftActive
// Queue list = entries array
// Access: RECEPTIONIST + serviceProvider
router.get(
  "/live",
  protect,
  allowRoles("RECEPTIONIST", "serviceProvider"),
  getLiveQueue
);

module.exports = router;