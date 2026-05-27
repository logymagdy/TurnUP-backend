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

// ─── STORE ────────────────────────────────────────────────────────────────────
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

// ─── RECEPTIONIST ─────────────────────────────────────────────────────────────
router.put("/:bookingId/start", protect, allowRoles("RECEPTIONIST"), startService);
router.put("/:bookingId/complete", protect, allowRoles("RECEPTIONIST"), completeService);
router.put("/:bookingId/no-show", protect, allowRoles("RECEPTIONIST"), markNoShow);

module.exports = router;