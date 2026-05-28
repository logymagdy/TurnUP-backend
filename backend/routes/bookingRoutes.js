const express = require("express");
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingHistory,
  getBookingDetails,
  getReceipt,
  getRebookData,
  getStoreBookings,
  cancelBooking,
  cancelBookingByStore,
  startService,
  completeService,
  markNoShow,
  submitRating,
} = require("../controllers/bookingController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// #swagger.tags = ['Booking']

// ─── CLIENT ───────────────────────────────────────────────────────────────────
router.post("/create", protect, allowRoles("CLIENT"), createBooking);
router.get("/my-bookings", protect, allowRoles("CLIENT"), getMyBookings);
router.get("/history", protect, allowRoles("CLIENT"), getBookingHistory);
router.get("/:bookingId/details", protect, allowRoles("CLIENT"), getBookingDetails);
router.get("/:bookingId/receipt", protect, allowRoles("CLIENT"), getReceipt);
router.get("/:bookingId/rebook", protect, allowRoles("CLIENT"), getRebookData);
router.put("/:bookingId/cancel", protect, allowRoles("CLIENT"), cancelBooking);
router.post("/:bookingId/rate", protect, allowRoles("CLIENT"), submitRating);

// ─── STORE (serviceProvider only) ────────────────────────────────────────────
router.put(
  "/:bookingId/cancel-by-store",
  protect,
  allowRoles("serviceProvider"),
  cancelBookingByStore
);

// ─── STORE BOOKING HISTORY ────────────────────────────────────────────────────
// ?filter=all|today|week — groups by MORNING/AFTERNOON/EVENING
// Access: serviceProvider + RECEPTIONIST
router.get(
  "/store-bookings",
  protect,
  allowRoles("serviceProvider", "RECEPTIONIST"),
  getStoreBookings
);

// ─── QUEUE ACTIONS (RECEPTIONIST + serviceProvider) ───────────────────────────
// Start/complete/no-show — available to both receptionist and store owner
router.put(
  "/:bookingId/start",
  protect,
  allowRoles("RECEPTIONIST", "serviceProvider"),
  startService
);
router.put(
  "/:bookingId/complete",
  protect,
  allowRoles("RECEPTIONIST", "serviceProvider"),
  completeService
);
router.put(
  "/:bookingId/no-show",
  protect,
  allowRoles("RECEPTIONIST", "serviceProvider"),
  markNoShow
);

module.exports = router;