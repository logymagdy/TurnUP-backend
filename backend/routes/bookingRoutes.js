const express = require("express");
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getStoreBookings,
  cancelBooking,
} = require("../controllers/bookingController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// ─── CLIENT ROUTES ────────────────────────────────────────────────────────────
router.post("/create", protect, createBooking);
router.get("/my-bookings", protect, getMyBookings);
router.put("/:bookingId/cancel", protect, cancelBooking);

// ─── STORE ROUTES ─────────────────────────────────────────────────────────────
router.get(
  "/store-bookings",
  protect,
  allowRoles("serviceProvider", "RECEPTIONIST"),
  getStoreBookings
);

module.exports = router;