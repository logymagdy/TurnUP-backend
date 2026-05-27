const User = require("../models/userModel");
const Appointment = require("../models/appointmentModel");
const WalletTransaction = require("../models/walletTransactionModel");
const { success, error } = require("../utils/responseHandler");

// ─── GET POINTS & HISTORY ─────────────────────────────────────────────────────
exports.getPointsHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "points loyaltyTier visitCount"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Get earning history from completed appointments
    const earnedHistory = await Appointment.find({
      client: req.user.id,
      status: "DONE",
      rating: { $exists: true },
    })
      .select("totalAmount date storeId")
      .populate("storeId", "storeName logo")
      .sort({ createdAt: -1 })
      .limit(20);

    const history = earnedHistory.map((a) => ({
      type: "EARNED",
      points: Math.floor(a.totalAmount || 0),
      date: a.date,
      store: a.storeId,
    }));

    return success(res, "Loyalty data retrieved", {
      points: user.points,
      loyaltyTier: user.loyaltyTier,
      visitCount: user.visitCount,
      history,
    });
  } catch (err) {
    return error(res, "Failed to get loyalty data", 500);
  }
};

// ─── GET AVAILABLE REWARDS ────────────────────────────────────────────────────
// ✅ Rewards are store-based promotions — redeemable with points
exports.getAvailableRewards = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("points");
    if (!user) return res.status(404).json({ message: "User not found" });

    const Promotion = require("../models/promotionModel");
    const now = new Date();

    // Get all active promotions
    const promotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate("storeId", "storeName logo location");

    // ✅ Map promotions to reward cards with points required
    // Points required = discountPercentage * 10 (e.g. 20% off = 200 pts)
    const rewards = promotions
      .filter((p) => p.storeId) // only valid stores
      .map((p) => ({
        rewardId: p._id,
        storeId: p.storeId._id,
        storeName: p.storeId.storeName,
        storeLogo: p.storeId.logo,
        storeLocation: p.storeId.location,
        discountPercentage: p.discountPercentage,
        description: p.description,
        services: p.services,
        pointsRequired: p.discountPercentage * 10,
        pointsLeft: Math.max(
          0,
          p.discountPercentage * 10 - user.points
        ),
        isUnlocked: user.points >= p.discountPercentage * 10,
        endDate: p.endDate,
      }));

    return success(res, "Rewards retrieved", {
      points: user.points,
      rewards,
    });
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