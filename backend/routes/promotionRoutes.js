const express = require("express");
const router = express.Router();
// #swagger.tags = ['Promotions']

const {
  createPromotion,
  getStorePromotions,
  getActivePromotions,
  deactivatePromotion,
} = require("../controllers/promotionController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// ─── SERVICE PROVIDER ROUTES ──────────────────────────────────────────────────
router.post(
  "/create",
  protect,
  allowRoles("serviceProvider"),
  createPromotion
);

router.get(
  "/my-promotions",
  protect,
  allowRoles("serviceProvider"),
  getStorePromotions
);

router.patch(
  "/:promotionId/deactivate",
  protect,
  allowRoles("serviceProvider"),
  deactivatePromotion
);

// ─── CLIENT ROUTES ────────────────────────────────────────────────────────────
router.get(
  "/:storeId/active",
  protect,
  allowRoles("CLIENT"),
  getActivePromotions
);

module.exports = router;