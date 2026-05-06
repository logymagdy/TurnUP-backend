const express = require("express");
const router = express.Router();
// #swagger.tags = ['Loyalty']

const {
  getPointsHistory,
  getAvailableRewards,
  redeemReward,
} = require("../controllers/loyaltyController");
const { protect } = require("../middleware/authMiddleware");

router.get("/history", protect, getPointsHistory);
router.get("/rewards", protect, getAvailableRewards);
router.post("/redeem", protect, redeemReward);

module.exports = router;