const express = require("express");
const router = express.Router();
// #swagger.tags = ['Admin']

const {
  approveStore,
  getPendingStores,
  moderateStore,
  getModerationLog,
} = require("../controllers/adminController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// ─── STORE APPROVAL SYSTEM (onboarding only) ──────────────────────────────────
router.get("/stores/pending", protect, allowRoles("ADMIN"), getPendingStores);
router.post("/stores/approve", protect, allowRoles("ADMIN"), approveStore);

// ─── MODERATION SYSTEM (post-approval, live stores) ──────────────────────────
router.post(
  "/store/:storeId/moderate",
  protect,
  allowRoles("ADMIN"),
  moderateStore
);
router.get(
  "/store/:storeId/moderation-log",
  protect,
  allowRoles("ADMIN"),
  getModerationLog
);

module.exports = router;