const express = require("express");
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getStoreBookings,
  cancelBooking,
  cancelBookingByStore,
  startService,
  completeService,
  markNoShow,
  submitRating,
} = require("../controllers/bookingController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// ─── CLIENT ROUTES ────────────────────────────────────────────────────────────
// #swagger.tags = ['Booking']

router.post("/create", protect, allowRoles("CLIENT"), createBooking);
router.get("/my-bookings", protect, allowRoles("CLIENT"), getMyBookings);
router.put("/:bookingId/cancel", protect, allowRoles("CLIENT"), cancelBooking);
router.post("/:bookingId/rate", protect, allowRoles("CLIENT"), submitRating);

// ─── STORE ROUTES ─────────────────────────────────────────────────────────────
router.get(
  "/store-bookings",
  protect,
  allowRoles("serviceProvider", "RECEPTIONIST"),
  getStoreBookings
);

router.put(
  "/:bookingId/cancel-by-store",
  protect,
  allowRoles("serviceProvider"),
  cancelBookingByStore
);

// ─── RECEPTIONIST ROUTES ──────────────────────────────────────────────────────
router.put(
  "/:bookingId/start",
  protect,
  allowRoles("RECEPTIONIST"),
  startService
);

router.put(
  "/:bookingId/complete",
  protect,
  allowRoles("RECEPTIONIST"),
  completeService
);

router.put(
  "/:bookingId/no-show",
  protect,
  allowRoles("RECEPTIONIST"),
  markNoShow
);

module.exports = router;