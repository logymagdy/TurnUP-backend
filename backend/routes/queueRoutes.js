const express = require("express");
const router = express.Router();
const { getLiveQueue } = require("../controllers/queueController");
const { protect, allowRoles } = require("../middleware/authMiddleware");
// #swagger.tags = ['Queue']
// RECEPTIONIST or serviceProvider views live queue
router.get(
  "/live",
  protect,
  allowRoles("RECEPTIONIST", "serviceProvider"),
  getLiveQueue
);

module.exports = router;