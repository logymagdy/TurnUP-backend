const Promotion = require("../models/promotionModel");
const Store = require("../models/storeModel");
const User = require("../models/userModel");
const { sendBulkNotification } = require("../services/notificationServices");

// ─── CREATE PROMOTION ─────────────────────────────────────────────────────────
exports.createPromotion = async (req, res) => {
  try {
    const {
      discountPercentage,
      services,
      startDate,
      endDate,
      description,
    } = req.body;

    const store = await Store.findById(req.user.storeId);
    if (!store)
      return res.status(404).json({ message: "Store not found." });

    if (!discountPercentage || discountPercentage <= 0 || discountPercentage > 100)
      return res.status(400).json({ message: "Invalid discount percentage." });

    if (!startDate || !endDate)
      return res.status(400).json({ message: "Start and end date are required." });

    if (new Date(endDate) <= new Date(startDate))
      return res.status(400).json({ message: "End date must be after start date." });

    const promotion = await Promotion.create({
      storeId: req.user.storeId,
      discountPercentage,
      services: services || [],
      startDate,
      endDate,
      description: description || null,
      isActive: true,
    });

    // Find clients in same city who previously visited this store
    const previousClients = await User.find({
      _id: {
        $in: await require("../models/appointmentModel")
          .distinct("client", {
            storeId: req.user.storeId,
            status: "DONE",
          }),
      },
    }).select("_id");

    const clientIds = previousClients.map((c) => c._id.toString());

    // Send bulk push notification to all previous clients
    if (clientIds.length > 0) {
      await sendBulkNotification(
        clientIds,
        "PROMOTION",
        `${store.storeName} has a new promotion! ${discountPercentage}% off. Book now!`,
        `New Promotion at ${store.storeName}`,
        promotion._id,
        "STORE"
      );
    }

    return res.status(201).json({
      message: "Promotion created and clients notified.",
      promotion,
      notifiedClients: clientIds.length,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET STORE PROMOTIONS ─────────────────────────────────────────────────────
exports.getStorePromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find({
      storeId: req.user.storeId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Promotions retrieved.",
      promotions,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET ACTIVE PROMOTIONS FOR A STORE (CLIENT VIEW) ─────────────────────────
exports.getActivePromotions = async (req, res) => {
  try {
    const { storeId } = req.params;
    const now = new Date();

    const promotions = await Promotion.find({
      storeId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    return res.status(200).json({
      message: "Active promotions retrieved.",
      promotions,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── DEACTIVATE PROMOTION ─────────────────────────────────────────────────────
exports.deactivatePromotion = async (req, res) => {
  try {
    const { promotionId } = req.params;

    const promotion = await Promotion.findOneAndUpdate(
      { _id: promotionId, storeId: req.user.storeId },
      { isActive: false },
      { new: true }
    );

    if (!promotion)
      return res.status(404).json({ message: "Promotion not found." });

    return res.status(200).json({
      message: "Promotion deactivated.",
      promotion,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};