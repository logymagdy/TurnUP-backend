const User = require("../models/userModel");
const { success, error } = require("../utils/responseHandler");

// ─── GET POINTS HISTORY ───────────────────────────────────────────────────────
exports.getPointsHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("points");
    if (!user) return res.status(404).json({ message: "User not found" });

    return success(res, "Loyalty data retrieved", {
      points: user.points,
    });
  } catch (err) {
    return error(res, "Failed to get loyalty data", 500);
  }
};

// ─── GET AVAILABLE REWARDS ────────────────────────────────────────────────────
exports.getAvailableRewards = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("points");
    if (!user) return res.status(404).json({ message: "User not found" });

    const rewards = [
      { id: 1, name: "10 EGP Discount", pointsRequired: 10 },
      { id: 2, name: "25 EGP Discount", pointsRequired: 25 },
      { id: 3, name: "50 EGP Discount", pointsRequired: 50 },
    ];

    const available = rewards.filter((r) => user.points >= r.pointsRequired);

    return success(res, "Rewards retrieved", { points: user.points, available });
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

    if (user.points < pointsToRedeem)
      return res.status(400).json({ message: "Insufficient points" });

    user.points -= pointsToRedeem;
    await user.save();

    return success(res, "Points redeemed successfully", {
      pointsRedeemed: pointsToRedeem,
      discountAmount: pointsToRedeem,
      remainingPoints: user.points,
    });
  } catch (err) {
    return error(res, "Failed to redeem reward", 500);
  }
};