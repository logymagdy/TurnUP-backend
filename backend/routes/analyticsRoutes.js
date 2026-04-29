const express = require("express");
const router = express.Router();
const { getStoreAnalytics } = require("../controllers/analyticsController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

/**
 * @route   GET /api/analytics/dashboard-stats
 * @desc    Get store-specific analytics (Revenue, Appointments, Customers)
 * @access  ServiceProvider Only
 */
router.get(
  "/dashboard-stats", 
  protect, 
  allowRoles("serviceProvider"), 
  getStoreAnalytics
);

module.exports = router;