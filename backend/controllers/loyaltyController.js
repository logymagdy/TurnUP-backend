const User = require("../models/userModel");
const { success, error } = require("../utils/responseHandler");

// ─── GET POINTS HISTORY ───────────────────────────────────────────────────────
exports.getPointsHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "loyaltyPoints loyaltyTier visitCount"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    return success(res, "Loyalty data retrieved", {
      loyaltyPoints: user.loyaltyPoints,
      loyaltyTier: user.loyaltyTier,
      visitCount: user.visitCount,
    });
  } catch (err) {
    return error(res, "Failed to get loyalty data", 500);
  }
};

// ─── GET AVAILABLE REWARDS ────────────────────────────────────────────────────
exports.getAvailableRewards = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("loyaltyPoints loyaltyTier");
    if (!user) return res.status(404).json({ message: "User not found" });

    const rewards = [
      { id: 1, name: "10 EGP Discount", pointsRequired: 10, tier: "BRONZE" },
      { id: 2, name: "25 EGP Discount", pointsRequired: 25, tier: "SILVER" },
      { id: 3, name: "50 EGP Discount", pointsRequired: 50, tier: "GOLD" },
    ];

    const available = rewards.filter(
      (r) => user.loyaltyPoints >= r.pointsRequired
    );

    return success(res, "Rewards retrieved", available);
  } catch (err) {
    return error(res, "Failed to get rewards", 500);
  }
};

// ─── REDEEM REWARD ────────────────────────────────────────────────────────────
exports.redeemReward = async (req, res) => {
  try {
    const { pointsToRedeem } = req.body;

    if (!pointsToRedeem || pointsToRedeem <= 0)
      return res.status(400).json({ message: "Invalid points amount" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.loyaltyPoints < pointsToRedeem)
      return res.status(400).json({ message: "Insufficient points" });

    // Max discount is 50% enforced on frontend
    user.loyaltyPoints -= pointsToRedeem;
    await user.save();

    return success(res, "Points redeemed successfully", {
      pointsRedeemed: pointsToRedeem,
      discountAmount: pointsToRedeem,
      remainingPoints: user.loyaltyPoints,
    });
  } catch (err) {
    return error(res, "Failed to redeem reward", 500);
  }
};