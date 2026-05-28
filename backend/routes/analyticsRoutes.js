const express = require("express");
const router = express.Router();
// #swagger.tags = ['Analytics']

const {
  getStoreAnalytics,
  getBusinessDashboard,
} = require("../controllers/analyticsController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// ─── BUSINESS DASHBOARD ───────────────────────────────────────────────────────
/**
 * @route   GET /api/analytics/business-dashboard
 * @desc    Main dashboard: store name, today stats, weekly chart,
 *          specialists, day schedule, top performer
 * @access  serviceProvider only
 */
router.get(
  "/business-dashboard",
  protect,
  allowRoles("serviceProvider"),
  getBusinessDashboard
);

// ─── DEEP STORE ANALYTICS ─────────────────────────────────────────────────────
/**
 * @route   GET /api/analytics/dashboard-stats
 * @desc    Full analytics: revenue, bookings, peak hours, top services,
 *          stylist performance
 * @access  serviceProvider only
 */
router.get(
  "/dashboard-stats",
  protect,
  allowRoles("serviceProvider"),
  getStoreAnalytics
);

module.exports = router;