const express = require("express");
const router = express.Router();
// #swagger.tags = ['Admin']

const {
  approveStore,
  getPendingStores,
  moderateStore,
  getModerationLog,
  getSubscriptionOverview,
  manuallyChargeSubscription,
  getAdminDashboard,
} = require("../controllers/adminController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// ─── STORE APPROVAL ───────────────────────────────────────────────────────────
router.get("/stores/pending", protect, allowRoles("ADMIN"), getPendingStores);
router.post("/stores/approve", protect, allowRoles("ADMIN"), approveStore);

// ─── STORE MODERATION ─────────────────────────────────────────────────────────
router.post("/store/:storeId/moderate", protect, allowRoles("ADMIN"), moderateStore);
router.get("/store/:storeId/moderation-log", protect, allowRoles("ADMIN"), getModerationLog);

// ─── SUBSCRIPTION MANAGEMENT ──────────────────────────────────────────────────
router.get("/subscriptions", protect, allowRoles("ADMIN"), getSubscriptionOverview);
router.post("/store/:storeId/charge-subscription", protect, allowRoles("ADMIN"), manuallyChargeSubscription);

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
router.get("/dashboard", protect, allowRoles("ADMIN"), getAdminDashboard);

module.exports = router;